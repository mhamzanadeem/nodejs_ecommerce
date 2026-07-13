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
// CREATE: Express App Instance
// =============================================
const app = express();

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
app.use("/api/v1" , product)

// =============================================
// EXPORT: Share the configured app with server.js
// =============================================
module.exports = app;
