// your-validator-module.js
const { body, query } = require("express-validator");

module.exports = function walletValidator(api) {
  switch (api) {
    case "addCard":
      return [
        body("cardDetails", "cardDetails is required")
          .exists()
          .notEmpty()
          .withMessage("cardDetails must not be empty")
          .isObject()
          .withMessage("cardDetails must be an object"),
        // Add more validations for cardDetails if needed
      ];
  }
};
