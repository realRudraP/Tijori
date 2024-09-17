import React, { useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import '../App.css'

function Login({ setUser, isDarkTheme, toggleTheme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const serverURL = "http://192.168.1.12:6953";

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const loginResponse = await fetch(`${serverURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.statusText}`);
      }

      const loginData = await loginResponse.json();

      // Fetch user data immediately after successful login
      const userDataResponse = await fetch(`${serverURL}/user/data`, {
        method: "GET",
        credentials: 'include',
      });

      if (!userDataResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userDataResponse.statusText}`);
      }

      const userData = await userDataResponse.json();
      

      // Set user data in the app state
      setUser(userData);

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect based on user role
      if (userData.role === 'shopOwner') {
        navigate("/shopkeeperDashboard");
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <>
      <Navbar isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem 12%",
        }}
      >
        <img src="mafia-nobg.png" style={{ width: "100%", maxWidth: "400px", marginBottom: "2rem" }} alt="Logo" />
        <form onSubmit={handleLogin} style={{ width: "100%", maxWidth: "400px" }}>
          <div className="form-group mb-4">
            <label htmlFor="inputEmail">Email address</label>
            <input
              type="email"
              className="form-control"
              id="inputEmail"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="inputPassword">Password</label>
            <input
              type="password"
              className="form-control"
              id="inputPassword"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 rounded-pill">
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default Login;