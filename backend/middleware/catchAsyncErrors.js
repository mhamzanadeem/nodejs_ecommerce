/*
=============================================
  FILE: catchAsyncErrors.js
  PURPOSE: Higher-order function to catch async errors
  DESCRIPTION:
    Wraps async route handler functions so that any
    rejected promise (thrown error) is automatically
    caught and passed to Express's next() function.
    This avoids the need for try-catch in every
    controller.

    Without this wrapper, an unhandled rejection in
    an async controller would crash the server or
    hang the request indefinitely.

    Usage:
      exports.myFunc = catchAsyncErrors(async (req, res) => {
        // If this throws, the error is automatically
        // forwarded to the error middleware via next()
      })
=============================================
*/

// =============================================
// FUNCTION: catchAsyncErrors
//   A higher-order function that takes an async
//   function and returns a new Express middleware.
//
//   Parameters:
//     theFunc - An async function (controller) that
//               accepts (req, res, next)
//
//   Returns:
//     A new Express middleware function that:
//       1. Calls theFunc(req, res, next)
//       2. Wraps the call in Promise.resolve() to
//          handle both sync and async rejections
//       3. Catches any rejected promise and calls
//          next(error) to forward to error middleware
//
//   How it works:
//     Promise.resolve(theFunc(req, res, next))
//       - If theFunc is async, it returns a Promise
//       - .catch(next) catches any rejection and
//         passes the error to Express error middleware
//       - The error middleware (error.js) then sends
//         a structured JSON response
// =============================================
module.exports = (theFunc) => (req, res, next) => {
  Promise.resolve(theFunc(req, res, next)).catch(next);
};
