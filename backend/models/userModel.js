/*
=============================================
  FILE: userModel.js
  PURPOSE: Mongoose schema & model definition for User
  DESCRIPTION:
    Defines the structure (schema) of a User document
    in MongoDB. Each user has:
      - name, email, password (hashed), avatar,
        role, and password reset fields.
    Includes:
      - A pre-save hook that hashes the password
        using bcrypt before saving to the database.
      - A getJWTToken() method that signs a JWT with
        the user's ID for authentication.
      - A comparePassword() method that compares a
        plaintext password against the stored hash.
    The schema is compiled into a Mongoose Model
    which is exported for use in controllers.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const mongoose = require("mongoose")
const validator = require("validator")   // Email validation library
const bcrypt = require("bcryptjs")       // Password hashing library
const jwt = require("jsonwebtoken")      // JWT signing library
const crypto = require("crypto")   // Node.js built-in for generating secure random tokens

// =============================================
// CREATE: User Schema
//   Defines the structure and validation rules
//   for each user document in MongoDB.
//   Fields:
//     - name:     String (required, 4-30 chars)
//     - email:    String (required, unique, validated with validator.isEmail)
//     - password: String (required, min 8 chars, select:false so it's excluded
//                  from queries by default — must use .select("+password") to include)
//     - avatar:   Array of { public_id, url } — for profile picture storage
//     - role:     String (default: "user", can be "admin")
//     - resetPasswordToken:  String — token for password reset flow
//     - resetPasswordExpire: Date — expiry time for the reset token
// =============================================
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter Your Name"],
        maxLength: [30, "Name cannot exceed 30 characters"],
        minLength: [4, "Name should have more than 4 characters"]

    },
    email: {
        type: String,
        required: [true, "Please Enter your email"],
        unique: true,
        validate: [validator.isEmail, "Please Enter a valid Email"]
    },
    password: {
        type: String,
        required: [true, "Please Enter your Password"],
        minLength: [8, "Password should be greater than 8 characters"],
        select: false,

    },
    avatar: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    role: {
        type: String,
        default: "user"
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
})

// =============================================
// MIDDLEWARE: Pre-save Hook (Password Hashing)
//   Before saving a user document to MongoDB:
//   1. Check if the password field was modified.
//      If not, skip hashing (calls next()).
//   2. If modified, hash the password using bcrypt
//      with a salt round of 10.
//   This ensures passwords are never stored in plaintext.
//   NOTE: Missing `return` before next() means hashing
//         still runs even when password is unchanged.
// =============================================
userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) { next(); }
    this.password = await bcrypt.hash(this.password, 10)
})

// =============================================
// INSTANCE METHOD: getJWTToken()
//   Signs a JSON Web Token containing the user's _id.
//   Uses JWT_SECRET and JWT_EXPIRE from environment variables.
//   Called after login/register to generate an auth token.
// =============================================
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    })
}

// =============================================
// INSTANCE METHOD: comparePassword()
//   Compares a plaintext password (from login form)
//   against the hashed password stored in the database.
//   Uses bcrypt.compare() which handles salt comparison.
//   Returns true if passwords match, false otherwise.
// =============================================
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}


// =============================================
// INSTANCE METHOD: getResetPasswordToken()
//   Generates a password reset token for the forgot-password flow.
//   1. Creates a random 20-byte token and converts it to hex string
//   2. Hashes the token with SHA-256 and stores it in the database
//      (the raw token is sent to the user via email, never stored)
//   3. Sets the token expiry to 15 minutes from now
//   4. Returns the raw (unhashed) token to be sent in the reset email
//
//   Security: Only the hashed version is stored in the DB so that
//   even if the database is compromised, the raw tokens are safe.
// =============================================
userSchema.methods.getResetPasswordToken = function () {

    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15*60*1000;

    return resetToken;
}
// =============================================
// EXPORT: User Model
//   Creates and exports the "User" model.
//   This model is used in controllers to perform
//   CRUD operations on the "users" collection.
// =============================================
module.exports = mongoose.model("User", userSchema);
