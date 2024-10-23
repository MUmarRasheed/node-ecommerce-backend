const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true, // Ensure unique order numbers
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  subTotal: {
    type: Number,
    required: true,
  },
  shippingFee: {
    type:Number,
    required:false
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash_on_delivery'], // Support both card and cash on delivery
    required: true,
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: { type: String },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
  deliveryAddress: {
    type: Object, // Store the entire address object from user details
    required: true,
  },
  contactDetails: {
    type: Object, // Store contact details from user
    required: true,
  },
  deliveryTip: {
    type: Number,
    default: 0, // Optional delivery tip
  },
  leaveAtDoor: {
    type: Boolean, // New field: Leave at door if not around
    default: false, // Default to false
  },
  deliveryInstructions: {
    type: String, // New field: Delivery instructions note
    default: '', // Default to an empty string
  },
  paymentIntentId: {
    type: String,
    default: null, // Store payment intent ID for card payments, null for cash on delivery
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'completed', 'canceled','delivered','new'], // Order status
  },
  createdAt: {
    type: Number,
  },
  updatedAt: {
    type: Number 
  },
});

// Middleware to update updatedAt field before saving
orderSchema.pre('save', function (next) {
  this.createdAt = new Date().getTime();
  next();
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
