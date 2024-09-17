const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const { generateFromEmail } = require("unique-username-generator");
const jwt = require("jsonwebtoken");
const pool = require("./db"); // Adjust the import to match your actual DB setup

require("dotenv").config();
const app = express();
const port = 6953;
const saltRounds = 10;

let clients = [];

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_CORS,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Validation rules for adding a user
const addUserValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["admin", "fresher", "shopOwner"]),
];

// Authentication middleware for shop owners
const authenticateShopOwner = (req, res, next) => {
  const token = req.cookies.logonJWT;
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    if (decoded.role !== "shopOwner") {
      return res.status(403).json({ message: "Insufficient role to access this resource" });
    }
    req.user = decoded;
    next();
  });
};


// SSE endpoint to send events to clients
app.get("/events", authenticateShopOwner, (req, res) => {
  const shopOwnerId = req.user.userId;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { response: res, shopOwnerId };
  clients.push(client);

  req.on('close', () => {
    clients = clients.filter(c => c !== client);
  });
});

// Function to send events to specific shop owner clients
const sendEventToShopOwner = (shopOwnerId, eventData) => {
  clients.forEach(client => {
    if (client.shopOwnerId === shopOwnerId) {
      client.response.write(`data: ${JSON.stringify(eventData)}\n\n`);
    }
  });
};

// Route to hash a string using bcrypt
app.get(" /:string", async (req, res) => {
  const hashed = bcrypt.hashSync(req.params.string, saltRounds);
  res.json(hashed);
});

// User login route
app.post("/auth/login", async (req, res) => {
  try {
    const { username: email, password } = req.body;
    const userResult = await pool.query(
      "SELECT user_id, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const { user_id, password_hash, role } = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { userId: user_id, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "10h" });

    res.cookie("logonJWT", token, { httpOnly: true });
    res.json({ message: "Login Successful", email, userId: user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to add a new user
app.post("/admin/addUser", addUserValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const authCookie = req.cookies.logonJWT;
    if (!authCookie) {
      return res.status(401).json({ message: "Unauthorized: No authentication token provided" });
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET_KEY);
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userID = randomstring.generate(10);

    await pool.query(
      "INSERT INTO users (user_id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [userID, email, hashedPassword, role]
    );

    if (role === "fresher") {
      const nickname = generateFromEmail(email, 3);
      await pool.query(
        "INSERT INTO freshers (user_id, balance, nickname) VALUES ($1, $2, $3)",
        [userID, 200, nickname]
      );
    }

    res.status(201).json({ message: "User added successfully", userId: userID });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get user data
app.get("/user/data", async (req, res) => {
  try {
    const authCookie = req.cookies.logonJWT;
    if (!authCookie) {
      return res.status(401).json({ message: "Unauthorized: No authentication token provided" });
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded.userId || !decoded.role) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const { userId, role } = decoded;
    let userData;

    if (role === 'fresher') {
      const result = await pool.query(
        "SELECT nickname, balance FROM freshers WHERE user_id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User data not found" });
      }
      userData = result.rows[0];
    } else if (role === 'shopOwner') {
      const result = await pool.query(
        "SELECT shop_name, balance FROM shopowners WHERE user_id = $1",
        [userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User data not found" });
      }
      userData = result.rows[0];
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    res.json({ role, ...userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/auth/logout",(req,res)=>{
  res.clearCookie('logonJWT');
  res.status(200).json({message:"Logout approved"});
})

app.get("/api/check-auth", (req, res) => {
  const token = req.cookies.logonJWT;

  if (!token) {
    return res.status(401).json({ 
      authenticated: false, 
      error: "Access denied. No token provided." 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        authenticated: false, 
        error: "Invalid token" 
      });
    }

    res.status(200).json({
      authenticated: true,
      user: {
        userId: decoded.userId,
        role: decoded.role
        
      }
    });
  });
});

// Route to get shopkeeper transactions
app.get("/shopkeeper/transactions", async (req, res) => {
  try {
    const authCookie = req.cookies.logonJWT;
    if (!authCookie) {
      return res.status(401).json({ message: "Unauthorized: No authentication token provided" });
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded.userId || !decoded.role) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const shopID = decoded.userId;
    const query = `
      SELECT t.amount, t.transaction_time, t.fresher_id, f.nickname
      FROM transactions t
      JOIN freshers f ON t.fresher_id = f.user_id
      WHERE t.shop_owner_id = $1
      ORDER BY t.transaction_time DESC;
    `;
    const result = await pool.query(query, [shopID]);

    res.status(200).json({ transactions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to handle user payments
app.post("/user/pay", async (req, res) => {
  const { amount, user_id } = req.body;

  try {
    const authCookie = req.cookies.logonJWT;
    if (!authCookie) {
      return res.status(401).json({ message: "Unauthorized: No authentication token provided" });
    }

    const decoded = jwt.verify(authCookie, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded.userId || !decoded.role) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const fresherID = decoded.userId;

    // Check fresher's balance
    const balanceResult = await pool.query(
      "SELECT balance FROM freshers WHERE user_id = $1",
      [fresherID]
    );

    if (balanceResult.rows.length === 0) {
      return res.status(404).json({ message: "User balance not found" });
    }

    const balance = balanceResult.rows[0].balance;
    
    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Update fresher's balance
    const newBalance = balance - amount;
    await pool.query(
      "UPDATE freshers SET balance = $1 WHERE user_id = $2",
      [newBalance, fresherID]
    );

    // Fetch fresher's nickname
    const fresherResult = await pool.query(
      "SELECT nickname FROM freshers WHERE user_id = $1",
      [fresherID]
    );

    if (fresherResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: "Fresher nickname not found" });
    }

    const fresherNickname = fresherResult.rows[0].nickname;

    // Update shop owner's balance
    const shopBalanceResult = await pool.query(
      "SELECT balance FROM shopowners WHERE user_id = $1",
      [user_id]
    );

    if (shopBalanceResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(414).json({ message: "Shop owner not found" });
    }

    const newShopBalance = Number(shopBalanceResult.rows[0].balance) + Number(amount);
    await pool.query(
      "UPDATE shopowners SET balance = $1 WHERE user_id = $2",
      [newShopBalance, user_id]
    );

    // Record transaction
    await pool.query(
      "INSERT INTO transactions (fresher_id, shop_owner_id, amount) VALUES ($1, $2, $3)",
      [fresherID, user_id, amount]
    );

    // Commit transaction
    await pool.query('COMMIT');

    // Create event data
    const eventData = {
      fresher_id: fresherID,
      shop_owner_id: user_id,
      amount,
      transaction_time: new Date().toISOString(),
      nickname: fresherNickname
    };

    // Notify clients
    sendEventToShopOwner(user_id, eventData);

    res.status(200).json({ message: "Transaction successful" });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
app.listen(port, process.env.SERVER_URL, () => {
  console.log(`Server listening on port ${port}`);
});