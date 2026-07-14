/*
=============================================
  FILE: productModels.js
  PURPOSE: Mongoose schema & model definition for Product
  DESCRIPTION:
    Defines the structure (schema) of a Product document
    in MongoDB. Each product has:
      - name, description, price, rating, images,
        category, stock, reviews, and createdAt fields.
    The schema is compiled into a Mongoose Model
    which is exported for use in controllers.
=============================================
*/

// =============================================
// IMPORTS
// =============================================

/**
 * mongoose - Mongoose ODM library for interacting
 * with MongoDB. Provides schema-based modeling,
 * validation, and query building.
 */
const mongoose = require("mongoose");

// =============================================
// SCHEMA: Product
//   Defines the structure and validation rules
//   for each product document in the "products"
//   collection in MongoDB.
// =============================================
const productSchema = new mongoose.Schema({
  // -------------------------------------------
  // FIELD: name
  //   The product's display name.
  //   - Required with custom error message
  //   - Trimmed to remove leading/trailing whitespace
  // -------------------------------------------
  name: {
    type: String,
    required: [true, "Please Enter product Name"],
    trim: true,
  },

  // -------------------------------------------
  // FIELD: description
  //   A detailed description of the product.
  //   - Required with custom error message
  // -------------------------------------------
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
  },

  // -------------------------------------------
  // FIELD: price
  //   The product's price in the store's currency.
  //   - Required with custom error message
  //   - Max 8 characters (prevents unreasonable values)
  // -------------------------------------------
  price: {
    type: Number,
    required: [true, "Please Enter product Price"],
    maxLength: [8, "Price cannot exceed 8 characters"],
  },

  // -------------------------------------------
  // FIELD: rating
  //   The product's average rating (0-5 scale).
  //   - Defaults to 0 (no ratings yet)
  //   - Updated automatically when reviews are added
  // -------------------------------------------
  rating: {
    type: Number,
    default: 0,
  },

  // -------------------------------------------
  // FIELD: images
  //   Array of product images. Each image has:
  //     - public_id: Cloud storage identifier
  //     - url:       Public URL to access the image
  //   Supports multiple images per product.
  // -------------------------------------------
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],

  // -------------------------------------------
  // FIELD: category
  //   The product category (e.g., "Electronics").
  //   - Required with custom error message
  //   - Used for filtering products by category
  // -------------------------------------------
  category: {
    type: String,
    required: [true, "Please enter Product Category"],
  },

  // -------------------------------------------
  // FIELD: stock
  //   The number of units available for purchase.
  //   - Required with custom error message
  //   - Max 4 characters (prevents unreasonable values)
  //   - Defaults to 1 (single item in stock)
  // -------------------------------------------
  stock: {
    type: Number,
    required: [true, "Please enter Product Stock"],
    maxLength: [4, "Stock cannot exceed 4 characters"],
    default: 1,
  },

  // -------------------------------------------
  // FIELD: numofReviews
  //   Total number of reviews for this product.
  //   - Defaults to 0
  //   - Updated when reviews are added/removed
  // -------------------------------------------
  numofReviews: {
    type: Number,
    default: 0,
  },

  // -------------------------------------------
  // FIELD: reviews
  //   Array of customer reviews for this product.
  //   Each review contains:
  //     - user:    Reference to the User who wrote it
  //     - name:    Display name of the reviewer
  //     - rating:  Star rating (1-5)
  //     - comment: Review text
  // -------------------------------------------
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],

  // -------------------------------------------
  // FIELD: user
  //   Reference to the User who created this product.
  //   Uses MongoDB ObjectId and links to the "User" model.
  //   Required so each product is associated with an owner.
  //   Set via req.user.id in the createProduct controller.
  // -------------------------------------------
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  // -------------------------------------------
  // FIELD: createdAt
  //   Timestamp of when the product was created.
  //   - Defaults to the current date/time
  //   - Automatically set by Mongoose
  // -------------------------------------------
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// =============================================
// EXPORT: Product Model
//   Creates and exports the "Product" model.
//   This model is used in controllers to perform
//   CRUD operations on the "products" collection.
//   Mongoose automatically pluralizes "Product"
//   to "products" for the collection name.
// =============================================
module.exports = mongoose.model("Product", productSchema);
