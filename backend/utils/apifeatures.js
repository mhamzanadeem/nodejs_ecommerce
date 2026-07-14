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

class ApiFeatures{
    /**
     * @param {Object} query   - A Mongoose query object (e.g. Product.find())
     * @param {Object} querystr - The req.query object from Express (URL query params)
     *
     * Stores the Mongoose query in `this.query` and the
     * raw query string params in `this.querystr` so that
     * search/filter/pagination methods can read from them.
    */
    constructor(query , querystr){
        this.query = query
        this.querystr = querystr
    }

    /**
     * SEARCH: Adds a case-insensitive regex search on the `name` field.
     *
     * If `req.query.keyword` is provided (e.g. ?keyword=laptop),
     * it builds a MongoDB $regex filter:
     *   { name: { $regex: "laptop", $options: "i" } }
     *
     * The "i" option makes it case-insensitive.
     * If no keyword is provided, an empty filter matches all documents.
     *
     * @returns {ApiFeatures} this - Returns self for method chaining
    */
    search(){
        const keyword = this.querystr.keyword
        ? {
            name : {
                $regex: this.querystr.keyword,
                $options: "i",
            }
        } :{

        }
        this.query = this.query.find({...keyword})
        return this
    }

    /**
     * FILTER: Adds price range and category filters.
     *
     * 1. Copies req.query to avoid mutating the original.
     * 2. Removes "keyword", "page", "limit" from the copy
     *    (these are handled by search() and pagination()).
     * 3. Converts MongoDB comparison operators in the URL:
     *      ?price[gte]=1000  ->  { price: { $gte: 1000 } }
     *    by replacing gte/gt/lt/lte with $gte/$gt/$lt/$lte.
     * 4. Applies the remaining filters to the Mongoose query.
     *
     * @returns {ApiFeatures} this - Returns self for method chaining
    */
    filter(){
        const queryCopy = {...this.querystr}

        const removeFields = ["keyword" , "page", "limit"]

        removeFields.forEach((key)=> delete queryCopy[key])

        let querystr = JSON.stringify(queryCopy)
        querystr = querystr.replace(/\b(gt|gte|lt|lte)/g, (key) => `$${key}`);

        this.query = this.query.find(JSON.parse(querystr));

        return this
    }

    /**
     * PAGINATION: Limits and skips results for page-based pagination.
     *
     * - Reads the `page` query param (defaults to 1).
     * - Calculates how many documents to skip:
     *     skip = resultPerPage * (currentPage - 1)
     * - Applies .limit() and .skip() to the Mongoose query.
     *
     * Example: resultPerPage=5, page=3 -> skip 10, return 5 docs
     *
     * @param {number} resultPerPage - Max number of results per page
     * @returns {ApiFeatures} this - Returns self for method chaining
    */
    pagination(resultPerPage){
        const currentPage = Number(this.querystr.page) || 1
        const skip = resultPerPage * (currentPage - 1)
        this.query = this.query.limit(resultPerPage).skip(skip)
        return this;
    }
}

module.exports = ApiFeatures
