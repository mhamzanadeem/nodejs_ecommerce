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

/**
 * catchAsyncErrors - Higher-order function that wraps
 * async route handlers to catch rejected promises
 * and forward them to the error middleware via next().
 */
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Product - Mongoose model for the "products" collection.
 * Used to perform CRUD operations on product data.
 */
const Product = require("../models/productModels");

/**
 * ApiFeatures - Reusable query builder class that chains
 * search, filter, and pagination onto Mongoose queries.
 */
const ApiFeatures = require("../utils/apifeatures");

/**
 * ErrorHandler - Custom error class that extends Error
 * with an HTTP statusCode property for structured responses.
 */
const ErrorHandler = require("../utils/errorhandler");

// =============================================
// CONTROLLER: createProduct
//   Handles POST /api/v1/products/new
//
//   Creates a new product from the request body
//   and saves it to the MongoDB database.
//
//   Flow:
//     1. Attaches the logged-in user's ID to req.body
//        (so the product is associated with its creator)
//     2. Calls Product.create() with the full req.body
//     3. Returns 201 (Created) with the new product object
//
//   Access: Admin only (protected by isAuthenticateduser + authorizedRoles)
// =============================================
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  // Associate the product with the currently logged-in user
  req.body.user = req.user.id;

  // Create and save the product document in MongoDB
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// =============================================
// CONTROLLER: getAllProducts
//   Handles GET /api/v1/products
//
//   Fetches products from the database with support
//   for keyword search, price/category filtering,
//   and page-based pagination via query string params.
//
//   Flow:
//     1. Counts total documents for reference
//     2. Chains ApiFeatures for search -> filter -> pagination
//     3. Executes the query and returns the results
//
//   Query params:
//     ?keyword=laptop       - Search by product name
//     ?price[gte]=1000      - Filter by price range
//     ?page=2               - Pagination page number
//
//   Access: Public (no auth required)
// =============================================
exports.getAllProducts = catchAsyncErrors(async (req, res) => {
  // Number of products to display per page
  const resultPerPage = 5;

  // Count total products (useful for pagination metadata)
  const productCount = await Product.countDocuments();

  // Chain search, filter, and pagination onto the query
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  // Execute the chained query
  const products = await Product.query();

  res.status(200).json({
    success: true,
    products,
  });
});

// =============================================
// CONTROLLER: getProductDetails
//   Handles GET /api/v1/products/:id
//
//   Fetches a single product by its MongoDB _id.
//   Returns 404 (Not Found) if no product matches the ID.
//
//   Flow:
//     1. Queries Product.findById() with the URL param
//     2. If null, passes a 404 ErrorHandler to next()
//     3. Returns 200 with the product object
//
//   Access: Public (no auth required)
// =============================================
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  // Find the product by its MongoDB ObjectId
  const product = await Product.findById(req.params.id);

  // If no product found, forward 404 error to error middleware
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// =============================================
// CONTROLLER: updateProduct
//   Handles PUT /api/v1/products/:id
//
//   Updates an existing product by its MongoDB _id.
//
//   Flow:
//     1. Finds the product by ID (returns 404 if missing)
//     2. Calls findByIdAndUpdate() with new data from req.body
//     3. Options:
//        - new: true          -> Returns the UPDATED document
//        - runValidators: true -> Re-runs schema validations
//        - useFindAndModify: false -> Uses findOneAndUpdate (modern)
//     4. Returns 200 with the updated product
//
//   Access: Admin only (protected by isAuthenticateduser + authorizedRoles)
// =============================================
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  // First check if the product exists
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  // Update the product with new data from the request body
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// =============================================
// CONTROLLER: deleteProduct
//   Handles DELETE /api/v1/products/:id
//
//   Deletes an existing product from the database.
//
//   Flow:
//     1. Finds the product by ID (returns 404 if missing)
//     2. Calls deleteOne() to remove the document
//     3. Returns 200 with a success message
//
//   Access: Admin only (protected by isAuthenticateduser + authorizedRoles)
// =============================================
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  // First check if the product exists
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  // Permanently remove the product from MongoDB
  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// =============================================
// CONTROLLER: createProductReview
//   Handles PUT /api/v1/review
//
//   Allows an authenticated user to add or update
//   a review on a product. If the user has already
//   reviewed the product, their existing review is
//   updated. Otherwise, a new review is added.
//
//   Flow:
//     1. Extracts rating, comment, productId from req.body
//     2. Builds a review object with user info
//     3. Finds the product by productId
//     4. Checks if the user has already reviewed this product
//        - If yes: updates the existing review's rating & comment
//        - If no:  pushes a new review and increments numofReviews
//     5. Recalculates the product's average rating using reduce()
//     6. Saves the updated product to the database
//     7. Returns 200 with success status
//
//   Access: Authenticated users only
// =============================================
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  // Destructure the review data from the request body
  const { rating, comment, productId } = req.body;

  // Build the review object with the current user's info
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  // Find the product to add/update the review
  const product = await Product.findById(productId);

  // Check if this user has already reviewed this product
  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString(),
  );

  if (isReviewed) {
    // User already reviewed — update their existing review
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    // New reviewer — add the review and update the count
    product.reviews.push(review);
    product.numofReviews = product.reviews.length;
  }

  // Recalculate average rating: sum of all ratings / number of reviews
  product.ratings =
    product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
    product.reviews.length;

  // Save the updated product (skip validation since only review fields changed)
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// =============================================
// CONTROLLER: getProductReviews
//   Handles GET /api/v1/reviews?id=<productId>
//
//   Fetches all reviews for a specific product.
//
//   Flow:
//     1. Finds the product by its ID from query params
//     2. Returns 404 if the product is not found
//     3. Returns 200 with the product's reviews array
//
//   Access: Public (no auth required)
// =============================================
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  // Find the product by ID passed as a query parameter
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// =============================================
// CONTROLLER: deleteReview
//   Handles DELETE /api/v1/reviews?id=<reviewId>&productId=<productId>
//
//   Removes a specific review from a product and
//   recalculates the product's average rating.
//
//   Flow:
//     1. Finds the product by productId from query params
//     2. Filters out the review matching the review ID
//     3. Recalculates the average rating from remaining reviews
//     4. Updates the product with the new reviews, rating, and count
//     5. Returns 200 with success status
//
//   Access: Authenticated users only
// =============================================
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  // Find the product that contains the review
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }

  // Filter out the review that matches the given review ID
  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString(),
  );

  // Recalculate the average rating from the remaining reviews
  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  const ratings = reviews.length > 0 ? avg / reviews.length : 0;

  // Update the review count
  const numofReviews = reviews.length;

  // Persist the changes to the database
  await product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numofReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    },
  );

  res.status(200).json({
    success: true,
  });
});
