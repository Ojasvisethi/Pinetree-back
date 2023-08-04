const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const musicrouter = require("./routes/musicfile");
const authrouter = require("./routes/auth");
const userrouter = require("./routes/user");
const reqrouter = require("./routes/request");
const bodyParser = require("body-parser");
require("dotenv").config();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use("/user", userrouter);
app.use("/music", musicrouter);
app.use("/auth", authrouter);
app.use("/request", reqrouter);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(process.env.MONGO_DB_URL)
  .then((result) => {
    app.listen(3000 || 8093, () => {
      console.log("connected");
    });
  })
  .catch((err) => {
    console.log(err);
  });
