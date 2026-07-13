/*
=============================================
  FILE: catchAsyncErrors.js
  PURPOSE: Higher-order function to catch async errors
  DESCRIPTION:
    Wraps async route handler functions so that any
    rejected promise (thrown error) is automatically
    caught and passed to Express's next() function.
    This avoids the need for try-catch in every
    controller. Just wrap your async function:
      exports.myFunc = catchAsyncErrors(async (req, res) => { ... })
=============================================
*/

// =============================================
// CREATE: catchAsyncErrors wrapper function
//   - Takes an async function (theFunc) as input
//   - Returns a new Express middleware function
//   - Calls the async function and catches any
//     rejected promise, forwarding the error to next()
// =============================================
module.exports = theFunc => (req,res,next) => {
    Promise.resolve(theFunc(req,res,next)).catch(next);
}
