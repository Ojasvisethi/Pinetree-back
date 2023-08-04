const express = require("express");

const { body } = require("express-validator");

const authController = require("../controller/auth");

const router = express.Router();

router.put("/signup", authController.signup);

router.post("/login", authController.login);

module.exports = router;
