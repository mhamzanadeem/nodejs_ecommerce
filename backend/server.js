/*
=============================================
  FILE: server.js
  PURPOSE: Entry point of the backend application
  DESCRIPTION:
    This is the main server file that:
    1. Loads environment variables from config.env
    2. Connects to the MongoDB database
    3. Starts the Express server on the specified PORT
    4. Registers global error handlers for:
       - Unhandled exceptions (synchronous errors)
       - Unhandled promise rejections (async errors)
    Run this file to start the backend: `node backend/server.js`
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const app = require("./app"); // The configured Express app
const dotenv = require("dotenv"); // Loads .env variables into process.env
const connectDatabase = require("./config/database"); // MongoDB connection function

// =============================================
// GLOBAL ERROR HANDLER: Unhandled Exceptions
//   Catches synchronous errors that are not caught
//   anywhere in the code (e.g., coding mistakes).
//   Logs the error message and shuts down the server
//   immediately with exit code 1 (failure).
//
//   NOTE: After this event fires, the process is
//   terminated — no further requests are handled.
// =============================================
process.on("unhandledException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to unhandled Exception`);
  process.exit(1);
});

// =============================================
// LOAD ENVIRONMENT VARIABLES
//   Reads backend/config/config.env file and
//   populates process.env with key-value pairs.
//   Must be called BEFORE accessing any env vars
//   (e.g., DB_URI, PORT, JWT_SECRET).
// =============================================
dotenv.config({ path: "backend/config/config.env" });

// =============================================
// DATABASE CONNECTION
//   Establishes connection to MongoDB using
//   the DB_URI from environment variables.
//   Must complete before starting the server.
// =============================================
connectDatabase();

// =============================================
// START SERVER
//   Listens for incoming HTTP requests on the
//   configured PORT (from config.env). Returns
//   a server instance used by the graceful
//   shutdown handler below.
// =============================================
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

// =============================================
// GLOBAL ERROR HANDLER: Unhandled Promise Rejections
//   Catches async errors that are not caught by
//   catchAsyncErrors middleware (e.g., database
//   connection failures, unhandled rejections).
//
//   Unlike unhandledException, this handler performs
//   a graceful shutdown:
//     1. Logs the error message
//     2. Waits for the server to finish pending requests
//     3. Then exits with code 1
//
//   This prevents the server from continuing in an
//   undefined/broken state.
// =============================================
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
