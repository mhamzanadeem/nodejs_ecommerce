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
=============================================
*/

// =============================================
// IMPORTS
// =============================================

/**
 * jwt - JSON Web Token library for verifying
 * tokens signed with a secret key.
 */
const jwt = require("jsonwebtoken");

/**
 * ErrorHandler - Custom error class that includes
 * an HTTP statusCode for structured error responses.
 */
const ErrorHandler = require("../utils/errorhandler");

/**
 * catchAsyncErrors - Wrapper that catches rejected
 * promises and forwards errors to the error middleware.
 */
const catchAsyncErrors = require("./catchAsyncErrors");

/**
 * User - Mongoose model for fetching user data
 * from the database after token verification.
 */
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
  // Extract the JWT token from the request cookies
  const { token } = req.cookies;

  // If no token is present, the user is not authenticated
  if (!token) {
    return next(
      new ErrorHandler("Please Login to access this resource", 401),
    );
  }

  // Verify the token and decode the payload (contains user ID)
  const decodeddata = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch the full user document from the database
  // This user object is available in all downstream controllers
  // via req.user (e.g., req.user.id, req.user.role)
  req.user = await User.findById(decodeddata.id);

  // Pass control to the next middleware or route handler
  next();
});

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
//     4. If authorized, calls next() to continue
//
//   Usage in routes:
//     router.post("/products/new", isAuthenticateduser, authorizedRoles("admin"), createProduct)
// =============================================
exports.authorizedRoles = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is in the list of allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource `,
          403,
        ),
      );
    }
    // User is authorized — proceed to the route handler
    next();
  };
};
