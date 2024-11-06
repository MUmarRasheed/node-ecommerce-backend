const { body, param } = require("express-validator");
const { isValidObjectId } = require("../helpers/utalityFunctions");

module.exports = function stockValidator(api) {
  switch (api) {
    case "addStock":
      return [
        param("productId", "Invalid Product ID")
          .exists()
          .custom(isValidObjectId)
          .withMessage("Product ID must be a valid ID"),
        body("title")
          .optional({ checkFalsy: true })
          .isString()
          .withMessage("Title must be a string if provided"),
        body("price")
          .optional()
          .isNumeric()
          .withMessage("Price must be a number"),
        body("salePrice")
          .optional()
          .isNumeric()
          .withMessage("Sale Price must be a number"),
        body("quantity")
          .exists()
          .isInt({ min: 0 })
          .withMessage("Quantity must be a non-negative integer"),
        body("unit").optional().notEmpty().withMessage("unit must not be empty"),
        body("sku")
          .optional()
          .notEmpty()
          .withMessage("SKU is required"),
        body("options")
          .optional()
          .isArray()
          .withMessage("Options must be an array"),
        body("unit", "Unit is required").exists().notEmpty().withMessage("unit must not be empty"),
      ];

    case "updateStock":
      return [
        param("id", "Invalid Stock ID")
          .exists()
          .isMongoId()
          .withMessage("Stock ID must be a valid MongoDB ID"),
        body("title")
          .optional()
          .notEmpty()
          .withMessage("Title cannot be empty"),
        body("price")
          .optional()
          .isNumeric()
          .withMessage("Price must be a number"),
        body("salePrice")
          .optional()
          .isNumeric()
          .withMessage("Sale Price must be a number"),
        body("quantity")
          .optional()
          .isInt({ min: 0 })
          .withMessage("Quantity must be a non-negative integer"),
        body("unit").optional().notEmpty().withMessage("unit must not be empty"),
        body("sku")
          .optional()
          .notEmpty()
          .withMessage("SKU cannot be empty"),
        body("options")
          .optional()
          .isArray()
          .withMessage("Options must be an array"),
      ];

    case "getStockById":
      return [
        param("id", "Invalid Stock ID")
          .exists()
          .isMongoId()
          .withMessage("Stock ID must be a valid MongoDB ID"),
      ];

    case "deleteStock":
      return [
        param("id", "Invalid Stock ID")
          .exists()
          .isMongoId()
          .withMessage("Stock ID must be a valid MongoDB ID"),
      ];

    default:
      return [];
  }
};
