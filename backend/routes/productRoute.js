/*
=============================================
  FILE: productRoute.js
  PURPOSE: Define API routes for product endpoints
  DESCRIPTION:
    Sets up Express Router and maps HTTP methods
    to their corresponding controller functions.
    Current routes:
      GET /products -> getAllProducts (from productController)
    This router is mounted in app.js under "/api/v1".
    So the full URL becomes: GET /api/v1/products
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const express = require("express");                                        // Express framework
const { getAllProducts, createProduct, updateProduct , deleteProduct,getProductDetails } = require("../controllers/productController");    // Controller function for GET /products
const { isAuthenticateduser , authorizedRoles } = require("../middleware/auth"); // Auth middleware for protected routes

// =============================================
// CREATE: Express Router instance
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//
//   Public routes (no auth required):
//     GET    /products       -> getAllProducts    (Fetch all products with search/filter)
//     GET    /products/:id   -> getProductDetails (Fetch single product by ID)
//
//   Protected routes (require login + admin role):
//     POST   /products/new   -> createProduct     (Create a new product)
//     PUT    /products/:id   -> updateProduct     (Update product by ID)
//     DELETE /products/:id   -> deleteProduct     (Delete product by ID)
//
//   Middleware chain:
//     isAuthenticateduser -> Verifies JWT token from cookie, attaches req.user
//     authorizedRoles("admin") -> Checks if req.user.role is "admin"
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. GET /api/v1/products
// =============================================
router.route("/products").get(getAllProducts);
router.route("/products/new").post(isAuthenticateduser, authorizedRoles("admin") , createProduct);
router.route("/products/:id").put(isAuthenticateduser, authorizedRoles("admin") ,updateProduct).delete(isAuthenticateduser, authorizedRoles("admin") ,deleteProduct).get(getProductDetails);

// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router
