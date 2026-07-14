/*
=============================================
  FILE: app.js
  PURPOSE: Express application setup & configuration
  DESCRIPTION:
    This file creates and configures the Express app.
    It sets up middleware (JSON parsing) and mounts
    all API route handlers under their respective paths.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const express = require('express');

// =============================================
// CREATE: Express App Instance & Middleware
// =============================================
const app = express();
const errorMiddleware = require("./middleware/error");

// =============================================
// MIDDLEWARE: Parse incoming JSON request bodies
// =============================================
app.use(express.json())

// =============================================
// ROUTE IMPORTS: Mount product routes
//   - All product-related endpoints are prefixed with "/api/v1"
//   - e.g., GET /api/v1/products
// =============================================
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");

app.use("/api/v1" , product)
app.use("/api/v1" , user)

// =============================================
// ERROR MIDDLEWARE: Catches all errors thrown
//   in controllers and returns structured JSON
//   response with statusCode and message.
//   Must be placed AFTER all routes.
// =============================================
app.use(errorMiddleware);
// =============================================
// EXPORT: Share the configured app with server.js
// =============================================
module.exports = app;
