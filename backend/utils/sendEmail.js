/*
=============================================
  FILE: sendEmail.js
  PURPOSE: Utility for sending emails via Nodemailer
  DESCRIPTION:
    Provides a reusable sendEmail() function that
    sends plain-text emails using a SMTP transport
    configured through environment variables.

    Currently used for:
      - Password reset emails (forgotPassword flow)

    SMTP Configuration (from config.env):
      - SMPT_HOST:     SMTP server hostname
      - SMPT_PORT:     SMTP server port
      - SMPT_SERVICE:  Email service (e.g. "gmail")
      - SMPT_EMAIL:    Sender email address
      - SMPT_PASSWORD: Sender email password/app-password

    NOTE: "SMPT" is a typo of "SMTP" — consistent
    throughout the codebase but should be corrected
    for accuracy in production.
=============================================
*/

// =============================================
// IMPORTS
// =============================================
const nodeMailer = require("nodemailer")

// =============================================
// FUNCTION: sendEmail
//   Sends a plain-text email to the specified recipient.
//
//   @param {Object} options
//     - email:   Recipient's email address
//     - subject: Email subject line
//     - message: Plain-text email body
//
//   Flow:
//     1. Creates a Nodemailer transport using SMTP env vars
//     2. Constructs mail options (from, to, subject, text)
//     3. Awaits transporter.sendMail() to send the email
//
//   Usage:
//     await sendEmail({
//       email: user.email,
//       subject: "Password Reset",
//       message: "Click this link to reset your password..."
//     })
// =============================================
const sendEmail = async(options) => {

    // Create the SMTP transport with credentials from environment
    const transporter = nodeMailer.createTransport({
        host:process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth: {
            user:process.env.SMPT_EMAIL,
            pass:process.env.SMPT_PASSWORD
        }
    })

    // Build the email content
    const mailOptions = {
        from: process.env.SMPT_EMAIL,
        to:options.email,
        subject:options.subjects,
        text:options.message
    }

    // Send the email (throws on failure — caller should catch)
    await transporter.sendMail(mailOptions);
}

// =============================================
// EXPORT: sendEmail function for use in controllers
// =============================================
module.exports = sendEmail;
