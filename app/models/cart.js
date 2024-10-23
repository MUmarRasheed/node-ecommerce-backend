const mongoose = require('mongoose');
const { paginate } = require("../helpers/utalityFunctions");

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
  stockId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Stock' },
  price: { type: Number, required: true },  // Ensure price is required
  quantity: { type: Number, required: true, min: 1 },  // Minimum quantity of 1
});

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: [CartItemSchema], required: true },  // Array of cart items
  createdAt: { type: Number, default: Date.now },  // Default to current time
});

// Plugin for pagination
CartSchema.plugin(paginate);

// Export the Cart model
module.exports = mongoose.model('Cart', CartSchema);
