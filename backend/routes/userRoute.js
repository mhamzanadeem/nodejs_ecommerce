/*
=============================================
  FILE: userRoute.js
  PURPOSE: Define API routes for user authentication endpoints
  DESCRIPTION:
    Sets up Express Router and maps HTTP methods
    to their corresponding controller functions.
    Routes are organized by access level:
      - Public routes (registration, login, password reset)
      - Protected routes (user profile, password change)
      - Admin-only routes (user management)
    This router is mounted in app.js under "/api/v1".
    So the full URLs become e.g. POST /api/v1/register
=============================================
*/

// =============================================
// IMPORTS
// =============================================

/**
 * express - The Express framework for building
 * HTTP servers and routing.
 */
const express = require("express");

/**
 * User Controller Functions:
 *   - registerUser:     POST   /register              (Public)
 *   - loginUser:        POST   /login                 (Public)
 *   - logout:           GET    /logout                (Auth)
 *   - forgotPassword:   POST   /password/forgot       (Public)
 *   - resetPassword:    PUT    /password/reset/:token (Public)
 *   - getUserDetail:    GET    /me                    (Auth)
 *   - updatePassword:   PUT    /password/update       (Auth)
 *   - updateProfile:    PUT    /me/update             (Auth)
 *   - getAllUser:        GET    /admin/users           (Admin)
 *   - getSingleUser:    GET    /admin/user/:id        (Admin)
 *   - updateUserRole:   PUT    /admin/user/:id        (Admin)
 *   - deleteUser:       DELETE /admin/user/:id        (Admin)
 */
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetail,
  updatePassword,
  updateProfile,
  getAllUser,
  getSingleUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");

/**
 * Auth Middleware:
 *   - isAuthenticateduser: Verifies JWT token from cookie
 *   - authorizedRoles: Checks if user has the required role
 */
const { isAuthenticateduser, authorizedRoles } = require("../middleware/auth");

// =============================================
// CREATE: Express Router instance
//   This router handles all user authentication
//   and admin user management routes.
//   It is mounted under "/api/v1" in app.js.
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//
//   PUBLIC ROUTES (no authentication required):
//     POST /register                -> registerUser
//       Creates a new user account. Body: { name, email, password }
//       Returns JWT token as HTTP-only cookie.
//
//     POST /login                   -> loginUser
//       Authenticates user by email/password.
//       Returns JWT token as HTTP-only cookie.
//
//     POST /password/forgot         -> forgotPassword
//       Sends a password reset email to the user.
//       Body: { email }
//
//     PUT    /password/reset/:token -> resetPassword
//       Resets password using the token from the email.
//       Body: { password, confirmPassword }
//
//   PROTECTED ROUTES (require authentication):
//     GET  /logout                  -> logout
//       Clears the auth cookie and logs out the user.
//
//     GET  /me                      -> getUserDetail
//       Returns the currently authenticated user's profile.
//
//     PUT  /password/update         -> updatePassword
//       Changes the user's password (requires old password).
//       Body: { oldPassword, newPassword, confirmPassword }
//
//     PUT  /me/update               -> updateProfile
//       Updates user's name and email.
//       Body: { name, email }
//
//   ADMIN-ONLY ROUTES (require login + admin role):
//     GET  /admin/users             -> getAllUser
//       Returns all registered users.
//
//     GET  /admin/user/:id          -> getSingleUser
//       Returns a specific user by ID.
//
//     PUT  /admin/user/:id          -> updateUserRole
//       Updates a user's role (e.g., promote to admin).
//       Body: { name, email, role }
//
//     DELETE /admin/user/:id        -> deleteUser
//       Permanently deletes a user by ID.
//
//   Middleware chain:
//     isAuthenticateduser -> Verifies JWT, attaches req.user
//     authorizedRoles("admin") -> Checks if req.user.role === "admin"
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. POST /api/v1/register
// =============================================

// Public: User registration and login
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// Protected: Logout (clear auth cookie)
router.route("/logout").get(logout);

// Public: Password reset flow (forgot -> email -> reset)
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);

// Protected: User profile and password management
router.route("/me").get(isAuthenticateduser, getUserDetail);
router.route("/password/update").put(isAuthenticateduser, updatePassword);
router.route("/me/update").put(isAuthenticateduser, updateProfile);

// Admin: User management (view all users, view/update/delete single user)
router
  .route("/admin/users")
  .get(isAuthenticateduser, authorizedRoles("admin"), getAllUser);

router
  .route("/admin/user/:id")
  .get(isAuthenticateduser, authorizedRoles("admin"), getSingleUser)
  .put(isAuthenticateduser, authorizedRoles("admin"), updateUserRole)
  .delete(isAuthenticateduser, authorizedRoles("admin"), deleteUser);

// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router;
