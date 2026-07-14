# MERN E-Commerce 

A complete backend API for an online store, built with Node.js, Express, and MongoDB. This API handles user accounts, product management, shopping orders, and customer reviews.

---

## What This Project Does

This is the **backend** (server-side) of an e-commerce application. It provides all the data and logic that a website or mobile app needs to:

- Let customers **register** and **log in**
- Let admins **add, edit, and delete products**
- Let customers **search and browse products**
- Let customers **place orders** for products
- Let customers **write reviews** on products they purchased
- Let admins **manage orders** (update status, mark as delivered)

The frontend (website interface) is not yet built. You can test all APIs using **Postman**.

---

## Tech Stack

| Technology | What It Does |
|-----------|--------------|
| **Node.js** | JavaScript runtime that runs the server |
| **Express 5** | Web framework for building the API |
| **MongoDB** | Database that stores all data |
| **Mongoose** | Library that connects to MongoDB and defines data structures |
| **JWT (JSON Web Token)** | Security tokens that keep users logged in |
| **bcryptjs** | Encrypts passwords so they are stored securely |
| **Nodemailer** | Sends emails (used for password reset) |
| **cookie-parser** | Reads cookies from browser requests |

---

## Prerequisites

Before running this project, make sure you have:

1. **Node.js** installed (version 18 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** installed and running on your computer - [Download here](https://www.mongodb.com/try/download/community)
3. **Postman** installed for testing APIs - [Download here](https://www.postman.com/downloads/)

---

## How to Set Up and Run

### Step 1: Download the project

```bash
git clone <repository-url>
cd nodejs_ecommerce
```

### Step 2: Install packages

```bash
npm install
```

This installs all the required libraries listed in `package.json`.

### Step 3: Configure environment variables

Open the file `backend/config/config.env` and update these settings:

| Variable | What to Set | Example |
|----------|------------|---------|
| `PORT` | The port your server runs on | `4000` |
| `DB_URI` | Your MongoDB connection string | `mongodb://localhost:27017/Ecommerce` |
| `JWT_SECRET` | A secret key for signing login tokens | Any random string |
| `JWT_EXPIRE` | How long login tokens last | `5d` (5 days) |
| `COOKIE_EXPIRE` | How long cookies last (in days) | `5` |
| `SMPT_SERVICE` | Your email service | `gmail` |
| `SMPT_MAIL` | Your email address | `you@gmail.com` |
| `SMPT_PASSWORD` | Your email app password | `your-app-password` |
| `SMPT_HOST` | Email server address | `smtp.gmail.com` |
| `SMPT_PORT` | Email server port | `465` |

### Step 4: Start the server

```bash
# For development (auto-restarts when you change code):
npm run dev

# For production:
npm start
```

You should see: `Server is working on http://localhost:4000`

### Step 5: Open Postman

Open Postman and use the base URL: `http://localhost:4000/api/v1`

---

## How Authentication Works

Most APIs require you to be logged in. Here is how login works:

### Register a new account

```
POST http://localhost:4000/api/v1/register
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Returns a token and sets a cookie in your browser.

### Log in

```
POST http://localhost:4000/api/v1/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Returns a token and user data.

### How to use the token in Postman

For APIs that require login, you have **two options**:

**Option A - Cookie (automatic):**
After login in Postman, the cookie is saved automatically if you use the same tab.

**Option B - Authorization Header (recommended):**
Copy the `token` value from the login response and add it to the `Authorization` header:

```
Authorization: Bearer <paste-your-token-here>
```

### How to make someone an admin

There is no API to create an admin user. You must do it manually:

1. Open **MongoDB Compass** (the MongoDB GUI tool)
2. Connect to your database: `mongodb://localhost:27017/Ecommerce`
3. Open the `users` collection
4. Find the user you want to make admin
5. Change the `role` field from `"user"` to `"admin"`
6. Save the change

Now that user can access admin-only APIs.

---

## User Role System

| Role | What They Can Do |
|------|-----------------|
| **user** | Register, login, browse products, place orders, write reviews, view their own profile and orders |
| **admin** | Everything a regular user can do PLUS: create/edit/delete products, view all orders, update order status, view all users, delete users |

---

## API Endpoints

All URLs start with the base: `http://localhost:4000/api/v1`

### Access Level Key

| Symbol | Meaning |
|--------|---------|
| Public | Anyone can access (no login needed) |
| Auth | Must be logged in (any user) |
| Admin | Must be logged in AND have admin role |

---

### User Authentication APIs

| Method | URL | Access | What It Does | Required Body/Params |
|--------|-----|--------|-------------|---------------------|
| `POST` | `/register` | Public | Create a new account | `name`, `email`, `password` |
| `POST` | `/login` | Public | Log into your account | `email`, `password` |
| `GET` | `/logout` | Auth | Log out (clears cookie) | None |
| `POST` | `/password/forgot` | Public | Request password reset email | `email` |
| `PUT` | `/password/reset/:token` | Public | Set new password using email token | `password`, `confirmPassword` |
| `GET` | `/me` | Auth | View your own profile | None |
| `PUT` | `/password/update` | Auth | Change your password | `oldPassword`, `newPassword`, `confirmPassword` |
| `PUT` | `/me/update` | Auth | Update your name and email | `name`, `email` |

---

### Admin User Management APIs

| Method | URL | Access | What It Does | Required Body/Params |
|--------|-----|--------|-------------|---------------------|
| `GET` | `/admin/users` | Admin | View all registered users | None |
| `GET` | `/admin/user/:id` | Admin | View a specific user by ID | URL param: `id` (user ID) |
| `PUT` | `/admin/user/:id` | Admin | Update a user's name, email, or role | `name`, `email`, `role` |
| `DELETE` | `/admin/user/:id` | Admin | Delete a user permanently | URL param: `id` (user ID) |

---

### Product APIs

| Method | URL | Access | What It Does | Required Body/Params |
|--------|-----|--------|-------------|---------------------|
| `GET` | `/products` | Public | Get all products (with search & filter) | See search/filter section below |
| `GET` | `/product/:id` | Public | Get details of one product | URL param: `id` (product ID) |
| `POST` | `/products/new` | Admin | Create a new product | `name`, `description`, `price`, `images`, `category`, `stock` |
| `PUT` | `/products/:id` | Admin | Update an existing product | URL param: `id`, plus any fields to update |
| `DELETE` | `/products/:id` | Admin | Delete a product permanently | URL param: `id` (product ID) |

#### How to Search and Filter Products

| Query Parameter | Example | What It Does |
|----------------|---------|-------------|
| `keyword` | `?keyword=laptop` | Search products by name |
| `price[gte]` | `?price[gte]=1000` | Get products with price greater than or equal to 1000 |
| `price[lte]` | `?price[lte]=500` | Get products with price less than or equal to 500 |
| `price[gte]` + `price[lte]` | `?price[gte]=500&price[lte]=2000` | Get products between 500 and 2000 |
| `category` | `?category=Electronics` | Filter by category |
| `page` | `?page=2` | Show page 2 of results (5 products per page) |

**Example - Search and filter in Postman:**
```
GET http://localhost:4000/api/v1/products?keyword=phone&price[gte]=500&page=1
```

---

### Review APIs

| Method | URL | Access | What It Does | Required Body/Params |
|--------|-----|--------|-------------|---------------------|
| `PUT` | `/review` | Auth | Add or update your review on a product | `rating`, `comment`, `productId` |
| `GET` | `/reviews` | Public | Get all reviews for a product | Query: `?id=<productId>` |
| `DELETE` | `/reviews` | Auth | Delete a review | Query: `?id=<reviewId>&productId=<productId>` |

**Rating values:** 1, 2, 3, 4, or 5 (1 = worst, 5 = best)

**Example - Write a review:**
```
PUT http://localhost:4000/api/v1/review
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Great product! Loved it.",
  "productId": "60d5ecb54b24a1234c8b4567"
}
```

---

### Order APIs

| Method | URL | Access | What It Does | Required Body/Params |
|--------|-----|--------|-------------|---------------------|
| `POST` | `/order/new` | Auth | Place a new order | See order body below |
| `GET` | `/order/:id` | Admin | View a specific order | URL param: `id` (order ID) |
| `GET` | `/orders/me` | Auth | View all your own orders | None |
| `GET` | `/admin/orders` | Admin | View all orders + total revenue | None |
| `PUT` | `/admin/order/:id` | Admin | Update order status | `status` |
| `DELETE` | `/admin/order/:id` | Admin | Delete an order permanently | URL param: `id` (order ID) |

#### How to Place an Order

Send a `POST` request to `/order/new` with this body:

```json
{
  "shippingInfo": {
    "address": "123 Main Street",
    "city": "Lahore",
    "state": "Punjab",
    "country": "Pakistan",
    "pinCode": 54000,
    "phoneNo": 923001234567
  },
  "orderItems": [
    {
      "name": "Wireless Mouse",
      "price": 2500,
      "quantity": 2,
      "image": "https://example.com/mouse.jpg",
      "productId": "60d5ecb54b24a1234c8b4567"
    }
  ],
  "paymentInfo": {
    "id": "pay_123456",
    "status": "succeeded"
  },
  "itemsPrice": 5000,
  "taxPrice": 750,
  "shippingPrice": 200,
  "totalPrice": 5950
}
```

#### Order Status Values

| Status | Meaning |
|--------|---------|
| `Processing` | Order received, being prepared |
| `Shipped` | Order sent to delivery company |
| `Delivered` | Order reached the customer |

**Note:** When an order is marked as `Delivered`, the product stock is automatically reduced.

---

### Example: Full Shopping Flow (Step by Step)

**Step 1 - Register:**
```
POST /api/v1/register
Body: { "name": "Ali", "email": "ali@example.com", "password": "pass1234" }
```

**Step 2 - Login:**
```
POST /api/v1/login
Body: { "email": "ali@example.com", "password": "pass1234" }
```
Copy the `token` from the response.

**Step 3 - Browse products:**
```
GET /api/v1/products
```

**Step 4 - View a specific product:**
```
GET /api/v1/product/<product-id>
```

**Step 5 - Place an order:**
```
POST /api/v1/order/new
Authorization: Bearer <your-token>
Body: { shippingInfo, orderItems, paymentInfo, prices }
```

**Step 6 - View your orders:**
```
GET /api/v1/orders/me
Authorization: Bearer <your-token>
```

---

## Project File Structure

```
nodejs_ecommerce/
├── backend/
│   ├── config/
│   │   ├── config.env          # Environment variables (ports, DB, secrets)
│   │   └── database.js         # MongoDB connection setup
│   ├── controllers/
│   │   ├── userController.js   # User registration, login, profile, admin user management
│   │   ├── productController.js # Product CRUD, reviews
│   │   └── orderController.js  # Order creation, viewing, status updates
│   ├── middleware/
│   │   ├── auth.js             # Login verification & admin role checking
│   │   ├── catchAsyncErrors.js # Catches errors from async functions
│   │   └── error.js            # Global error handler (returns error messages)
│   ├── models/
│   │   ├── userModel.js        # User data structure (name, email, password, role)
│   │   ├── productModels.js    # Product data structure (name, price, stock, reviews)
│   │   └── orderModel.js       # Order data structure (items, shipping, payment, status)
│   ├── routes/
│   │   ├── userRoute.js        # User API route definitions
│   │   ├── productRoute.js     # Product & review API route definitions
│   │   └── orderRoute.js       # Order API route definitions
│   ├── utils/
│   │   ├── apifeatures.js      # Search, filter, pagination helper
│   │   ├── errorhandler.js     # Custom error class with HTTP status codes
│   │   ├── jwtToken.js         # Generates login tokens and sets cookies
│   │   └── sendEmail.js        # Sends password reset emails
│   ├── app.js                  # Creates Express app, connects all routes
│   └── server.js               # Starts the server, connects to database
├── frontend/
│   └── index.js                # Placeholder (not yet built)
├── package.json                # Project dependencies and run scripts
└── README.md                   # This file
```

---

## NPM Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Starts the server in development mode (auto-restarts when code changes) |
| `npm start` | Starts the server in production mode |
| `npm test` | Runs tests (not configured yet) |

---

## Error Handling

When something goes wrong, the API returns a clear error message:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product Not Found"
}
```

Common errors:

| Status Code | Meaning | Common Cause |
|-------------|---------|-------------|
| `400` | Bad Request | Missing required fields, invalid data format |
| `401` | Unauthorized | Not logged in, or wrong password |
| `403` | Forbidden | Logged in but not an admin |
| `404` | Not Found | Product, user, or order doesn't exist |
| `500` | Server Error | Something went wrong on the server |

---

## Data Structures

### User
| Field | Type | Description |
|-------|------|-------------|
| name | String | 4-30 characters |
| email | String | Valid email format, unique |
| password | String | At least 8 characters (stored encrypted) |
| role | String | "user" (default) or "admin" |
| avatar | Array | Profile picture (public_id, url) |
| resetPasswordToken | String | Used for password reset |
| resetPasswordExpire | Date | Token expiry time |

### Product
| Field | Type | Description |
|-------|------|-------------|
| name | String | Product name |
| description | String | Product description |
| price | Number | Product price (max 8 digits) |
| rating | Number | Average rating (0-5) |
| images | Array | Product images (public_id, url) |
| category | String | e.g., "Electronics" |
| stock | Number | Units available (max 4 digits) |
| numofReviews | Number | Total number of reviews |
| reviews | Array | List of customer reviews |
| user | ObjectId | Who created the product |
| createdAt | Date | When the product was added |

### Order
| Field | Type | Description |
|-------|------|-------------|
| shippingInfo | Object | address, city, state, country, pinCode, phoneNo |
| orderItems | Array | name, price, quantity, image, product |
| user | ObjectId | Who placed the order |
| paymentInfo | Object | id, status |
| paidAt | Date | When payment was made |
| itemsPrice | Number | Subtotal of items |
| taxPrice | Number | Tax amount |
| shippingPrice | Number | Shipping fee |
| totalPrice | Number | Grand total |
| orderStatus | String | Processing, Shipped, or Delivered |
| deliveredAt | Date | When delivered |
| createdAt | Date | When order was placed |

---


