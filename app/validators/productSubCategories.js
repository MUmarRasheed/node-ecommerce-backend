const { body, param } = require("express-validator");

module.exports = function subcategoryValidator(api) {
  switch (api) {
    case "addSubcategory":
      return [
        param("categoryId", "categoryId is required").exists().isMongoId().withMessage("Invalid categoryId format"),
        body("name", "name is required").exists().notEmpty().withMessage("name must not be empty"),
        body("icon", "icon is required").exists().notEmpty().withMessage("icon must not be empty"), // If you have an icon field
        // Add any additional fields that are required for subcategories
      ];
      
    case "removeSubcategory":
      return [
        param("categoryId", "categoryId is required").exists().isMongoId().withMessage("Invalid categoryId format"),
        param("subcategoryId", "subcategoryId is required").exists().isMongoId().withMessage("Invalid subcategoryId format"),
      ];

    case "getSubcategories":
      return [
        param("categoryId", "categoryId is required").exists().isMongoId().withMessage("Invalid categoryId format"),
      ];

    case "updateSubcategory":
      return [
        param("categoryId", "categoryId is required").exists().isMongoId().withMessage("Invalid categoryId format"),
        param("subcategoryId", "subcategoryId is required").exists().isMongoId().withMessage("Invalid subcategoryId format"),
        body("name").optional().notEmpty().withMessage("name must not be empty"), // Optional if you are updating
        body("image").optional().notEmpty().withMessage("image must not be empty"), // Optional if you are updating
        body("icon").optional().notEmpty().withMessage("icon must not be empty"), // Optional if you are updating
        // Add any additional fields that can be updated
      ];
  }
};
