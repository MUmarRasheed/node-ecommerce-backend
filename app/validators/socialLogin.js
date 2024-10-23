const { body } = require("express-validator");

module.exports = function socialLoginValidator(api) {
  switch (api) {
    case "googleLogin":
      return [
        body("id_token", "id_token is Required")
          .exists()
          .isString()
          .withMessage("id_token should be in String")
          .notEmpty()
          .withMessage("id_token should not be empty"),
        // body("role", "role is Required")
        //   .exists()
        //   .isInt()
        //   .withMessage("role must be number")
        //   .notEmpty()
        //   .withMessage("role should not be empty")
        ];
  }
};
