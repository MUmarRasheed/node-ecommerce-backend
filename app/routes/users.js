const express                             = require("express");
const loginRouter                         = express.Router();
const router                              = express.Router();

/*  IMPORT Validators */
const userValidator                       = require("../validators/users");


/*  IMPORT CONTROLLERS */
const Users                               = require("../controllers/users");


//OPEN ROUTES
router.post("/register-user", userValidator("register"), Users.registerUser);

router.get("/verify-email", Users.verifyEmail);

router.post("/login", userValidator("login"), Users.login);


router.post(
  "/forgot-password",
  userValidator("forgotPassword"),
  Users.forgotPassword
);


router.put(
  "/update-password",
  userValidator("updatePassword"),
  Users.updatePassword
);

/*AUTH ROUTES */
loginRouter.get("/get-user", Users.getUser);

loginRouter.post("/logout", Users.logout);

loginRouter.delete("/delete-account", Users.deleteAccount);

loginRouter.put(
  "/update-profile",
  userValidator("updateProfile"),
  Users.updateProfile
);


router.get(
  "/get-user-detail",
  userValidator("getUserDetails"),
  Users.getUserDetail
);


router.post(
  "/forgot-password",
  userValidator("forgotPassword"),
  Users.forgotPassword
);

loginRouter.put("/change-password", userValidator("changePassword"), Users.changePassword);

loginRouter.get(
  "/get-all-users",
  userValidator("getAllUsers"),
  Users.getAllUsers
);


module.exports = { loginRouter, router };
