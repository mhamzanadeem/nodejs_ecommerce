/*
=============================================
  FILE: server.js
  PURPOSE: Entry point of the backend application
  DESCRIPTION:
    This is the main server file that:
    1. Loads environment variables from config.env
    2. Connects to the MongoDB database
    3. Starts the Express server on the specified PORT
    Run this file to start the backend: `node backend/server.js`
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const app = require('./app')                  // The configured Express app
const dotenv = require("dotenv")              // Loads .env variables into process.env
const connectDatabase = require("./config/database") // MongoDB connection function

// =============================================
// LOAD ENVIRONMENT VARIABLES
//   Reads backend/config/config.env file and
//   populates process.env with key-value pairs
// =============================================
dotenv.config({path:"backend/config/config.env"})

// =============================================
// DATABASE CONNECTION
//   Establishes connection to MongoDB using
//   the DB_URI from environment variables
// =============================================
connectDatabase()
 
// =============================================
// START SERVER
//   Listens for incoming requests on the
//   configured PORT (from config.env)
// =============================================
app.listen(process.env.PORT, () => {
    console.log(`Server is working on http://localhost:${process.env.PORT}`)
})
