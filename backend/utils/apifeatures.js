/*
=============================================
  FILE: apifeatures.js
  PURPOSE: Reusable query builder for Mongoose queries
  DESCRIPTION:
    Provides the ApiFeatures class that chains search,
    filter, and pagination operations onto a Mongoose
    query. Used in productController.js to enhance
    GET /api/v1/products with query string parameters.

    How it works:
      1. Instantiate with a Mongoose query + req.query
      2. Chain .search() -> .filter() -> .pagination()
      3. Each method modifies this.query and returns `this`
         for chaining.
      4. Finally call `await apiFeature.query` to execute.

    Example query string:
      GET /api/v1/products?keyword=laptop&price[gte]=1000&page=2
=============================================
*/

// =============================================
// CLASS: ApiFeatures
//   A reusable query builder that adds search,
//   filter, and pagination to Mongoose queries.
//   Each method modifies the query and returns
//   `this` to allow method chaining.
// =============================================
class ApiFeatures {
  /**
   * Constructor: Initializes the query builder.
   *
   * @param {Object} query   - A Mongoose query object (e.g. Product.find())
   * @param {Object} querystr - The req.query object from Express (URL query params)
   *
   * Stores the Mongoose query in `this.query` and the
   * raw query string params in `this.querystr` so that
   * search/filter/pagination methods can read from them.
   */
  constructor(query, querystr) {
    this.query = query;
    this.querystr = querystr;
  }

  // =============================================
  // METHOD: search()
  //   Adds a case-insensitive regex search on the
  //   `name` field of products.
  //
  //   How it works:
  //     1. Checks if req.query.keyword is provided
  //        (e.g., ?keyword=laptop)
  //     2. If provided, builds a MongoDB $regex filter:
  //        { name: { $regex: "laptop", $options: "i" } }
  //     3. The "i" option makes it case-insensitive
  //     4. If no keyword, empty filter matches all documents
  //
  //   @returns {ApiFeatures} this - Returns self for method chaining
  // =============================================
  search() {
    // Build the search filter based on keyword presence
    const keyword = this.querystr.keyword
      ? {
          name: {
            $regex: this.querystr.keyword,
            $options: "i", // Case-insensitive search
          },
        }
      : {};

    // Apply the search filter to the Mongoose query
    this.query = this.query.find({ ...keyword });
    return this;
  }

  // =============================================
  // METHOD: filter()
  //   Adds price range and category filters to the query.
  //
  //   How it works:
  //     1. Copies req.query to avoid mutating the original
  //     2. Removes "keyword", "page", "limit" from the copy
  //        (these are handled by search() and pagination())
  //     3. Converts MongoDB comparison operators in the URL:
  //        ?price[gte]=1000  ->  { price: { $gte: 1000 } }
  //        by replacing gte/gt/lt/lte with $gte/$gt/$lt/$lte
  //     4. Applies the remaining filters to the Mongoose query
  //
  //   Example:
  //     ?price[gte]=100&price[lte]=500&category=Electronics
  //     -> { price: { $gte: 100, $lte: 500 }, category: "Electronics" }
  //
  //   @returns {ApiFeatures} this - Returns self for method chaining
  // =============================================
  filter() {
    // Create a copy to avoid mutating the original query object
    const queryCopy = { ...this.querystr };

    // Fields handled by other methods — remove them from the filter
    const removeFields = ["keyword", "page", "limit"];
    removeFields.forEach((key) => delete queryCopy[key]);

    // Convert URL operators (gte, gt, lt, lte) to MongoDB format ($gte, $gt, $lt, $lte)
    let querystr = JSON.stringify(queryCopy);
    querystr = querystr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    // Parse and convert string values to numbers for proper MongoDB comparison
    const parsedQuery = JSON.parse(querystr);
    for (const key in parsedQuery) {
      if (typeof parsedQuery[key] === "object" && parsedQuery[key] !== null) {
        for (const innerKey in parsedQuery[key]) {
          parsedQuery[key][innerKey] = Number(parsedQuery[key][innerKey]);
        }
      }
    }

    // Apply the filters to the Mongoose query
    this.query = this.query.find(parsedQuery);
    return this;
  }

  // =============================================
  // METHOD: pagination()
  //   Limits and skips results for page-based pagination.
  //
  //   How it works:
  //     1. Reads the `page` query param (defaults to 1)
  //     2. Calculates how many documents to skip:
  //        skip = resultPerPage * (currentPage - 1)
  //     3. Applies .limit() and .skip() to the Mongoose query
  //
  //   Example:
  //     resultPerPage=5, page=3 -> skip 10, return 5 docs
  //     This gives results 11-15 (the third page)
  //
  //   @param {number} resultPerPage - Max number of results per page
  //   @returns {ApiFeatures} this - Returns self for method chaining
  // =============================================
  pagination(resultPerPage) {
    // Current page number (defaults to 1 if not provided)
    const currentPage = Number(this.querystr.page) || 1;

    // Calculate how many documents to skip for this page
    const skip = resultPerPage * (currentPage - 1);

    // Apply limit and skip to the Mongoose query
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

// =============================================
// EXPORT: ApiFeatures class
//   Used in productController.js to build
//   complex queries from URL query parameters.
// =============================================
module.exports = ApiFeatures;
