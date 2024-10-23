const express = require('express');
const {
  addSubcategory,
  removeSubcategory,
  getSubcategories,
  updateSubcategory,
} = require('../controllers/productSubcategories');
const subcategoryValidator = require('../validators/productSubCategories'); // Import the validator

const loginRouter = express.Router();

loginRouter.post(
  '/add-subcategory/:categoryId',
  subcategoryValidator("addSubcategory"), // Validation for adding a subcategory
  addSubcategory
); // Add Subcategory to Category

loginRouter.get(
  '/get-subcategories/:categoryId',
  subcategoryValidator("getSubcategories"), // Validation for getting subcategories
  getSubcategories
); // Get All Subcategories of a Category

loginRouter.delete(
  '/remove-subcategory/:categoryId/:subcategoryId',
  subcategoryValidator("removeSubcategory"), // Validation for removing a subcategory
  removeSubcategory
); // Remove Subcategory from Category

loginRouter.put(
  '/update-subcategory/:categoryId/:subcategoryId',
  subcategoryValidator("updateSubcategory"), // Validation for updating a subcategory
  updateSubcategory
); // Update Subcategory

module.exports = { loginRouter };
