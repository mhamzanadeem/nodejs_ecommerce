/*
=============================================
  FILE: productController.js
  PURPOSE: Request handler functions for product routes
  DESCRIPTION:
    Contains controller logic for product-related
    API endpoints. Each function handles a specific
    HTTP request (e.g., GET all products) and sends
    back the appropriate JSON response.
    Controllers are called by route definitions in productRoute.js.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const catchAsyncErrors = require("../middleware/catchAsyncErrors"); // Wraps async functions to catch errors
const Product = require("../models/productModels");                 // Mongoose Product model
const ApiFeatures = require("../utils/apifeatures");
const ErrorHandler = require("../utils/errorhandler");              // Custom error class with statusCode

// =============================================
// CONTROLLER: createProduct
//   Handles POST /api/v1/products/new
//   Creates a new product from req.body data
//   and saves it to the database.
// =============================================
exports.createProduct = catchAsyncErrors(async (req, res, next) => {

    req.body.user = req.user.id,
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })
});

// =============================================
// CONTROLLER: getAllProducts
//   Handles GET /api/v1/products
//   Fetches all products from the database
//   and returns them in the response.
// =============================================
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
    const resultPerPage = 5;
    const productCount = await Product.countDocuments();

    const apiFeature = new ApiFeatures(Product.find(), req.query).search().filter().pagination(resultPerPage)
    
    const products = await Product.query();

    res.status(200).json({
        success: true,
        products
    })
});

// =============================================
// CONTROLLER: getProductDetails
//   Handles GET /api/v1/products/:id
//   Fetches a single product by its MongoDB _id.
//   Returns 404 if product is not found.
// =============================================
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    ;

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        product
    })
});

// =============================================
// CONTROLLER: updateProduct
//   Handles PUT /api/v1/products/:id
//   Updates an existing product by its _id.
//   - Finds the product first (returns 404 if missing)
//   - Then updates with new data from req.body
//   - { new: true } returns the updated document
//   - { runValidators: true } re-runs schema validations
// =============================================
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    ;

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        product
    })
});

// =============================================
// CONTROLLER: deleteProduct
//   Handles DELETE /api/v1/products/:id
//   Deletes an existing product by its _id.
//   - Finds the product first (returns 404 if missing)
//   - Calls deleteOne() to remove it from the database
// =============================================
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    })
});