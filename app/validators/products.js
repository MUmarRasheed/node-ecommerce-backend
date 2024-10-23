const { body, param } = require("express-validator");

module.exports = function productValidator(api) {
  switch (api) {
    case "addProduct":
      return [
        body("name", "Product name is required").exists().notEmpty().withMessage("name must not be empty"),
        body("description", "Description is required").exists().notEmpty().withMessage("description must not be empty"),
        body("image", "Image is required").exists().notEmpty().withMessage("image must not be empty"), // If you have an image field
        body("tag").optional().isArray().withMessage("tag must be an array") // Optional tags
      ];

    case "updateProduct":
      return [
        param("id", "Product ID is required").exists().isMongoId().withMessage("Invalid product ID format"),
        body("name").optional().notEmpty().withMessage("name must not be empty"),
        body("description").optional().notEmpty().withMessage("description must not be empty"),
        body("image").optional().notEmpty().withMessage("image must not be empty"),
        body("tag").optional().isArray().withMessage("tag must be an array") // Optional tags
      ];
      
    default:
      return [];
  }
};
