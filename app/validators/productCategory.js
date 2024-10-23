const { body, param } = require("express-validator");

module.exports = function categoryValidator(api) {
  switch (api) {
    case "createCategory":
      return [
        body("name", "Name is required")
          .exists()
          .notEmpty()
          .withMessage("Name must not be empty"),
        body("image", "Image URL is required")
          .exists()
          .notEmpty()
          .withMessage("Image URL must not be empty"),
        body("icon", "Icon URL is required")
          .exists()
          .notEmpty()
          .withMessage("Icon URL must not be empty"),
        body("subcategories")
          .optional()
          .isArray()
          .withMessage("Subcategories must be an array"),
      ];
      
    case "updateCategory":
      return [
        param("id", "Category ID is required").exists(),
        body("name").optional().notEmpty().withMessage("Name must not be empty"),
        body("image").optional().notEmpty().withMessage("Image URL must not be empty"),
        body("icon").optional().notEmpty().withMessage("Icon URL must not be empty"),
        body("subcategories")
          .optional()
          .isArray()
          .withMessage("Subcategories must be an array"),
      ];
      
    case "getCategoryById":
      return [
        param("id", "Category ID is required").exists().isMongoId().withMessage("Invalid category ID format"),
      ];

    case "deleteCategory":
      return [
        param("id", "Category ID is required").exists().isMongoId().withMessage("Invalid category ID format"),
      ];

    case "getCategories":
      return []; // No validation needed

    // Add similar validations for other functions if needed

    default:
      return [];
  }
};
