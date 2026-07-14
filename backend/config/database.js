/*
=============================================
  FILE: database.js
  PURPOSE: MongoDB database connection setup
  DESCRIPTION:
    Exports a function that connects to MongoDB
    using Mongoose. The connection URI is read
    from the DB_URI environment variable (set in config.env).
    On success, logs the connected host.
    On failure, logs the error to the console.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const mongoose = require("mongoose");

// =============================================
// FUNCTION: connectDatabase
//   Establishes a connection to MongoDB using the
//   Mongoose ODM. The connection string (DB_URI) is
//   read from environment variables loaded by dotenv.
//
//   Flow:
//     1. Calls mongoose.connect() with the DB_URI
//     2. On success (.then), logs the connected host
//        name to confirm the connection
//     3. On failure (.catch), the error propagates
//        to the unhandledRejection handler in server.js
//
//   Usage:
//     Called once in server.js before starting the Express server.
//     connectDatabase();
// =============================================
const connectDatabase = () => {
  mongoose.connect(process.env.DB_URI).then((data) => {
    console.log(`Mongodb connect with server: ${data.connection.host}`);
  });
};

// =============================================
// EXPORT: Connect function to be called in server.js
// =============================================
module.exports = connectDatabase;
