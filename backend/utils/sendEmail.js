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

/**
 * nodeMailer - Email sending library for Node.js.
 * Supports various transports (SMTP, SendGrid, etc.)
 * We use SMTP transport configured via environment variables.
 */
const nodeMailer = require("nodemailer");

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
//     1. Creates a Nodemailer transport using SMTP credentials
//        from environment variables (SMPT_HOST, SMPT_PORT, etc.)
//     2. Constructs mail options with from, to, subject, and text
//     3. Calls transporter.sendMail() to send the email
//     4. Throws on failure — caller should use try/catch
//
//   Usage:
//     await sendEmail({
//       email: user.email,
//       subject: "Password Reset",
//       message: "Click this link to reset your password..."
//     })
// =============================================
const sendEmail = async (options) => {
  // -------------------------------------------
  // CREATE: SMTP Transport
  //   Configures the email transport using
  //   environment variables for SMTP credentials.
  //   This allows switching email providers
  //   without changing code.
  // -------------------------------------------
  const transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    auth: {
      user: process.env.SMPT_EMAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  // -------------------------------------------
  // BUILD: Mail Options
  //   Constructs the email content with:
  //     - from:    Sender's email (from env vars)
  //     - to:      Recipient's email (from options)
  //     - subject: Email subject line
  //     - text:    Plain-text email body
  // -------------------------------------------
  const mailOptions = {
    from: process.env.SMPT_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // -------------------------------------------
  // SEND: Email via SMTP
  //   Calls transporter.sendMail() to send the
  //   email through the configured SMTP server.
  //   Throws on failure — caller should catch.
  // -------------------------------------------
  await transporter.sendMail(mailOptions);
};

// =============================================
// EXPORT: sendEmail function
//   Used in userController.js for the
//   forgotPassword controller.
// =============================================
module.exports = sendEmail;
