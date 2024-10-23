const jwt                  = require("jsonwebtoken");
const config               = require("config");
var auth                   = require("basic-auth");
const Users                = require("../models/users");
const { sendResponse }     = require("../helpers/utalityFunctions");
const messages             = require("../messages/customMessages");

async function authCheck(req, res, next) {
  const { authorization } = req.headers;
  console.log("authorization", authorization);
  const error = false;
  if (!authorization || !authorization.startsWith("Bearer ")){
    return res.status(498).send(sendResponse(1035, messages[1035], false, error));
  }
  const token = authorization.split(" ")[1];
  console.log("🚀 ~ authCheck ~ token:", token)

  try {
    const decode = await jwt.verify(token, config.secretKey);
    console.log("Decoded", decode);
    const user = await Users.findOne(
      { _id: decode.id },
      { name: 1, email: 1, role: 1, active: 1, isBlocked : 1 }
    );
    console.log("🚀 ~ authCheck ~ user:", user)
    if (!user) {
      return res.status(400).send(sendResponse(1005, messages[1005], false, false));
    }
    if (user.isBlocked) {
      return res.status(400).send(sendResponse(1122, messages[1122], false, false));
    }
    req.loginUser = user;
    next();
  } catch (error) {
    console.log("🚀 ~ authCheck ~ error:", error)
    if (error.name === 'TokenExpiredError') {
      return res.status(400).send(sendResponse(1113, messages[1113], false));
    }
      // Handle malformed token
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).send(sendResponse(1001, "Invalid token provided", false));
    }
    console.error(error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error));
  }
}

module.exports = authCheck;
