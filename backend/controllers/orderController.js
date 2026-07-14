/*
=============================================
  FILE: orderController.js
  PURPOSE: Request handler functions for order routes
  DESCRIPTION:
    Contains controller logic for order-related
    API endpoints. Each function handles a specific
    HTTP request (e.g., create order, get order details)
    and sends back the appropriate JSON response.
    Controllers are called by route definitions in orderRoute.js.

    Order lifecycle:
      1. User places order → newOrder creates the document
      2. Admin can view all orders → myOrders (user) / getAllOrders (admin)
      3. Admin updates order status → updateOrderStatus
      4. Admin deletes order → deleteOrder
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
 * Order - Mongoose model for the "orders" collection.
 * Used to perform CRUD operations on order data.
 */
const Order = require("../models/orderModel");

/**
 * Product - Mongoose model for the "products" collection.
 * Used to update stock quantities when orders are placed.
 */
const Product = require("../models/productModels");

/**
 * ErrorHandler - Custom error class that extends Error
 * with an HTTP statusCode property for structured responses.
 */
const ErrorHandler = require("../utils/errorhandler");

// =============================================
// CONTROLLER: newOrder
//   Handles POST /api/v1/order/new
//
//   Creates a new order from the request body data.
//   This is typically called during the checkout process
//   after the user has confirmed their cart and payment.
//
//   Flow:
//     1. Extracts order details from req.body:
//        - shippingInfo:   Customer's delivery address
//        - orderItems:     Products being ordered
//        - paymentInfo:    Payment transaction details
//        - itemsPrice:     Subtotal of all items
//        - taxPrice:       Tax amount
//        - shippingPrice:  Shipping fee
//        - totalPrice:     Grand total
//     2. Adds paidAt timestamp (current time)
//     3. Adds user reference from req.user (set by auth middleware)
//     4. Creates the order document in MongoDB
//     5. Returns 201 (Created) with the new order object
//
//   Access: Authenticated users only
// =============================================
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  // Destructure order details from the request body
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  // Create and save the order document in MongoDB
  // paidAt is set to the current timestamp
  // user is set to the logged-in user's ID from auth middleware
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  // Return the newly created order with 201 (Created) status
  res.status(201).json({
    success: true,
    order,
  });
});

// =============================================
// CONTROLLER: getSingleOrder
//   Handles GET /api/v1/order/:id
//
//   Fetches a single order by its MongoDB _id.
//   Also populates the user field with name and email
//   so the response includes customer information.
//
//   Flow:
//     1. Finds the order by ID from URL params
//     2. Populates the user reference (name, email only)
//     3. Returns 404 if order is not found
//     4. Returns 200 with the order object
//
//   Access: Authenticated users (should be limited to
//   the order owner or admin in production)
// =============================================
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  // Find the order by its MongoDB ObjectId
  // .populate() replaces the user ObjectId with actual user data
  // Only selects name and email fields for privacy
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );

  // If no order found, forward 404 error to error middleware
  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  // Return the order with 200 (OK) status
  res.status(200).json({
    success: true,
    order,
  });
});

// =============================================
// CONTROLLER: myOrders
//   Handles GET /api/v1/orders/me
//
//   Fetches all orders placed by the currently
//   authenticated user. Uses req.user._id (set by
//   auth middleware) to filter orders by user.
//
//   Flow:
//     1. Finds all orders where user matches req.user._id
//     2. Returns 200 with the orders array
//
//   Access: Authenticated users only
// =============================================
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  // Find all orders belonging to the logged-in user
  const orders = await Order.find({ user: req.user._id });

  // Return the user's orders with 200 (OK) status
  res.status(200).json({
    success: true,
    orders,
  });
});

// =============================================
// CONTROLLER: getAllOrders (Admin)
//   Handles GET /api/v1/admin/orders
//
//   Fetches all orders in the system with a calculated
//   total amount. Used by admins to monitor all orders.
//
//   Flow:
//     1. Fetches all orders from the database
//     2. Calculates the total revenue by summing totalPrice
//     3. Returns 200 with orders array and total amount
//
//   Access: Admin only
// =============================================
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  // Fetch all orders from the database
  const orders = await Order.find();

  // Calculate total revenue by summing all order total prices
  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  // Return all orders with the calculated total
  res.status(200).json({
    success: true,
    orders,
    totalAmount,
  });
});

// =============================================
// CONTROLLER: updateOrderStatus (Admin)
//   Handles PUT /api/v1/admin/order/:id
//
//   Updates the status of an order (e.g., "Shipped",
//   "Delivered"). When status is set to "Delivered",
//   also sets the deliveredAt timestamp.
//
//   Flow:
//     1. Finds the order by ID from URL params
//     2. Returns 404 if order is not found
//     3. Updates the orderStatus from req.body
//     4. If status is "Delivered", sets deliveredAt to now
//     5. Saves the updated order to the database
//     6. Returns 200 with the updated order
//
//   Access: Admin only
// =============================================
exports.updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  // Find the order by its MongoDB ObjectId
  const order = await Order.findById(req.params.id);

  // If no order found, forward 404 error to error middleware
  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  // If order is already delivered, prevent further status updates
  if (order.orderStatus === "Delivered") {
    return next(
      new ErrorHandler("You have already delivered this order", 400),
    );
  }

  // Update stock quantity for each ordered product
  // This reduces the stock count to reflect the sold items
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Subtract the ordered quantity from the product's stock
    product.stock -= item.quantity;

    // Save the updated product (skip validation for stock-only update)
    await product.save({ validateBeforeSave: false });
  }

  // Update the order status
  order.orderStatus = req.body.status;

  // If the status is "Delivered", record the delivery timestamp
  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  // Save the updated order to the database
  await order.save({ validateBeforeSave: false });

  // Return the updated order with 200 (OK) status
  res.status(200).json({
    success: true,
    order,
  });
});

// =============================================
// CONTROLLER: deleteOrder (Admin)
//   Handles DELETE /api/v1/admin/order/:id
//
//   Permanently deletes an order from the database.
//   Should only be used for orders that haven't been
//   delivered yet (e.g., cancelled orders).
//
//   Flow:
//     1. Finds the order by ID from URL params
//     2. Returns 404 if order is not found
//     3. Calls deleteOne() to remove the document
//     4. Returns 200 with a success message
//
//   Access: Admin only
// =============================================
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  // Find the order by its MongoDB ObjectId
  const order = await Order.findById(req.params.id);

  // If no order found, forward 404 error to error middleware
  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }

  // Permanently remove the order from MongoDB
  await order.deleteOne();

  // Return success message with 200 (OK) status
  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});
