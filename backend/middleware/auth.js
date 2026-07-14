/*
=============================================
  FILE: auth.js
  PURPOSE: Authentication & authorization middleware
  DESCRIPTION:
    Provides two middleware functions for protecting
    API routes:

    1. isAuthenticateduser
       - Extracts the JWT token from the request cookies
       - Verifies the token using JWT_SECRET
       - Fetches the user from the database by decoded ID
       - Attaches the user object to req.user for downstream use
       - Returns 401 if no token is provided

    2. authorizedRoles
       - Factory function that accepts allowed roles (e.g. "admin")
       - Checks if req.user.role is in the allowed roles list
       - Returns 403 if the user's role is not authorized

    These middleware are used in route definitions to protect
    endpoints that require login or admin access.
    Example: router.post("/products/new", isAuthenticateduser, authorizedRoles("admin"), createProduct)

    NOTE: There are bugs in this file:
      - Line 23: req, res.role should be req.user.role
      - Line 21-26: authorizedRoles does not call next() on success
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const User = require("../models/userModel");

// =============================================
// MIDDLEWARE: isAuthenticateduser
//   Protects routes that require a logged-in user.
//
//   Flow:
//     1. Reads the "token" cookie from req.cookies
//     2. If no token exists, returns 401 (Unauthorized)
//     3. Verifies the JWT using the secret from env vars
//     4. Decodes the token to get the user ID (payload.id)
//     5. Fetches the full user document from MongoDB
//     6. Attaches user to req.user so controllers can access it
//     7. Calls next() to pass control to the next middleware/route
//
//   Usage in routes:
//     router.get("/profile", isAuthenticateduser, getProfile)
// =============================================
exports.isAuthenticateduser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please Login to access this resource", 401))
    }

    const decodeddata = jwt.verify(token, process.env.JWT_SECRET)

    req.user = await User.findById(decodeddata.id)

    next()
})

// =============================================
// MIDDLEWARE: authorizedRoles (Factory Function)
//   Restricts access to specific user roles.
//
//   Parameters:
//     ...roles - Variable list of allowed roles
//                e.g. authorizedRoles("admin", "manager")
//
//   Flow:
//     1. Returns a middleware function (closure)
//     2. Checks if req.user.role is included in the roles array
//     3. If not authorized, returns 403 (Forbidden)
//     4. If authorized, should call next() (see bug note below)
//
//   Usage in routes:
//     router.post("/products/new", isAuthenticateduser, authorizedRoles("admin"), createProduct)
//
//   BUG: This middleware does not call next() on success,
//   so authorized requests will hang indefinitely.
//   BUG: req, res.role on line 23 should be req.user.role.
// =============================================
exports.authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req, res.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource `, 403))
        }
    }
}
