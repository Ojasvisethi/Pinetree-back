const express = require("express");
const musicController = require("../controller/music");
const path = require("path");
const isAuth = require("../auth/is-Auth");

const router = express.Router();

router.use(isAuth);

router.post("/upload", musicController.upload);
router.post("/disable", musicController.disable);
router.post("/enable", musicController.enable);
router.post("/disableArt", musicController.disableArt);
router.post("/enableArt", musicController.enableArt);

router.get("/allMusic", musicController.allMusic);

router.get("/music/:name", musicController.getMusic);

router.get("/getSongs", musicController.getSongs);

router.get("/getGenreAndArtist", musicController.getGenreAndArtist);

router.post("/addGenOrArt", musicController.addGenreOrArtist);

module.exports = router;
