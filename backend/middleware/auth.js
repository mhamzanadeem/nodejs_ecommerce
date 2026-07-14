const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const User = require("../models/userModel");


exports.isAuthenticateduser = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please Login to access this resource", 401))
    }

    const decodeddata = jwt.verify(token, process.env.JWT_SECRET)

    req.user = await User.findById(decodeddata.id)

    next()
})

exports.authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req, res.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource `, 403))
        }
    }
}