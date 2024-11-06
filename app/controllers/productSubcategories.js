const Category = require("../models/productCategories"); // Assuming Subcategory is embedded in Category
const { validationResult } = require("express-validator");
const {
  sendResponse,
  convertToObjectId,
  generateSlug,
} = require("../helpers/utalityFunctions");

const messages = require("../messages/customMessages");
const Product = require("../models/products");

// Add Subcategory
async function addSubcategory(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
   return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const category = await Category.findOne({
      _id: convertToObjectId(req.params.categoryId),
    });
    if (!category) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    // Generate slug for the subcategory
    const subcategoryWithSlug = {
      ...req.body,
      slug: generateSlug(req.body.name), // Generate slug based on the name provided
    };

    category.subcategories.push(subcategoryWithSlug); // Push the subcategory with the slug
    const updatedCategory = await category.save();

    return res
      .status(200).send(sendResponse(2006, messages[2006], true, updatedCategory));
  } catch (error) {
    console.error("Error in adding subcategory:", error);
    return res
      .status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Remove Subcategory
async function removeSubcategory(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
    // Find the category by ID
    const category = await Category.findOne({
      _id: convertToObjectId(req.params.categoryId),
    });

    if (!category) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    // Check if the subcategory exists in the category
    const subcategoryExists = category.subcategories.some(
      (subcategory) => subcategory._id.toString() === req.params.subcategoryId
    );

    if (!subcategoryExists) {
      return res.status(404).send(sendResponse(2009, messages[2009], false)); // Subcategory not found
    }

    // Check if any products exist under this subcategory
    const productsWithSubcategory = await Product.find({ subcategoryId: req.params.subcategoryId });

    if (productsWithSubcategory.length > 0) {
      if (!req.body.forceDelete) {
        // Inform the user that there are products under this subcategory and ask for confirmation
        return res.status(400).send(
          sendResponse(1167, messages[1167], false, { productsCount: productsWithSubcategory.length })
        );
      } else {
        // If forceDelete is true, delete all products with this subcategoryId
        await Product.deleteMany({ subcategoryId: req.params.subcategoryId });
      }
    }

    // Remove the subcategory from the category
    category.subcategories = category.subcategories.filter(
      (subcategory) => subcategory._id.toString() !== req.params.subcategoryId
    );

    // Save the updated category
    await category.save();

    // Return success response
    return res.status(200).send(sendResponse(2007, messages[2007], true, true));

  } catch (error) {
    console.error("Error in removing subcategory:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}


// Get Subcategories of a Category
async function getSubcategories(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
 return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }
  try {
    const category = await Category.findOne({
      _id: convertToObjectId(req.params.categoryId),
    });
    if (!category) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    return res
      .status(200)
      .send(sendResponse(2008, messages[2008], true, category.subcategories));
  } catch (error) {
    console.error("Error in fetching subcategories:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Update Subcategory
async function updateSubcategory(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const category = await Category.findOne({
      _id: convertToObjectId(req.params.categoryId),
    });
    if (!category) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    const subcategoryIndex = category.subcategories.findIndex(
      (subcategory) => subcategory._id.toString() === req.params.subcategoryId
    );

    if (subcategoryIndex === -1) {
      return res.status(404).send(sendResponse(2003, messages[2003], false));
    }

    // Update the subcategory's details
    Object.assign(category.subcategories[subcategoryIndex], req.body);

    // Generate a new slug if the name is updated
    if (req.body.name) {
      category.subcategories[subcategoryIndex].slug = generateSlug(
        req.body.name
      );
    }

    const updatedCategory = await category.save();

    return res.status(200).send(sendResponse(2006, messages[2006], true, updatedCategory));
  } catch (error) {
    console.error("Error in updating subcategory:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

module.exports = {
  addSubcategory,
  removeSubcategory,
  getSubcategories,
  updateSubcategory,
};
