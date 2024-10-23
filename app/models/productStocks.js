const mongoose = require('mongoose');
const { paginate } = require("../helpers/utalityFunctions");

// Stock Schema
const StockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, 
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }, // Add shopId reference
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }, // Add userId reference for ownership
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: false },
  salePrice: { type: Number },
  unit: { type: String },
  sku: { type: String, required: true },
  isDisable: { type: Boolean },
  options: [{
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  createdAt: { type: Number },
  updatedAt: { type: Number }
});
StockSchema.pre("save", function (next) {
  this.createdAt = new Date().getTime();
  next();
});

StockSchema.index({ productId: 1 }); // Index for faster lookup with Product collection
StockSchema.index({ sku: 1 }); // SKU is unique, and frequently searched, so it's good to index this field

StockSchema.plugin(paginate);

// Create the Stock model
const Stock = mongoose.model('Stock', StockSchema);

module.exports = Stock;
