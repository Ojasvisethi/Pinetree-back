const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateRandomPassword } = require("../s3bucket/s3functions");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

exports.getUsers = async (req, res, next) => {
  const search = req.query.search;
  try {
    let query = {}; // Initialize an empty query object

    // If search parameter is provided, use it to filter the results
    if (search) {
      // Case-insensitive search for users whose username or email matches the search string
      query = {
        $or: [
          { username: { $regex: new RegExp(search, "i") } },
          { email: { $regex: new RegExp(search, "i") } },
        ],
      };
    }

    // Fetch users from the database based on the query and limit to 5 results
    const users = await User.find(query).limit(4);
    const secretKey = process.env.secretKey; // Replace with your own secret key
    // console.log(users);
    users.forEach((user) => {
      const decryptedBytes = CryptoJS.AES.decrypt(user.password, secretKey);
      const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);
      user.password = decryptedPassword;
    });
    // console.log(users);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUser = async (req, res, next) => {
  const token = req.query.token;
  try {
    decodetoken = jwt.verify(token, process.env.secret);
    const user = await User.findById(decodetoken.userId);
    const userEndDate = new Date(user.endDate);
    if (userEndDate < Date.now()) {
      // Check if the user's subscription has ended
      const error = new Error(
        "Your subscription has ended. Please renew your subscription."
      );
      error.statusCode = 401;
      throw error;
    }
    // console.log(user);
    res.status(200).json({ user: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateUser = async (req, res, next) => {
  const updatedUserData = req.body;
  const userId = req.params.userId;
  console.log(updatedUserData);
  try {
    let updateFields = {};

    // Update email, isAdmin, canDownload fields
    updateFields.email = updatedUserData.email;
    updateFields.isAdmin = updatedUserData.isAdmin;
    updateFields.canDownload = updatedUserData.canDownload;
    const secretKey = process.env.secretKey;
    const encryptedPw = CryptoJS.AES.encrypt(
      updatedUserData.password,
      secretKey
    ).toString();
    updateFields.password = encryptedPw;

    // Check if registrationTerm is provided and update registrationTerm and endDate fields
    if (updatedUserData.registrationTerm !== "null") {
      const registrationTerm = JSON.parse(updatedUserData.registrationTerm);
      const { day, month, year } = registrationTerm;

      const endDate = new Date();
      if (year) endDate.setFullYear(endDate.getFullYear() + year);
      if (month) endDate.setMonth(endDate.getMonth() + month);
      if (day) endDate.setDate(endDate.getDate() + day);

      updateFields.registrationTerm = updatedUserData.registrationTerm;
      updateFields.endDate = endDate.toISOString();
      updateFields.registrationDate = new Date().toISOString();
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
