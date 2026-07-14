/*
=============================================
  FILE: userController.js
  PURPOSE: Request handler functions for user routes
  DESCRIPTION:
    Contains controller logic for user-related
    API endpoints. Each function handles a specific
    HTTP request (e.g., register, login) and sends
    back the appropriate JSON response.
    Controllers are called by route definitions in userRoute.js.
=============================================
*/

// =============================================
// IMPORTS
// =============================================

/**
 * catchAsyncErrors - Higher-order function that wraps
 * async route handlers to catch rejected promises.
 */
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * User - Mongoose model for the "users" collection.
 * Used to perform CRUD operations on user data.
 */
const User = require("../models/userModel");

/**
 * ErrorHandler - Custom error class with HTTP statusCode
 * for structured error responses.
 */
const ErrorHandler = require("../utils/errorhandler");

/**
 * sendToken - Utility that generates a JWT token and
 * sends it as an HTTP-only cookie in the response.
 */
const sendToken = require("../utils/jwtToken");

/**
 * sendEmail - Utility that sends emails via Nodemailer.
 * Used for password reset flow.
 */
const sendEmail = require("../utils/sendEmail");

// Node.js built-in module for hashing tokens (used in resetPassword)
const crypto = require("crypto");

// =============================================
// CONTROLLER: registerUser
//   Handles POST /api/v1/register
//
//   Creates a new user account from the request body.
//   After registration, the user is automatically logged in
//   via a JWT token sent as an HTTP-only cookie.
//
//   Flow:
//     1. Extracts name, email, password from req.body
//     2. Creates a new User document with a placeholder avatar
//     3. Calls sendToken() to generate JWT and send it as cookie
//     4. Returns 201 (Created) with user data and token
//
//   Access: Public (anyone can register)
// =============================================
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // Extract user registration data from the request body
  const { name, email, password } = req.body;

  // Create the user with a default placeholder avatar
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is a sample id",
      url: "profilepicUrl",
    },
  });

  // Generate JWT token and send it as an HTTP-only cookie
  sendToken(user, 201, res);
});

// =============================================
// CONTROLLER: loginUser
//   Handles POST /api/v1/login
//
//   Authenticates an existing user by email and password.
//   On success, returns a JWT token as an HTTP-only cookie.
//
//   Flow:
//     1. Validates that both email and password are provided
//     2. Finds the user by email (includes password field
//        via .select("+password") since it's excluded by default)
//     3. Compares the entered password against the stored hash
//     4. If valid, calls sendToken() to generate JWT
//     5. Returns 200 with user data and token
//
//   Access: Public (anyone can attempt login)
// =============================================
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate that both fields are provided
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  // Find user by email and explicitly include the password field
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Compare the entered password with the stored bcrypt hash
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // Generate JWT and send as cookie
  sendToken(user, 200, res);
});

