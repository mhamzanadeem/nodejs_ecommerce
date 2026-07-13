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
    Usage: throw new ErrorHandler("message", statusCode)
=============================================
*/

// =============================================
// CREATE: Custom ErrorHandler Class
//   - Extends native Error class
//   - Adds statusCode to identify HTTP error codes
//   - captureStackTrace removes constructor from
//     the error stack trace for cleaner debugging
// =============================================
class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode = statusCode
        Error.captureStackTrace(this,this.constructor)
    }
}

// =============================================
// EXPORT: ErrorHandler to be used in controllers
// =============================================
module.exports = ErrorHandler
