const express = require("express");
const requestController = require("../controller/request");

const router = express.Router();

router.put("/send", requestController.send);
router.get("/getReq", requestController.getRequest);

module.exports = router;
