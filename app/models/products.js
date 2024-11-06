const mongoose = require("mongoose");
const { paginate } = require("../helpers/utalityFunctions");

// Image Schema for product image and gallery
const ImageSchema = new mongoose.Schema({
  thumbnail: { type: String, required: true },
  original: { type: String, required: true },
});

// Tag Schema for product tags
const TagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
});

// Define the Product schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: { type: String }, // e.g., 'physical', 'digital'
    description: { type: String },
    image: [ImageSchema], // Use ImageSchema for the image field
    productImages: [ImageSchema], // Reuse ImageSchema for product images
    tag: [TagSchema],
    stockIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stock" }], // Add stockIds field
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory", // Reference to ProductCategory model
      required: false,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: false, // Optional
    },
    unit: { type: String },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    ordersCount: { type : Number, default: 0 },
    createdAt: { type: Number },
    updatedAt: { type: Number },
  },
); // Automatically include createdAt and updatedAt timestamps

productSchema.pre("save", function (next) {
  this.createdAt = new Date().getTime();
  next();
});
// Indexes for improving query performance
productSchema.index({ categoryId: 1 });
productSchema.index({ subcategoryId: 1 });
productSchema.index({ shopId: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ stockIds: 1 });  // Index for faster $lookup with Stock collection
productSchema.index({ createdAt: -1 }); // Index for faster sorting by createdAt

productSchema.plugin(paginate);

// Create the Product model
const Product = mongoose.model("Product", productSchema);
// Export the Product model
module.exports = Product;
