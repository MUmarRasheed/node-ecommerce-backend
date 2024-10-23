const { body, query } = require("express-validator");
const { isValidObjectId } = require("../helpers/utalityFunctions");

module.exports = function userValidator(api) {
  switch (api) {
    case "register":
      return [
        body("email", "email is Required")
          .exists()
          .isEmail()
          .withMessage("email should be in email format")
          .notEmpty()
          .withMessage("email should not be empty")
          .customSanitizer((value) => value.toLowerCase()),

        body("password", "password is Required")
          .exists()
          .isString()
          .withMessage("password should be string")
          .isLength({ min: 8 })
          .withMessage("password should 8 characters long")
          .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/)
          .withMessage(
            "Please enter a password at least 8 character and contain At least one uppercase.At least one lower case.At least one special character."
          )
          .notEmpty()
          .withMessage("email should not be empty"),

        body("role", "role is Required")
          .exists()
          .isInt()
          .withMessage("role must be integer")
          .notEmpty()
          .withMessage("role should not be empty"),

        body("name", "name is Required")
          .exists()
          .isString()
          .withMessage("name must be a string")
          .notEmpty()
          .withMessage("name should not be empty"),
      ];

    case "login":
      return [
        body("email", "email is Required")
          .exists()
          .isEmail()
          .withMessage("email should be in email format")
          .notEmpty()
          .withMessage("email should not be empty"),

        body("password", "password is Required")
          .exists()
          .isString()
          .withMessage("password should be string")
          .isLength({ min: 8 })
          .withMessage("password should 8 characters long")
          .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/)
          .withMessage(
            "Please enter a password at least 8 character and contain At least one uppercase.At least one lower case.At least one special character."
          )
          .notEmpty()
          .withMessage("password should not be empty"),
      ];

    case "forgotPassword":
      return [
        body("email", "email is Required")
          .exists()
          .isEmail()
          .withMessage("email should be in email format")
          .notEmpty()
          .withMessage("email should not be empty"),
      ];

    case "updatePassword":
      return [
        body("token", "token is Required")
          .exists()
          .isString()
          .withMessage("token should be in String")
          .notEmpty()
          .withMessage("token should not be empty"),

        body("password", "password is Required")
          .exists()
          .isString()
          .withMessage("password should be string")
          .isLength({ min: 8 })
          .withMessage("password should 8 characters long")
          .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$.!%*#?&]/)
          .withMessage(
            "Please enter a password at least 8 character and contain At least one uppercase.At least one lower case.At least one special character."
          )
          .notEmpty()
          .withMessage("password should not be empty"),
      ];

    case "updateProfile":
      return [
        body("id", "id is Required")
          .exists()
          .isString()
          .withMessage("id should be in String")
          .notEmpty()
          .withMessage("id should not be empty")
          .custom(isValidObjectId)
          .withMessage("id is not a valid ObjectId"),

        body("name", "name is Required")
          .optional()
          .isString()
          .withMessage("name should be a String")
          .notEmpty()
          .withMessage("name should not be empty"),
  
        body("about", "about is Required")
          .optional()
          .isString()
          .withMessage("about should be a String")
          .notEmpty()
          .withMessage("about should not be empty"),

        body("profileImage", "profileImage is Required")
          .optional()
          .isString()
          .withMessage("profileImage should be a String")
          .notEmpty()
          .withMessage("profileImage should not be empty"),

        body("city", "city is Required")
          .optional()
          .isString()
          .withMessage("city should be a String")
          .notEmpty()
          .withMessage("city should not be empty")
      ];

    case "getUserDetails":
      return [
        query("id", "id is Required")
          .exists()
          .isString()
          .withMessage("id should be in String")
          .custom(isValidObjectId)
          .withMessage("id is not a valid ObjectId")
          .notEmpty()
          .withMessage("id should not be empty"),
      ];

    case "getAllUsers":
      return [
        query("name", "name is Required")
          .optional()
          .isString()
          .withMessage("name should be in String")
          .notEmpty()
          .withMessage("name should not be empty"),
        query("page", "page is Required")
          .optional()
          .isInt()
          .withMessage("page should be integer")
          .notEmpty()
          .withMessage("page should not be empty"),
        query("limit", "limit is Required")
          .optional()
          .isInt()
          .withMessage("limit should be integer")
          .notEmpty()
          .withMessage("limit should not be empty"),
      ];

    case "updateUserStatus":
      return [
        query("status", "status is Required")
          .optional()
          .isString()
          .withMessage("status should be in String")
          .notEmpty()
          .withMessage("status should not be empty"),
        body("id", "id is Required")
          .exists()
          .isString()
          .withMessage("id should be in String")
          .notEmpty()
          .withMessage("id should not be empty")
          .custom(isValidObjectId)
          .withMessage("id is not a valid ObjectId"),
      ];
      case "deleteUserAccount":
      return [
        body("_id", "_id is Required")
          .exists()
          .isString()
          .withMessage("_id should be in String")
          .notEmpty()
          .withMessage("_id should not be empty")
          .custom(isValidObjectId)
          .withMessage("_id is not a valid ObjectId"),
      ];
  }
};
