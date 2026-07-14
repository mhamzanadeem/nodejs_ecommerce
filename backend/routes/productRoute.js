/*
=============================================
  FILE: productRoute.js
  PURPOSE: Define API routes for product endpoints
  DESCRIPTION:
    Sets up Express Router and maps HTTP methods
    to their corresponding controller functions.
    Routes are organized by access level:
      - Public routes (no auth required)
      - Admin-only routes (require login + admin role)
    This router is mounted in app.js under "/api/v1".
    So the full URLs become e.g. GET /api/v1/products
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
 * Product Controller Functions:
 *   - createProduct:       POST   /products/new  (Admin)
 *   - getAllProducts:       GET    /products      (Public)
 *   - updateProduct:       PUT    /products/:id  (Admin)
 *   - deleteProduct:       DELETE /products/:id  (Admin)
 *   - getProductDetails:   GET    /product/:id   (Public)
 *   - createProductReview: PUT    /review        (Auth)
 *   - getProductReviews:   GET    /reviews       (Public)
 *   - deleteReview:        DELETE /reviews       (Auth)
 */
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  createProductReview,
  getProductReviews,
  deleteReview,
} = require("../controllers/productController");

/**
 * Auth Middleware:
 *   - isAuthenticateduser: Verifies JWT token from cookie,
 *     attaches req.user for downstream use
 *   - authorizedRoles: Factory function that checks if
 *     req.user.role is in the allowed roles list
 */
const { isAuthenticateduser, authorizedRoles } = require("../middleware/auth");

/**
 * User Controller Functions (used for admin user management
 * routes that are mounted on the product router):
 *   - getAllUser:     GET    /admin/users    (Admin)
 *   - getSingleUser:  GET    /admin/users/:id (Admin)
 */
const { getAllUser, getSingleUser } = require("../controllers/userController");

// =============================================
// CREATE: Express Router instance
//   This router handles all product-related routes.
//   It is mounted under "/api/v1" in app.js.
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//
//   PUBLIC ROUTES (no authentication required):
//     GET    /products       -> getAllProducts
//       Fetches all products with search, filter, and pagination.
//       Query params: ?keyword=, ?price[gte]=, ?page=
//
//     GET    /product/:id    -> getProductDetails
//       Fetches a single product by its MongoDB ObjectId.
//       Returns 404 if not found.
//
//     GET    /reviews        -> getProductReviews
//       Fetches all reviews for a product.
//       Query param: ?id=<productId>
//
//   PROTECTED ROUTES (require authentication):
//     PUT    /review         -> createProductReview
//       Adds or updates a review on a product.
//       Body: { rating, comment, productId }
//
//     DELETE /reviews        -> deleteReview
//       Removes a specific review from a product.
//       Query params: ?id=<reviewId>, ?productId=<productId>
//
//   ADMIN-ONLY ROUTES (require login + admin role):
//     POST   /products/new   -> createProduct
//       Creates a new product. Body: product details.
//
//     PUT    /products/:id   -> updateProduct
//       Updates an existing product by ID.
//
//     DELETE /products/:id   -> deleteProduct
//       Permanently deletes a product by ID.
//
//     GET    /admin/users    -> getAllUser
//       Returns all registered users.
//
//     GET    /admin/users/:id -> getSingleUser
//       Returns a specific user by ID.
//
//   Middleware chain:
//     isAuthenticateduser -> Verifies JWT, attaches req.user
//     authorizedRoles("admin") -> Checks if req.user.role === "admin"
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. GET /api/v1/products
// =============================================

// Public: Fetch all products with search/filter/pagination
router.route("/products").get(getAllProducts);

// Admin: Create a new product (requires admin role)
router
  .route("/products/new")
  .post(isAuthenticateduser, authorizedRoles("admin"), createProduct);

// Admin: Update or delete a product by ID (requires admin role)
router
  .route("/products/:id")
  .put(isAuthenticateduser, authorizedRoles("admin"), updateProduct)
  .delete(isAuthenticateduser, authorizedRoles("admin"), deleteProduct);

// Public: Fetch a single product by ID
router.route("/product/:id").get(getProductDetails);

// Admin: Fetch all users (requires admin role)
router
  .route("/admin/users")
  .get(isAuthenticateduser, authorizedRoles("admin"), getAllUser);

// Admin: Fetch, update, or delete a single user by ID (requires admin role)
router
  .route("/admin/users/:id")
  .get(isAuthenticateduser, authorizedRoles("admin"), getSingleUser);

// Authenticated: Add or update a product review
router.route("/review").put(isAuthenticateduser, createProductReview);

// Public: Get reviews / Authenticated: Delete a review
router
  .route("/reviews")
  .get(getProductReviews)
  .delete(isAuthenticateduser, deleteReview);

// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router;
