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

    NOTE: This file contains duplicated product controller
    functions (getAllProducts, getProductDetails, etc.)
    that were copy-pasted from productController.js.
    These reference an undefined `Product` variable and
    will crash at runtime. They should be removed.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const catchAsyncErrors = require("../middleware/catchAsyncErrors"); // Wraps async functions to catch errors
const User = require("../models/userModel");                       // Mongoose User model
const ApiFeatures = require("../utils/apifeatures");               // Query builder for search/filter/pagination
const ErrorHandler = require("../utils/errorhandler");             // Custom error class with statusCode
const sendToken = require("../utils/jwtToken");                    // Utility to generate JWT and send as cookie

// =============================================
// CONTROLLER: registerUser
//   Handles POST /api/v1/register
//   Creates a new user account from req.body data.
//   1. Extracts name, email, password from the request body
//   2. Creates a new User document with a placeholder avatar
//   3. Calls sendToken() to generate a JWT and return it
//      as an HTTP-only cookie with a 201 (Created) status
// =============================================
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    const user = await User.create({
        name, email, password, avatar: { public_id: "this is a sample id", url: "profilepicUrl" },
    })

    sendToken(user, 201, res)
});

// =============================================
// CONTROLLER: loginUser
//   Handles POST /api/v1/login
//   Authenticates an existing user by email & password.
//   1. Validates that both email and password are provided
//   2. Finds the user by email (includes password field via .select("+password"))
//   3. Compares the entered password against the stored hash
//   4. If valid, calls sendToken() to generate a JWT
//
//   BUG: comparePassword() is called without `await` and
//   without passing the `password` argument — password
//   validation is effectively bypassed at runtime.
// =============================================
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email & Password", 400))
    }

    const user = await User.findOne({
        email
    }).select("+password")

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    const isPasswordMatch = user.comparePassword();

    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }
    sendToken(user, 200, res)

});


// =============================================
// WARNING: The functions below are duplicated from
// productController.js and will NOT work here.
// They reference `Product` which is not imported.
// They should be removed from this file.
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
// CONTROLLER: getProductDetails (DUPLICATE - from productController)
//   Handles GET /api/v1/products/:id
//   WARNING: This is a copy-paste duplicate and will crash
//   at runtime because `Product` is not imported in this file.
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
// CONTROLLER: updateProduct (DUPLICATE - from productController)
//   Handles PUT /api/v1/products/:id
//   WARNING: This is a copy-paste duplicate and will crash
//   at runtime because `Product` is not imported in this file.
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
// CONTROLLER: deleteProduct (DUPLICATE - from productController)
//   Handles DELETE /api/v1/products/:id
//   WARNING: This is a copy-paste duplicate and will crash
//   at runtime because `Product` is not imported in this file.
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
