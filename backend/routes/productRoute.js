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
//   Maps HTTP GET /products to getAllProducts controller
//   Additional routes (POST, PUT, DELETE) can be added here
// =============================================
router.route("/products").get(getAllProducts);
router.route("/products/new").post(createProduct);
router.route("/products/:id").put(updateProduct).delete(deleteProduct).get(getProductDetails);

// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router
