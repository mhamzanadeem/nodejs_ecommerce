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

/**
 * mongoose - Mongoose ODM library for interacting
 * with MongoDB. Provides schema-based modeling,
 * validation, and query building.
 */
const mongoose = require("mongoose");

/**
 * validator - Email validation library.
 * Used to validate that the user's email is in
 * a proper format (e.g., user@example.com).
 */
const validator = require("validator");

/**
 * bcryptjs - Password hashing library.
 * Used to securely hash passwords before storing
 * them in the database (never store plaintext).
 */
const bcrypt = require("bcryptjs");

/**
 * jwt - JSON Web Token library for signing
 * authentication tokens with a secret key.
 */
const jwt = require("jsonwebtoken");

/**
 * crypto - Node.js built-in module for generating
 * secure random tokens (used for password reset flow).
 */
const crypto = require("crypto");

// =============================================
// SCHEMA: User
//   Defines the structure and validation rules
//   for each user document in the "users"
//   collection in MongoDB.
// =============================================
const userSchema = new mongoose.Schema({
  // -------------------------------------------
  // FIELD: name
  //   The user's full name.
  //   - Required with custom error message
  //   - Max 30 characters
  //   - Min 4 characters
  // -------------------------------------------
  name: {
    type: String,
    required: [true, "Please Enter Your Name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [4, "Name should have more than 4 characters"],
  },

  // -------------------------------------------
  // FIELD: email
  //   The user's email address (unique identifier).
  //   - Required with custom error message
  //   - Unique: prevents duplicate registrations
  //   - Validated using validator.isEmail to ensure
  //     proper email format (e.g., user@example.com)
  // -------------------------------------------
  email: {
    type: String,
    required: [true, "Please Enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },

  // -------------------------------------------
  // FIELD: password
  //   The user's password (stored as a bcrypt hash).
  //   - Required with custom error message
  //   - Min 8 characters
  //   - select: false means this field is EXCLUDED
  //     from query results by default. To include it,
  //     use .select("+password") in the query.
  //     This prevents accidental password exposure.
  // -------------------------------------------
  password: {
    type: String,
    required: [true, "Please Enter your Password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
  },

  // -------------------------------------------
  // FIELD: avatar
  //   User's profile picture. Stored as an array
  //   with a single image object containing:
  //     - public_id: Cloud storage identifier
  //     - url:       Public URL to access the image
  //   Uses array format for consistency with the
  //   product images structure.
  // -------------------------------------------
  avatar: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],

  // -------------------------------------------
  // FIELD: role
  //   The user's access level in the application.
  //   - Default: "user" (regular customer)
  //   - Can be set to "admin" for administrative access
  //   - Used by authorizedRoles middleware to control
  //     access to admin-only routes
  // -------------------------------------------
  role: {
    type: String,
    default: "user",
  },

  // -------------------------------------------
  // FIELD: resetPasswordToken
  //   Stores the hashed version of the password
  //   reset token. The raw token is sent to the
  //   user via email; only the hash is stored here.
  //   Cleared after successful password reset.
  // -------------------------------------------
  resetPasswordToken: String,

  // -------------------------------------------
  // FIELD: resetPasswordExpire
  //   Expiration date for the password reset token.
  //   Set to 15 minutes from creation time.
  //   Cleared after successful password reset.
  // -------------------------------------------
  resetPasswordExpire: Date,
});

// =============================================
// HOOK: Pre-save (Password Hashing)
//   Before saving a user document to MongoDB:
//
//   Flow:
//     1. Check if the password field was modified
//        using this.isModified("password").
//     2. If NOT modified, skip hashing (call next()).
//     3. If modified, hash the password using bcrypt
//        with a salt round of 10.
//     4. This ensures passwords are NEVER stored in
//        plaintext in the database.
//
//   NOTE: The bcrypt salt round of 10 means the
//   hashing algorithm runs 2^10 = 1024 iterations.
//   Higher = more secure but slower.
// =============================================
userSchema.pre("save", async function (next) {
  // Only hash the password if it was modified (not on every save)
  if (!this.isModified("password")) {
    next();
  }
  // Hash the password with bcrypt (10 salt rounds)
  this.password = await bcrypt.hash(this.password, 10);
});

// =============================================
// INSTANCE METHOD: getJWTToken()
//   Signs a JSON Web Token containing the user's _id.
//   This token is used for authentication — it's sent
//   to the client as an HTTP-only cookie and included
//   in subsequent requests to access protected routes.
//
//   Token payload:
//     { id: user._id }
//
//   Signed with:
//     - JWT_SECRET from environment variables
//     - expiresIn from JWT_EXPIRE env var (e.g., "7d")
// =============================================
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// =============================================
// INSTANCE METHOD: comparePassword()
//   Compares a plaintext password (from login form)
//   against the hashed password stored in the database.
//
//   How bcrypt.compare works:
//     1. Extracts the salt from the stored hash
//     2. Hashes the entered password with the same salt
//     3. Compares the two hashes
//     4. Returns true if they match, false otherwise
//
//   This method is used in the loginUser controller
//   to verify the user's password during login.
// =============================================
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// =============================================
// INSTANCE METHOD: getResetPasswordToken()
//   Generates a password reset token for the
//   forgot-password flow.
//
//   Flow:
//     1. Creates a random 20-byte token and converts
//        it to a hexadecimal string
//     2. Hashes the token with SHA-256 and stores the
//        hash in the database (resetPasswordToken)
//     3. Sets the token expiry to 15 minutes from now
//     4. Returns the RAW (unhashed) token to be sent
//        in the password reset email
//
//   Security: Only the hashed version is stored in
//   the DB. Even if the database is compromised, the
//   raw tokens cannot be used to reset passwords.
// =============================================
userSchema.methods.getResetPasswordToken = function () {
  // Generate a random 20-byte token and convert to hex string
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash the token with SHA-256 before storing in the database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiry to 15 minutes from now
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // Return the raw (unhashed) token for the email
  return resetToken;
};

// =============================================
// EXPORT: User Model
//   Creates and exports the "User" model.
//   This model is used in controllers to perform
//   CRUD operations on the "users" collection.
//   Mongoose automatically pluralizes "User"
//   to "users" for the collection name.
// =============================================
module.exports = mongoose.model("User", userSchema);
