const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  let decodetoken;
  try {
    decodetoken = jwt.verify(token, process.env.secret);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  if (!decodetoken) {
    const error = new Error("Not authenticated.");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodetoken.userId;
  next();
};
