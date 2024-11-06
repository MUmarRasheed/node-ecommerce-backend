// complaint.model.js
const mongoose = require('mongoose');
const { paginate } = require("../helpers/utalityFunctions");

const complaintSchema = new mongoose.Schema({
  orderNumber: {
    type: String
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  dateOfComplaint: { type: Date, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product'  },
  proofOfPurchase: { type: String },
  natureOfComplaint: { type: String, required: true },
  description: { type: String, required: true },
  resolutionSought: { type: String, required: true },
  resolutionSummary:{ type: String },
  supportingDocuments: [{ type: String }], // Array of URLs or paths for supporting files
  status: { type: String, enum: ['pending', 'inReview', 'resolved', 'rejected'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: {
    type: Number
  },
  updatedAt: {
    type: Number
  },
});

// Middleware to update createdAt fields
complaintSchema.pre("save", async function (next) {
    this.createdAt = new Date().getTime();
    next();
  });

complaintSchema.plugin(paginate);
const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
