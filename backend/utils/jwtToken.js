/*
=============================================
  FILE: jwtToken.js
  PURPOSE: Utility to generate JWT and send it as a cookie
  DESCRIPTION:
    Provides the sendToken() helper function used after
    user registration and login. It:
      1. Generates a JWT token via user.getJWTToken()
      2. Sets the token as an HTTP-only cookie (not
         accessible via JavaScript, prevents XSS)
      3. Returns a JSON response with the user object
         and the token

    The cookie is HTTP-only, meaning JavaScript in the
    browser cannot access it. This prevents Cross-Site
    Scripting (XSS) attacks from stealing the token.
=============================================
*/

/**
 * sendToken - Generates a JWT and sends it in an HTTP-only cookie
 *
 * @param {Object} user       - The Mongoose User document (must have getJWTToken method)
 * @param {number} statusCode - HTTP status code for the response (e.g., 200, 201)
 * @param {Object} res        - Express response object
 *
 * Flow:
 *   1. Calls user.getJWTToken() to sign a JWT with the user's ID
 *   2. Calculates cookie expiry from COOKIE_EXPIRE env var (in days)
 *   3. Sets the cookie named "token" with httpOnly: true
 *   4. Sends JSON: { success: true, user, token }
 *
 * Security notes:
 *   - httpOnly: true prevents JavaScript access (XSS protection)
 *   - The token expires based on COOKIE_EXPIRE env var
 *   - In production, add secure: true for HTTPS-only cookies
 */
const sendToken = (user, statusCode, res) => {
  // Generate the JWT token using the user's instance method
  const token = user.getJWTToken();

  // Cookie options for security and expiry
  const options = {
    // Calculate expiry date from COOKIE_EXPIRE env var (converted to milliseconds)
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    // HTTP-only: prevents JavaScript access (XSS protection)
    httpOnly: true,
  };

  // Send the response with the cookie and JSON body
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      user,
      token,
    });
};

// =============================================
// EXPORT: sendToken utility
//   Used in registerUser, loginUser, resetPassword,
//   and updatePassword controllers.
// =============================================
module.exports = sendToken;
