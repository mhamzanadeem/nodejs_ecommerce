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
const { registerUser , loginUser , logout, forgotPassword} = require("../controllers/userController"); // User auth controller functions

// =============================================
// CREATE: Express Router instance
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//
//   Authentication routes:
//     POST /register       -> registerUser    (Create a new user account)
//     POST /login          -> loginUser       (Authenticate & get JWT token)
//     GET  /logout         -> logout          (Clear auth cookie, log out user)
//
//   Password reset routes:
//     POST /password/forgot -> forgotPassword (Send password reset email)
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. POST /api/v1/register
// =============================================
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/password/forgot").post(forgotPassword);


// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router
