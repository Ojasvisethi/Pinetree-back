const express = require("express");
const userController = require("../controller/user");

const router = express.Router();

// router.put("/updateUser/:userId", userController.changeUser);

router.get("/getUsers", userController.getUsers);
router.get("/getUser", userController.getUser);

router.patch("/updateUser/:userId", userController.updateUser);

module.exports = router;
