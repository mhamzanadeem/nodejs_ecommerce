/*
=============================================
  FILE: userRoute.js
  PURPOSE: Define API routes for user authentication endpoints
  DESCRIPTION:
    Sets up Express Router and maps HTTP methods
    to their corresponding controller functions.
    Current routes:
      POST /register -> registerUser (Create new account)
      POST /login    -> loginUser    (Authenticate user)
    This router is mounted in app.js under "/api/v1".
    So the full URLs become:
      POST /api/v1/register
      POST /api/v1/login
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const express = require("express");                                        // Express framework
const { registerUser , loginUser} = require("../controllers/userController"); // User auth controller functions

// =============================================
// CREATE: Express Router instance
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//   POST /register -> registerUser (Create a new user account)
//   POST /login    -> loginUser    (Authenticate an existing user)
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. POST /api/v1/register
// =============================================
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);


// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router
