/*
=============================================
  FILE: userController.js
  PURPOSE: Request handler functions for user routes
  DESCRIPTION:
    Contains controller logic for user-related
    API endpoints. Each function handles a specific
    HTTP request (e.g., register, login) and sends
    back the appropriate JSON response.
    Controllers are called by route definitions in userRoute.js.

    NOTE: This file contains duplicated product controller
    functions (getAllProducts, getProductDetails, etc.)
    that were copy-pasted from productController.js.
    These reference an undefined `Product` variable and
    will crash at runtime. They should be removed.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const catchAsyncErrors = require("../middleware/catchAsyncErrors"); // Wraps async functions to catch errors
const User = require("../models/userModel");                       // Mongoose User model
const ApiFeatures = require("../utils/apifeatures");               // Query builder for search/filter/pagination
const ErrorHandler = require("../utils/errorhandler");             // Custom error class with statusCode
const sendToken = require("../utils/jwtToken");                    // Utility to generate JWT and send as cookie
const sendEmail = require("../utils/sendEmail");                    // Utility to send emails (used for password reset)

// =============================================
// CONTROLLER: registerUser
//   Handles POST /api/v1/register
//   Creates a new user account from req.body data.
//   1. Extracts name, email, password from the request body
//   2. Creates a new User document with a placeholder avatar
//   3. Calls sendToken() to generate a JWT and return it
//      as an HTTP-only cookie with a 201 (Created) status
// =============================================
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    const user = await User.create({
        name, email, password, avatar: { public_id: "this is a sample id", url: "profilepicUrl" },
    })

    sendToken(user, 201, res)
});

// =============================================
// CONTROLLER: loginUser
//   Handles POST /api/v1/login
//   Authenticates an existing user by email & password.
//   1. Validates that both email and password are provided
//   2. Finds the user by email (includes password field via .select("+password"))
//   3. Compares the entered password against the stored hash
//   4. If valid, calls sendToken() to generate a JWT
//
//   BUG: comparePassword() is called without `await` and
//   without passing the `password` argument — password
//   validation is effectively bypassed at runtime.
// =============================================
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email & Password", 400))
    }

    const user = await User.findOne({
        email
    }).select("+password")

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    const isPasswordMatch = user.comparePassword();

    if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }
    sendToken(user, 200, res)

});


// =============================================
// CONTROLLER: logout
//   Handles GET /api/v1/logout
//   Logs out the current user by clearing the
//   authentication cookie. Sets the "token" cookie
//   to null with an expiry of now (immediately expires).
//   Returns a success message on completion.
// =============================================
exports.logout = catchAsyncErrors(async (req,res,next) => {
    req.cookie("token" , null , {
        expires: new Date(Date.now()),
        httpOnly: true,
    })

    res.status(200).json({
        success: true,
        message: "Logged Out"
    })
})

// =============================================
// CONTROLLER: forgotPassword
//   Handles POST /api/v1/password/forgot
//   Sends a password reset email to the user.
//   1. Finds the user by email from req.body
//   2. Generates a reset token via user.getResetPasswordToken()
//      (this hashes the token and stores it in the DB)
//   3. Saves the user with validateBeforeSave: false to skip
//      other field validations (only token fields changed)
//   4. Builds a reset URL using the raw token:
//      /api/v1/password/reset/:token
//   5. Sends the URL in an email to the user
//   6. If email fails, clears the token fields and returns error
//
//   Flow: User requests reset -> gets email with link ->
//         clicks link -> hits resetPassword controller
// =============================================
exports.forgotPassword = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findOne({email:req.body.email});

    if(!user){
        return next( new ErrorHandler("User not found" ,404))
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false})

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password rest token is :- \n\n ${resetPasswordUrl} \n\n If you have not requested this then,please ignore it `

    try {
        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,
            message,
        })

        res.status(200).json({
            success: true,
            message: `Email sne to ${user.email} successfully`
        })
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({validateBeforeSave:false});

        return  next(new ErrorHandler(error.message, 500));
    }

})

exports.resetPassword = catchAsyncErrors(async(req,res,next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");


    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire : {$gt: Date.now()},

    })

    if(!user) {
        return next(new ErrorHandler("Reset Password Token is invalid or has been expired" , 400));

    }


    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password doesnot password" ,400 ))
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save();
    
    sendToken(user, 200 , res)
})
