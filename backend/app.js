/*
=============================================
  FILE: app.js
  PURPOSE: Express application setup & configuration
  DESCRIPTION:
    This file creates and configures the Express app.
    It sets up middleware (JSON parsing) and mounts
    all API route handlers under their respective paths.
    The configured app is exported and used by server.js
    to start the HTTP server.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const express = require("express");
const cookieParser = require("cookie-parser");

// =============================================
// CREATE: Express App Instance
//   Initializes the Express application. This app
//   object will have middleware and routes attached
//   before being exported for use in server.js.
// =============================================
const app = express();

// =============================================
// SETTINGS: Extended Query Parser
//   Enables nested object parsing in query strings.
//   Without this, ?price[gt]=500 becomes
//   { "price[gt]": "500" } instead of { price: { gt: "500" } }
//   Required for the ApiFeatures filter method to work.
// =============================================
app.set("query parser", "extended");

// =============================================
// IMPORTS: Middleware & Routes
//   - errorMiddleware: Global error handler (must be
//     registered AFTER all routes)
//   - product routes: All product-related endpoints
//   - user routes: All user authentication endpoints
// =============================================
const errorMiddleware = require("./middleware/error");
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
/**
 * order routes: All order-related endpoints
 * (create order, view orders, manage orders)
 */
const order = require("./routes/orderRoute");
// =============================================
// MIDDLEWARE: Parse JSON Request Bodies
//   Enables Express to automatically parse incoming
//   requests with Content-Type: application/json.
//   This populates req.body with the parsed data,
//   which is used by POST/PUT route handlers.
// =============================================
app.use(express.json());

// =============================================
// MIDDLEWARE: Parse Cookies
//   Parses the Cookie header from incoming requests
//   and populates req.cookies with key-value pairs.
//   Required by the auth middleware to read the JWT
//   token from the "token" cookie.
// =============================================
app.use(cookieParser());

// =============================================
// ROUTE MOUNTING
//   All product, user, and order routes are mounted
//   under the "/api/v1" prefix. This provides versioning
//   for the API. For example:
//     GET  /api/v1/products       -> getAllProducts
//     POST /api/v1/register       -> registerUser
//     POST /api/v1/login          -> loginUser
//     POST /api/v1/order/new      -> newOrder
//
//   Each router handles multiple HTTP methods
//   (GET, POST, PUT, DELETE) on their respective paths.
// =============================================
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
// =============================================
// ERROR HANDLING MIDDLEWARE
//   Catches all errors thrown or passed via next(error)
//   in controllers. Must be registered AFTER all routes
//   so that Express calls it when an error propagates.
//   The middleware reads err.statusCode and err.message
//   and returns a structured JSON error response.
// =============================================
app.use(errorMiddleware);

// =============================================
// EXPORT: Share the configured app with server.js
//   server.js imports this app and calls app.listen()
//   to start accepting HTTP requests.
// =============================================
module.exports = app;
