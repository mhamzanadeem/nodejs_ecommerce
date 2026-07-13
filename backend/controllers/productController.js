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
// IMPORTS: Product Model (for DB operations)
// =============================================
const Product = require("../models/productModels")

// =============================================
// CREATE: Product 
// =============================================
exports.createProduct = async (req, res, next) => {
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })
}

// =============================================
// CONTROLLER: getAllProducts
//   Handles GET /api/v1/products
//   Returns a JSON response with all products.
//   NOTE: Replace the response with actual database
//         query using Product.find() once model is ready.
// =============================================
exports.getAllProducts = async (req, res) => {

    const products = await Product.find();

    res.status(200).json({
        success: true,
        products
    })
}

exports.getProductDetails = async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(500).json({
            success: false,
            message: "Product not found"
        })
    }


    res.status(200).json({
        success: true,
        product
    })
}

exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(500).json({
            success: false,
            message: "Product not found"
        })
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
}

exports.deleteProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(500).json({
            success: false,
            message: "Product not found"
        })
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    })
}