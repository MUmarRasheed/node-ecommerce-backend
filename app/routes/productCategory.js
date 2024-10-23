const express = require('express');
const loginRouter = express.Router();
const categoryController = require('../controllers/productCategories');
const categoryValidator = require('../validators/productCategory'); // Import the validator

// Category CRUD
loginRouter.post(
  '/add-category',
  categoryValidator("createCategory"), // Validation for creating a category
  categoryController.createCategory
);

loginRouter.get(
  '/get-categories',
  categoryController.getCategories // No validation needed for this route
);

loginRouter.get(
  '/get-category-by-id/:id',
  categoryValidator("getCategoryById"), // Validation for getting a category by ID
  categoryController.getCategoryById
);

loginRouter.put(
  '/update-category/:id',
  categoryValidator("updateCategory"), // Validation for updating a category
  categoryController.updateCategory
);

loginRouter.delete(
  '/delete-category/:id',
  categoryValidator("deleteCategory"), // Validation for deleting a category
  categoryController.deleteCategory
);

module.exports = { loginRouter } ;
