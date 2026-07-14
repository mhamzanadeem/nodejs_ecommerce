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

    NOTE: The cookie expiry property is misspelled as
    "expres" instead of "expires" — this means the
    cookie will NOT have an expiry and will be a
    session cookie (deleted when browser closes).
    This should be fixed in production.
=============================================
*/

/**
 * sendToken - Generates a JWT and sends it in an HTTP-only cookie
 *
 * @param {Object} user      - The Mongoose User document (must have getJWTToken method)
 * @param {number} statusCode - HTTP status code for the response (e.g. 200, 201)
 * @param {Object} res       - Express response object
 *
 * Flow:
 *   1. Calls user.getJWTToken() to sign a JWT with the user's ID
 *   2. Calculates cookie expiry from COOKIE_EXPIRE env var (in days)
 *   3. Sets the cookie named "token" with httpOnly: true
 *   4. Sends JSON: { success: true, user, token }
*/
const sendToken = (user , statusCode , res) => {
    const token = user.getJWTToken();

    const options = {
        expres: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 *60 *1000
        ),
        httpOnly: true,
    };

    res.status(statusCode).cookie("token" , token , options).json({
        success:true,
        user,
        token,
    })
}

module.exports = sendToken;
