/*
=============================================
  FILE: error.js
  PURPOSE: Global error handling middleware
  DESCRIPTION:
    Express error-handling middleware that catches
    all errors passed via next(error) from controllers.
    It reads the statusCode and message from the error
    object and returns a structured JSON response.
    If no statusCode is set, defaults to 500.
    This middleware must be registered AFTER all routes.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const ErrorHandler = require("../utils/errorhandler");

// =============================================
// CALL: Error Handler Middleware
//   Express recognizes this as an error handler
//   because it has 4 parameters (err, req, res, next).
//   - Sets statusCode to error's value or 500 (default)
//   - Sets message to error's value or "Internal Server Error"
//   - Returns JSON response with both statusCode and message
// =============================================
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // Handle Mongoose CastError: This occurs when an invalid
    // ObjectId is passed to a query (e.g. GET /products/invalidId).
    // Mongoose throws CastError because the value can't be cast
    // to a MongoDB ObjectId. We convert this to a 400 Bad Request.
    if(err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400)
    }

    // Handle MongoDB Duplicate Key Error (code 11000):
    // This occurs when a unique field (e.g. email) already exists
    // in the database. Mongoose throws this error during create/update.
    // Extracts the duplicate field name(s) from err.keyValue and
    // returns a user-friendly 400 Bad Request message.
    if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400)
    }

    // Handle Invalid JSON Web Token:
    // This occurs when a JWT token is malformed, has an invalid
    // signature, or is otherwise unreadable by jsonwebtoken.
    // Returns a 400 Bad Request asking the user to try again.
    if(err.name === "JsonWebTokenError"){
        const message = `Json Web Token is invalid, try again`;
        err = new ErrorHandler(message, 400)
    }

    // Handle Expired JSON Web Token:
    // This occurs when a valid JWT has passed its expiration time
    // (set by expiresIn in jwt.sign). The user must log in again
    // to receive a fresh token. Returns a 400 Bad Request.
    if(err.name === "TokenExpiredError"){
        const message = `Json Web Token is Expired, try again`;
        err = new ErrorHandler(message, 400)
    }


    res.status(err.statusCode).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message,
    })
}
