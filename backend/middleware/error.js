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

    if(err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400)
    }
    res.status(err.statusCode).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message,
    })
}
