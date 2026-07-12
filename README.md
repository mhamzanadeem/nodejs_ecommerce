# MERN Ecommerce

A full-stack ecommerce application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── config.env
│   ├── controllers/
│   │   └── productController.js
│   ├── routes/
│   │   └── productRoute.js
│   ├── app.js
│   └── server.js
├── frontend/
│   └── index.js
└── package.json
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nodejs_ecommerce
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `backend/config/config.env` with your environment variables:
   ```
   PORT=4000
   MONGO_URI=your_mongodb_connection_string
   ```

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with nodemon for development

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | Get all products |

## License

ISC
