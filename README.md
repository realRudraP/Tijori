# The Tijori Web App

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [Usage](#usage)
7. [API Endpoints](#api-endpoints)
8. [Security](#security)
9. [Contributing](#contributing)
10. [License](#license)

## Project Overview

The Tijori Web App is a digital payment solution designed for single-day university events. It streamlines transactions between freshers (new students) and shopkeepers (event vendors) by providing a QR code-based payment system. This eliminates the need for cash transactions and offers real-time balance tracking and transaction monitoring.

### Problem Statement

During university events, tracking payments between freshers and shopkeepers was inefficient. Freshers had preloaded balances, but there was no convenient, digital way for shopkeepers to accept payments without relying on cash or physical tokens.

### Solution
Developed a web-based payment system where freshers can scan QR codes to make payments at event stalls, and shopkeepers can monitor their transactions in real-time. The system is designed for minimal interaction from shopkeepers, making the payment process quick and easy.

## Features

1. **QR Code-based Payments**: Freshers can scan a shop's QR code, enter the amount to be paid, and complete the transaction.
2. **Balance Tracking**: Each fresher's balance is tracked and updated on a backend server after each transaction.
3. **Shopkeeper Dashboard**: Shopkeepers can view a list of transactions, including the amount, the nickname of the fresher, and the time of the transaction.
4. **Real-time Notifications**: Shopkeepers receive real-time transaction notifications after a payment is made.
5. **JWT Authentication**: Secure login using HTTP-only JWTs for both freshers and shopkeepers.
6. **Event "Over" State**: After the event ends, the app is put into a read-only state where no new payments can be made.

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: SQL (specific implementation not specified in the provided code)
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Styling**: Bootstrap and custom CSS
- **Icons**: Bootstrap Icons

## Project Structure

The project is divided into frontend and backend:

### Frontend

- `App.js`: Main component handling routing and authentication
- `components/`:
  - `Home.js`: Dashboard for freshers
  - `Login.js`: User authentication component
  - `Scanner.js`: QR code scanner component
  - `Payment.js`: Payment processing component
  - `PaymentConfirmation.js`: Confirmation page after successful payment
  - `ShopkeeperDashboard.js`: Dashboard for shopkeepers
  - `Navbar.js`: Navigation component

### Backend

- `server.js`: Main Express server file
- Routes for:
  - User authentication
  - User data retrieval
  - Payment processing
  - Transaction history
- SSE endpoint for real-time updates

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/realRudraP/Tijori.git
   ```

2. Install dependencies for both frontend and backend:
   ```
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. Set up your environment variables:
   - Create a `.env` file in the backend directory
   - Add necessary variables (e.g., `JWT_SECRET_KEY`, database connection strings)

4. Set up your database and run any necessary migrations

## Usage

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Access the application in your web browser at `http://localhost:3000`

## API Endpoints

- `/auth/login`: POST - User login
- `/admin/addUser`: POST - Add a new user (admin only)
- `/user/data`: GET - Retrieve user data
- `/auth/logout`: POST - User logout
- `/api/check-auth`: GET - Check authentication status
- `/shopkeeper/transactions`: GET - Retrieve shopkeeper transactions
- `/user/pay`: POST - Process a payment

## Security

- JWT authentication with HTTP-only cookies
- CORS configuration to restrict access to trusted origins
- Input validation using express-validator
- Secure password hashing using bcrypt

## Contributing

Contributions to improve the University Event Payment Web App are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
