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
const mongoose = require("mongoose")

// =============================================
// CREATE: Product Schema
//   Defines the structure and validation rules
//   for each product document in MongoDB.
//   Fields:
//     - name:        String (required, trimmed)
//     - description:  String (required)
//     - price:        Number (required, max 8 chars)
//     - rating:       Number (default: 0)
//     - images:       Array of { public_id, url }
//     - category:     String (required)
//     - stock:        Number (required, max 4 chars, default: 1)
//     - numofReviews: Number (default: 0)
//     - reviews:      Array of { name, rating, comment }
//     - createdAt:    Date (default: current date)
// =============================================
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter product Name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please Enter product Description"]
    },
    price: {
        type: Number,
        required: [true, "Please Enter product Price"],
        maxLength: [8, "Price cannot exceed 8 characters"]
    },
    rating: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, "Please enter Product Category"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter Product Stock"],
        maxLength: [4, "Stock cannot exceed 4 characters"],
        default: 1

    },
    numofReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now

    }
})

// =============================================
// EXPORT: Product Model
//   Creates and exports the "Product" model.
//   This model is used in controllers to perform
//   CRUD operations on the "products" collection.
// =============================================
module.exports = mongoose.model("Product", productSchema);
