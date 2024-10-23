const express           = require("express");
const loginRouter       = express.Router();
const router            = express.Router();

/*  IMPORT Validators */

const socialLoginValidator = require("../validators/socialLogin");

/*  IMPORT CONTROLLERS */

const SocialLogins = require("../controllers/socialLogin");

router.post(
  "/login-with-google",
  socialLoginValidator("googleLogin"),
  SocialLogins.loginWithGoogle
);

module.exports = { loginRouter, router };
