const { body, param } = require("express-validator");

module.exports = function wishlistValidator(api) {
  switch (api) {
    case "addToWishlist":
      return [
        param("userId", "User ID is required").exists().notEmpty(),
        body("productId", "Product ID is required")
          .exists()
          .notEmpty()
          .withMessage("Product ID must not be empty")
          .isString()
          .withMessage("Product ID must be a string"),
      ];

    case "removeFromWishlist":
      return [
        param("userId", "User ID is required").exists().notEmpty(),
        body("productId", "Product ID is required")
          .exists()
          .notEmpty()
          .withMessage("Product ID must not be empty")
          .isString()
          .withMessage("Product ID must be a string"),
      ];

    case "getUserWishlist":
      return [
        param("userId", "User ID is required").exists().notEmpty(),
      ];

    case "clearWishlist":
      return [
        param("userId", "User ID is required").exists().notEmpty(),
      ];

    default:
      return [];
  }
};
