const mongoose = require('mongoose');
const { paginate } = require("../helpers/utalityFunctions");

// Subcategory Schema for the subcategories
const SubcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  icon : { type: String }
});

// Image Schema for category images
const ImageSchema = new mongoose.Schema({
  thumbnail: { type: String, required: true },
  original: { type: String, required: true }
});

// Main Product Category Schema
const ProductCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true },
  image: { type: ImageSchema, required: true },
  icon: { type: String, required: true },
  subcategories: { type: [SubcategorySchema], default: [] },
  createdAt: { type: Number },
  updatedAt: { type: Number }
});

ProductCategorySchema.pre("save", function (next) {
  this.createdAt = new Date().getTime();
  next();
});
ProductCategorySchema.plugin(paginate);

// Export the model
module.exports = mongoose.model('ProductCategory', ProductCategorySchema);
