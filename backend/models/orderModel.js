/*
=============================================
  FILE: orderModel.js
  PURPOSE: Mongoose schema & model definition for Order
  DESCRIPTION:
    Defines the structure (schema) of an Order document
    in MongoDB. Each order captures:
      - Shipping information (address, city, state, etc.)
      - Ordered items (name, price, quantity, product ref)
      - Payment details (payment ID, status, paid date)
      - Price breakdown (items, tax, shipping, total)
      - Order status (Processing, Shipped, Delivered, etc.)
      - Delivery timestamp
      - Reference to the user who placed the order
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
// SCHEMA: Order
//   Defines the structure and validation rules
//   for each order document in the "orders"
//   collection in MongoDB.
// =============================================
const orderSchema = new mongoose.Schema({
  // -------------------------------------------
  // FIELD: shippingInfo
  //   Contains the customer's shipping address.
  //   All sub-fields are required to ensure
  //   complete delivery information is captured
  //   when an order is placed.
  // -------------------------------------------
  shippingInfo: {
    // Street address for delivery
    address: {
      type: String,
      required: true,
    },
    // City where the order should be delivered
    city: {
      type: String,
      required: true,
    },
    // State/province/region
    state: {
      type: String,
      required: true,
    },
    // Country name
    country: {
      type: String,
      required: true,
    },
    // Postal/ZIP code for the delivery address
    pinCode: {
      type: Number,
      required: true,
    },
    // Contact phone number for delivery coordination
    phoneNo: {
      type: Number,
      required: true,
    },
  },

  // -------------------------------------------
  // FIELD: orderItems
  //   Array of items included in this order.
  //   Each item captures:
  //     - name:     Product name at time of order
  //     - price:    Unit price at time of order
  //     - quantity: Number of units ordered
  //     - image:    Product image URL
  //     - product:  Reference to the Product document
  //
  //   NOTE: name, price, and image are denormalized
  //   (copied from Product) so the order retains
  //   accurate data even if the product changes later.
  // -------------------------------------------
  orderItems: [
    {
      // Product name snapshot at time of purchase
      name: {
        type: String,
        required: true,
      },
      // Unit price snapshot at time of purchase
      price: {
        type: Number,
        required: true,
      },
      // Number of units ordered
      quantity: {
        type: Number,
        required: true,
      },
      // Product image URL snapshot
      image: {
        type: String,
        required: true,
      },
      // Reference to the Product document in the database
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],

  // -------------------------------------------
  // FIELD: user
  //   Reference to the User who placed this order.
  //   Uses MongoDB ObjectId and links to the "User" model.
  //   Required so each order is associated with a customer.
  // -------------------------------------------
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },

  // -------------------------------------------
  // FIELD: paymentInfo
  //   Contains payment gateway details.
  //   - id:     Transaction/payment ID from the gateway
  //   - status: Payment status (e.g., "succeeded", "pending")
  // -------------------------------------------
  paymentInfo: {
    // Unique transaction ID from the payment provider
    id: {
      type: String,
      required: true,
    },
    // Current payment status (e.g., "succeeded", "pending", "failed")
    status: {
      type: String,
      required: true,
    },
  },

  // -------------------------------------------
  // FIELD: paidAt
  //   Timestamp of when the payment was completed.
  //   Required to track when the order was paid for.
  // -------------------------------------------
  paidAt: {
    type: Date,
    required: true,
  },

  // -------------------------------------------
  // FIELD: itemsPrice
  //   Total price of all items before tax and shipping.
  //   Calculated as: sum of (price * quantity) for each item.
  // -------------------------------------------
  itemsPrice: {
    type: Number,
    default: 0,
    required: true,
  },

  // -------------------------------------------
  // FIELD: taxPrice
  //   Total tax amount applied to the order.
  //   Calculated based on itemsPrice and applicable tax rate.
  // -------------------------------------------
  taxPrice: {
    type: Number,
    default: 0,
    required: true,
  },

  // -------------------------------------------
  // FIELD: shippingPrice
  //   Shipping/delivery fee for the order.
  //   May be calculated based on weight, distance,
  //   or set as a flat rate.
  // -------------------------------------------
  shippingPrice: {
    type: Number,
    default: 0,
    required: true,
  },

  // -------------------------------------------
  // FIELD: totalPrice
  //   Grand total for the order.
  //   Calculated as: itemsPrice + taxPrice + shippingPrice
  //   This is the final amount charged to the customer.
  // -------------------------------------------
  totalPrice: {
    type: Number,
    default: 0,
    required: true,
  },

  // -------------------------------------------
  // FIELD: orderStatus
  //   Current status of the order fulfillment.
  //   Tracks the order lifecycle:
  //     - Processing → Shipped → Out for Delivery → Delivered
  //   Defaults to "Processing" when the order is placed.
  // -------------------------------------------
  orderStatus: {
    type: String,
    required: true,
    default: "Processing",
  },

  // -------------------------------------------
  // FIELD: deliveredAt
  //   Timestamp of when the order was delivered.
  //   Set when the order status is updated to "Delivered".
  //   Remains null/undefined until delivery is confirmed.
  // -------------------------------------------
  deliveredAt: Date,

  // -------------------------------------------
  // FIELD: createdAt
  //   Timestamp of when the order was created.
  //   Automatically set to the current date/time
  //   when the order document is first saved.
  // -------------------------------------------
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// =============================================
// EXPORT: Order Model
//   Creates and exports the "Order" model.
//   This model is used in controllers to perform
//   CRUD operations on the "orders" collection.
//   Mongoose automatically pluralizes "Order"
//   to "orders" for the collection name.
// =============================================
module.exports = mongoose.model("Order", orderSchema);
