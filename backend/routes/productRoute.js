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

// =============================================
// CREATE: Express Router instance
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//   GET    /products       -> getAllProducts    (Fetch all products)
//   POST   /products/new   -> createProduct     (Create a new product)
//   GET    /products/:id   -> getProductDetails (Fetch single product by ID)
//   PUT    /products/:id   -> updateProduct     (Update product by ID)
//   DELETE /products/:id   -> deleteProduct     (Delete product by ID)
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. GET /api/v1/products
// =============================================
router.route("/products").get(getAllProducts);
router.route("/products/new").post(createProduct);
router.route("/products/:id").put(updateProduct).delete(deleteProduct).get(getProductDetails);

// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router
