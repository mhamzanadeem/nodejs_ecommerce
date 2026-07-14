/*
=============================================
  FILE: orderRoute.js
  PURPOSE: Define API routes for order endpoints
  DESCRIPTION:
    Sets up Express Router and maps HTTP methods
    to their corresponding controller functions.
    Routes are organized by access level:
      - Protected routes (require login)
      - Admin-only routes (require login + admin role)
    This router is mounted in app.js under "/api/v1".
    So the full URLs become e.g. POST /api/v1/order/new
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
 * Order Controller Functions:
 *   - newOrder:          POST   /order/new     (Auth)
 *   - getSingleOrder:    GET    /order/:id     (Auth)
 *   - myOrders:          GET    /orders/me     (Auth)
 *   - getAllOrders:       GET    /admin/orders  (Admin)
 *   - updateOrderStatus: PUT    /admin/order/:id (Admin)
 *   - deleteOrder:       DELETE /admin/order/:id (Admin)
 */
const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

/**
 * Auth Middleware:
 *   - isAuthenticateduser: Verifies JWT token from cookie
 *     or Authorization header, attaches req.user
 *   - authorizedRoles: Factory function that checks if
 *     req.user.role is in the allowed roles list
 */
const { isAuthenticateduser, authorizedRoles } = require("../middleware/auth");

// =============================================
// CREATE: Express Router instance
//   This router handles all order-related routes.
//   It is mounted under "/api/v1" in app.js.
// =============================================
const router = express.Router();

// =============================================
// ROUTE DEFINITIONS
//
//   PROTECTED ROUTES (require authentication):
//     POST   /order/new      -> newOrder
//       Creates a new order from the checkout process.
//       Body: { shippingInfo, orderItems, paymentInfo,
//               itemsPrice, taxPrice, shippingPrice, totalPrice }
//
//     GET    /order/:id      -> getSingleOrder
//       Fetches a single order by its MongoDB ObjectId.
//       Populates user name and email for display.
//
//     GET    /orders/me      -> myOrders
//       Fetches all orders placed by the logged-in user.
//       Uses req.user._id to filter orders.
//
//   ADMIN-ONLY ROUTES (require login + admin role):
//     GET    /admin/orders   -> getAllOrders
//       Fetches all orders in the system with total revenue.
//
//     PUT    /admin/order/:id -> updateOrderStatus
//       Updates the order status (e.g., "Shipped", "Delivered").
//       When set to "Delivered", also sets deliveredAt timestamp.
//       Also reduces product stock for each ordered item.
//
//     DELETE /admin/order/:id -> deleteOrder
//       Permanently deletes an order from the database.
//
//   Middleware chain:
//     isAuthenticateduser -> Verifies JWT, attaches req.user
//     authorizedRoles("admin") -> Checks if req.user.role === "admin"
//
//   These routes are mounted under "/api/v1" in app.js,
//   so full URLs become e.g. POST /api/v1/order/new
// =============================================

// Protected: Create a new order (checkout)
router.route("/order/new").post(isAuthenticateduser, newOrder);

// Protected: Get a single order by ID
router.route("/order/:id").get(isAuthenticateduser,getSingleOrder);

// Protected: Get all orders for the logged-in user
router.route("/orders/me").get(isAuthenticateduser, myOrders);

// Admin: Get all orders with total revenue
router
  .route("/admin/orders")
  .get(isAuthenticateduser, authorizedRoles("admin"), getAllOrders);

// Admin: Update order status or delete an order
router
  .route("/admin/order/:id")
  .put(isAuthenticateduser, authorizedRoles("admin"), updateOrderStatus)
  .delete(isAuthenticateduser, authorizedRoles("admin"), deleteOrder);

// =============================================
// EXPORT: Router to be used in app.js
// =============================================
module.exports = router;