// =============================================
// CONTROLLER: logout
//   Handles GET /api/v1/logout
//
//   Logs out the current user by clearing the
//   authentication cookie. Sets the "token" cookie
//   to null with an expiry of now (immediately expires).
//
//   Flow:
//     1. Sets the "token" cookie to null with immediate expiry
//     2. Returns 200 with a success message
//
//   Access: Authenticated users only
// =============================================
exports.logout = catchAsyncErrors(async (req, res, next) => {
  // Clear the token cookie by setting it to null with past expiry
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// =============================================
// CONTROLLER: forgotPassword
//   Handles POST /api/v1/password/forgot
//
//   Sends a password reset email to the user.
//   This is the first step of the two-step password
//   reset flow (forgot -> reset).
//
//   Flow:
//     1. Finds the user by email from req.body
//     2. Generates a reset token via user.getResetPasswordToken()
//        (this hashes the token and stores it in the DB)
//     3. Saves the user with validateBeforeSave: false to skip
//        other field validations (only token fields changed)
//     4. Builds a reset URL using the raw token:
//        /api/v1/password/reset/:token
//     5. Sends the URL in an email to the user
//     6. If email fails, clears the token fields and returns error
//
//   Access: Public (anyone can request a password reset)
// =============================================
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // Find the user by their email address
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Generate a password reset token (raw token + hashed version)
  const resetToken = user.getResetPasswordToken();

  // Save the hashed token to the database (skip other validations)
  await user.save({ validateBeforeSave: false });

  // Build the full reset URL to include in the email
  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

  // Compose the email message with the reset link
  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this then, please ignore it`;

  try {
    // Send the password reset email
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    // Email failed — clear the token fields and return error
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// =============================================
// CONTROLLER: resetPassword
//   Handles PUT /api/v1/password/reset/:token
//
//   Resets the user's password using the token received
//   via the forgotPassword email. This is the second step
//   of the password reset flow.
//
//   Flow:
//     1. Hashes the URL token to match the stored hash
//     2. Finds the user by hashed token + checks expiry
//     3. Validates that password and confirmPassword match
//     4. Updates the password (pre-save hook hashes it)
//     5. Clears the reset token fields
//     6. Sends a new JWT token via cookie
//
//   Access: Public (accessible via the reset link in email)
// =============================================
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Hash the raw token from the URL to compare with the stored hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // Find user with matching token that hasn't expired yet
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400,
      ),
    );
  }

  // Validate that password and confirmPassword match
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  // Set the new password (pre-save hook will hash it)
  user.password = req.body.password;

  // Clear the reset token fields since the reset is complete
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Save the updated user (triggers password hashing)
  await user.save();

  // Log the user in with a new JWT token
  sendToken(user, 200, res);
});

// =============================================
// CONTROLLER: getUserDetail
//   Handles GET /api/v1/me
//
//   Returns the currently authenticated user's profile.
//   The user ID is read from req.user (set by the
//   isAuthenticateduser middleware).
//
//   Flow:
//     1. Finds the user by req.user.id
//     2. Returns 200 with the user object
//
//   Access: Authenticated users only
// =============================================
exports.getUserDetail = catchAsyncErrors(async (req, res, next) => {
  // Find the user by ID from the JWT token (set by auth middleware)
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// =============================================
// CONTROLLER: updatePassword
//   Handles PUT /api/v1/password/update
//
//   Allows an authenticated user to change their password.
//   Requires the old password for verification before
//   setting the new one.
//
//   Flow:
//     1. Finds the user and includes the password field
//     2. Compares the old password against the stored hash
//     3. Validates that new password and confirm match
//     4. Sets the new password (pre-save hook hashes it)
//     5. Returns a new JWT token
//
//   Access: Authenticated users only
// =============================================
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  // Find user and include password field (excluded by default)
  const user = await User.findById(req.user.id).select("+password");

  // Verify the current/old password is correct
  const isPasswordMatch = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  // Validate that new password and confirmation match
  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  // Set the new password (pre-save hook will hash it)
  user.password = req.body.newPassword;

  // Save and issue a new JWT token
  await user.save();
  sendToken(user, 200, res);
});

// =============================================
// CONTROLLER: updateProfile
//   Handles PUT /api/v1/me/update
//
//   Allows an authenticated user to update their
//   name and email address.
//
//   Flow:
//     1. Extracts new name and email from req.body
//     2. Updates the user document with findByIdAndUpdate()
//     3. Returns 200 with success status
//
//   Access: Authenticated users only
// =============================================
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  // Build the update object with new user data
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  // Update the user in the database
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// =============================================
// CONTROLLER: getAllUser (Admin)
//   Handles GET /api/v1/admin/users
//
//   Returns all registered users in the database.
//   Used by admins to manage users.
//
//   Flow:
//     1. Fetches all user documents from MongoDB
//     2. Returns 200 with the users array
//
//   Access: Admin only
// =============================================
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  // Fetch all users from the database
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// =============================================
// CONTROLLER: getSingleUser (Admin)
//   Handles GET /api/v1/admin/user/:id
//
//   Returns a single user by their MongoDB _id.
//   Used by admins to view a specific user's details.
//
//   Flow:
//     1. Finds the user by ID from URL params
//     2. Returns 404 if the user doesn't exist
//     3. Returns 200 with the user object
//
//   Access: Admin only
// =============================================
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  // Find the user by their MongoDB ObjectId
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 404),
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// =============================================
// CONTROLLER: updateUserRole (Admin)
//   Handles PUT /api/v1/admin/user/:id
//
//   Allows admins to update a user's role (e.g.,
//   promote from "user" to "admin"). Also allows
//   updating the user's name and email.
//
//   Flow:
//     1. Extracts new name, email, and role from req.body
//     2. Updates the user document with findByIdAndUpdate()
//     3. Returns 200 with success status
//
//   Access: Admin only
// =============================================
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  // Build the update object with new user data including role
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  // Update the user in the database
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// =============================================
// CONTROLLER: deleteUser (Admin)
//   Handles DELETE /api/v1/admin/user/:id
//
//   Allows admins to permanently delete a user
//   from the database.
//
//   Flow:
//     1. Finds the user by ID from URL params
//     2. Returns 404 if the user doesn't exist
//     3. Calls user.remove() to delete the document
//     4. Returns 200 with a success message
//
//   Access: Admin only
// =============================================
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  // Find the user by their MongoDB ObjectId
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 404),
    );
  }

  // Permanently remove the user from the database
  await user.remove();

  res.status(200).json({
    success: true,
    message: "User deleted Successfully",
  });
});
