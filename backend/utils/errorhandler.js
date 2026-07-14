/*
=============================================
  FILE: errorhandler.js
  PURPOSE: Custom Error class for structured error handling
  DESCRIPTION:
    Extends the built-in Error class to include
    a statusCode property. This allows controllers
    to throw errors with specific HTTP status codes
    (e.g., 404, 400, 500) which are then caught
    by the error middleware and sent as JSON responses.

    Usage:
      throw new ErrorHandler("Product not found", 404)

    The error middleware (error.js) reads err.statusCode
    and err.message to construct the JSON response:
      { success: false, statusCode: 404, message: "Product not found" }
=============================================
*/

// =============================================
// CLASS: ErrorHandler
//   Custom error class that extends the native
//   JavaScript Error class with HTTP-specific
//   functionality.
//
//   Properties:
//     - message:    The error description (inherited from Error)
//     - statusCode: The HTTP status code (e.g., 400, 401, 404, 500)
//
//   The captureStackTrace() call removes the ErrorHandler
//   constructor from the error stack trace, so the stack
//   trace starts at the line where the error was thrown.
//   This makes debugging easier.
// =============================================
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Removes ErrorHandler from the stack trace
    // so debugging points to the actual error location
    Error.captureStackTrace(this, this.constructor);
  }
}

// =============================================
// EXPORT: ErrorHandler class
//   Used in controllers and middleware to create
//   errors with specific HTTP status codes.
// =============================================
module.exports = ErrorHandler;
