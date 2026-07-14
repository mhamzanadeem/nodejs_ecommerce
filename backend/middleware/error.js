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

    This middleware must be registered AFTER all routes
    in app.js so that Express calls it when any error
    propagates through the middleware chain.

    Handles these specific error types:
      - CastError:         Invalid MongoDB ObjectId
      - Code 11000:        Duplicate key violation
      - JsonWebTokenError: Malformed JWT token
      - TokenExpiredError: Expired JWT token
=============================================
*/

// =============================================
// IMPORTS
// =============================================

/**
 * ErrorHandler - Custom error class used to create
 * errors with specific HTTP status codes.
 */
const ErrorHandler = require("../utils/errorhandler");

// =============================================
// MIDDLEWARE: Global Error Handler
//   Express recognizes this as an error handler
//   because it has 4 parameters (err, req, res, next).
//
//   Default values:
//     - statusCode: 500 (Internal Server Error)
//     - message:    "Internal Server Error"
//
//   These defaults are used when the error doesn't
//   have explicit values set (e.g., native JS errors).
// =============================================
module.exports = (err, req, res, next) => {
  // Set default status code and message if not provided
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // -------------------------------------------
  // ERROR TYPE: CastError (Mongoose)
  //   Occurs when an invalid ObjectId is passed
  //   to a query (e.g., GET /products/invalidId).
  //   Mongoose throws CastError because the value
  //   can't be cast to a MongoDB ObjectId.
  //   We convert this to a 400 Bad Request.
  // -------------------------------------------
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // -------------------------------------------
  // ERROR TYPE: Duplicate Key (MongoDB code 11000)
  //   Occurs when a unique field (e.g., email)
  //   already exists in the database. Mongoose
  //   throws this error during create/update.
  //   Extracts the duplicate field name(s) from
  //   err.keyValue for a user-friendly message.
  // -------------------------------------------
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }

  // -------------------------------------------
  // ERROR TYPE: JsonWebTokenError
  //   Occurs when a JWT token is malformed, has
  //   an invalid signature, or is otherwise
  //   unreadable by jsonwebtoken. Returns 400
  //   Bad Request asking the user to try again.
  // -------------------------------------------
  if (err.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  // -------------------------------------------
  // ERROR TYPE: TokenExpiredError
  //   Occurs when a valid JWT has passed its
  //   expiration time (set by expiresIn in jwt.sign).
  //   The user must log in again to receive a
  //   fresh token. Returns 400 Bad Request.
  // -------------------------------------------
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is Expired, try again`;
    err = new ErrorHandler(message, 400);
  }

  // -------------------------------------------
  // SEND RESPONSE
  //   Returns a structured JSON error response
  //   with the status code and message. The client
  //   can use these to display appropriate feedback.
  // -------------------------------------------
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
  });
};
