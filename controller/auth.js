const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateRandomPassword } = require("../s3bucket/s3functions");
const CryptoJS = require("crypto-js");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed, entered data is incorrect");
    error.statusCode = 422;
    error.data = errors.array();
    // console.log(errors);
    throw error;
  }
  const email = req.body.email;
  const canDownload = req.body.canDownload;
  const isAdmin = req.body.isAdmin;
  const registrationTerm = req.body.registrationTerm;

  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 409; // Conflict status code
      throw error;
    }
    // Generate username from the email (excluding the domain part)
    const username = email.split("@")[0];

    // Generate a random password for the user
    const generatedPassword = generateRandomPassword();

    // Encrypt the password using CryptoJS
    const secretKey = process.env.secretKey; // Replace with your own secret key
    const encryptedPw = CryptoJS.AES.encrypt(
      generatedPassword,
      secretKey
    ).toString();

    // Calculate the end date based on the registration term
    const registrationDate = new Date();
    const endDate = calculateEndDate(registrationDate, registrationTerm);

    // Convert the registrationTerm object to a string representation
    const registrationTermString = JSON.stringify(registrationTerm);

    // Create the new user object
    const user = new User({
      email: email,
      password: encryptedPw,
      isAdmin: isAdmin,
      canDownload: canDownload,
      registrationDate: registrationDate,
      registrationTerm: registrationTermString, // Save the string representation
      endDate: endDate,
    });

    const result = await user.save();

    // Respond with the generated username and password
    res.status(201).json({
      message: "User created",
      userId: result._id,
      username: username,
      password: generatedPassword,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// Helper function to generate a random password

// Helper function to calculate the end date based on the registration term
function calculateEndDate(registrationDate, term) {
  const endDate = new Date(registrationDate);

  if (term.year) {
    endDate.setFullYear(endDate.getFullYear() + parseInt(term.year));
  }

  if (term.month) {
    endDate.setMonth(endDate.getMonth() + parseInt(term.month));
  }

  if (term.day) {
    endDate.setDate(endDate.getDate() + parseInt(term.day));
  }

  // Set the time to midnight (00:00:00)
  endDate.setHours(0, 0, 0, 0);

  return endDate;
}

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("A user with this email could not be found");
      error.statusCode = 401;
      throw error;
    }

    const userEndDate = new Date(user.endDate);
    if (userEndDate < Date.now()) {
      // Check if the user's subscription has ended
      const error = new Error(
        "Your subscription has ended. Please renew your subscription."
      );
      error.statusCode = 401;
      throw error;
    }

    const secretKey = process.env.secretKey; // Replace this with your secret key for decryption
    const encryptedPasswordFromDatabase = user.password; // Replace this with the actual field name for the encrypted password in your database
    const decryptedPassword = CryptoJS.AES.decrypt(
      encryptedPasswordFromDatabase,
      secretKey
    ).toString(CryptoJS.enc.Utf8);

    if (decryptedPassword === password) {
      const token = jwt.sign(
        {
          email: user.email,
          userId: user._id.toString(),
        },
        process.env.secret,
        { expiresIn: "4d" }
      );
      res.status(200).json({
        token: token,
        User: user,
        isAdmin: user.isAdmin,
      });
    } else {
      const error = new Error("Password don't match");
      error.statusCode = 401;
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
