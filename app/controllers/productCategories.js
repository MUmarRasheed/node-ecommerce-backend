const Category = require("../models//productCategories"); // Import Category model
const { validationResult } = require("express-validator");
const {
  sendResponse,
  convertToObjectId,
  generateSlug,
} = require("../helpers/utalityFunctions");
const messages = require("../messages/customMessages");
const Product = require('../models/products');

// Create a new category
async function createCategory(req, res) {
  try {
    // Validate the incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    // Extract data from the request body
    const { name, image, icon } = req.body;
    let slug 
    // Generate slug from the name
    if(req.body.name){
      slug = generateSlug(name);
    }
    if (req.body.subcategories) {
      req.body.subcategories = req.body.subcategories.map(subcategory => ({
        ...subcategory,
        slug: generateSlug(subcategory.name) // Generate slug for each subcategory
      }));
    }
    // Create a new category instance
    const newCategory = new Category({
      name,
      slug,
      image,
      icon,
      subcategories:req.body.subcategories
    });

    // Save the category to the database
    const savedCategory = await newCategory.save();

    // Send success response with the saved category
    return res.status(201).send(sendResponse(2001, messages[2001], true, savedCategory));
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key error code
      return res.status(400).send(sendResponse(2016, messages[2016], false));
  }

    console.error("Error in creating category:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Get all categories
async function getCategories(req, res) {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    // Create pagination and sorting options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: parseInt(sortOrder) }
    };

    // Fetch paginated and sorted categories
    const categories = await Category.paginate({}, options);

    // Return success response with categories
    return res.status(200).send(sendResponse(2002, messages[2002], true, categories));
  } catch (error) {
    console.error("Error in fetching categories:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}



// Get a single category by ID
async function getCategoryById(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .send(sendResponse(1003, messages[1003], false, errors.errors));
  }
  try {
    // Find the category by ID
    const category = await Category.findOne({
      _id: convertToObjectId(req.params.id),
    });

    if (!category) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    // Return success response with category
    return res
      .status(200)
      .send(sendResponse(2002, messages[2002], true, category));
  } catch (error) {
    console.error("Error in fetching category:", error);
    return res
      .status(500)
      .send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Update a category
async function updateCategory(req, res) {
  try {
    // Validate the incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    // Find the category by ID
    const category = await Category.findOne({
      _id: convertToObjectId(req.params.id),
    });

    if (!category) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    // Check if the name is being updated to generate a new slug
    if (req.body.name) {
      req.body.slug = generateSlug(req.body.name); // Generate slug if name is present
    }

    // If subcategories are being updated, generate slugs for them
    if (req.body.subcategories) {
      req.body.subcategories = req.body.subcategories.map(subcategory => ({
        ...subcategory,
        slug: generateSlug(subcategory.name) // Generate slug for each subcategory
      }));
    }

    // Update category details using Object.assign()
    Object.assign(category, req.body);

    // Save the updated category
    const updatedCategory = await category.save();

    // Return success response with the updated category
    return res.status(200).send(sendResponse(2004, messages[2004], true, updatedCategory));
  } catch (error) {
    console.error("Error in updating category:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Delete a category
async function deleteCategory(req, res) {
  try {
      // Convert category ID to ObjectId
      const categoryId = convertToObjectId(req.params.id);

      // Find if the category exists
      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).send(sendResponse(2003, messages[2003], false));
      }

      // Check if there are products associated with this category
      const associatedProducts = await Product.find({ categoryId });

      // If there are products, check if 'forceDelete' flag is passed in the request
      if (associatedProducts.length > 0 && !req.body.forceDelete) {
          // Warn the user that the category has products and require confirmation
          return res.status(400).send(sendResponse(1059, messages[1059], false));
      }

      // If 'forceDelete' is present or no products are found, proceed to delete
      if (associatedProducts.length > 0 && req.body.forceDelete) {
          // Delete all products associated with the category
          await Product.deleteMany({ categoryId });
      }

      // Find and delete the category by ID
      const deletedCategory = await Category.findOneAndDelete({ _id: categoryId });
      if (!deletedCategory) {
          return res.status(404).send(sendResponse(2003, messages[2003], false));
      }

      // Return success response for deletion
      return res.status(200).send(sendResponse(2005, messages[2005], true));

  } catch (error) {
      console.error("Error in deleting category:", error);
      return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}


module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
