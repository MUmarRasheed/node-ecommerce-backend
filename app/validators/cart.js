const { body, param } = require("express-validator");

module.exports = function cartValidator(api) {
  switch (api) {
    case "addToCart":
      return [
        body("products", "products is required")
          .exists()
          .withMessage("products must be provided")
          .notEmpty()
          .withMessage("products must not be empty")
          .isArray()
          .withMessage("products must be an array")
          .custom((products) => {
            // Validate each product in the array
            products.forEach((product) => {
              if (!product.productId) {
                throw new Error("Each product must have a valid productId");
              }
    
              // Check if quantity is present and greater than 0
              if (typeof product.quantity === 'undefined' || product.quantity <= 0) {
                throw new Error("Each product must have a valid quantity greater than 0");
              }
    
              if (!product.stockId) {
                throw new Error("Each product must have a valid stockId");
              }
            });
            return true;
          }),
      ];
    
    case "updateCartItem":
      return [
        param("id", "Invalid cart item ID")
          .exists()
          .isMongoId()
          .withMessage("cart item ID must be a valid MongoDB ObjectId"),
        body("quantity")
          .optional()
          .isInt({ gt: 0 })
          .withMessage("quantity must be a positive integer"),
        body("stockId")
          .optional()
          .isMongoId()
          .withMessage("stockId must be a valid MongoDB ObjectId"),
      ];

      case "deleteCartItem":
        return [
          // Validate that 'products' is present and is an array
          body('products', 'Products array is required and must not be empty')
            .exists()
            .withMessage('Products field is missing')
            .isArray({ min: 1 })
            .withMessage('Products must be an array with at least one item'),
  
          // Validate that each product in the array has a valid MongoDB ObjectId for 'productId' and 'stockId'
          body('products.*.productId', 'Product ID is required and must be a valid MongoDB ObjectId')
            .exists()
            .isMongoId()
            .withMessage('Product ID must be a valid MongoDB ObjectId'),
            
          body('products.*.stockId', 'Stock ID is required and must be a valid MongoDB ObjectId')
            .optional()
            .isMongoId()
            .withMessage('Stock ID must be a valid MongoDB ObjectId'),
        ];
  
    default:
       return [];
  }
};
