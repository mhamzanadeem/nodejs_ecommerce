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
const mongoose = require("mongoose")

// =============================================
// CREATE: Database Connection Function
//   Uses mongoose.connect() with the DB_URI
//   environment variable. Handles success/error
//   via .then() and .catch() promises.
// =============================================
const connectDatabase = () => { mongoose.connect(process.env.DB_URI).then((data) => { console.log(`Mongodb connect with server: ${data.connection.host}`) }).catch((err) => { console.log(err) }) }

// =============================================
// EXPORT: Connect function to be called in server.js
// =============================================
module.exports = connectDatabase
