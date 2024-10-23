const mongoose = require("mongoose");
const { Schema } = mongoose;
const { paginate } = require("../helpers/utalityFunctions");

const purchaseHistorySchema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'video',
  description: { type: String },
  duration: { type: Number }, // For items like videos or courses
  price: { type: Number, required: true },
  url: { type: String }, // URL for digital items
  thumbnailImage: { type:String },
  createdAt: { type: Number },
  agreedToTerms: { type: Boolean, required: true }, // User explicitly agrees
  ageDeclaration: { type: Boolean, required: true }, // User explicitly confirms
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  purchasedId: { type: Schema.Types.ObjectId, required: true }, // ID of the purchased item
  additionalInfo: { type: Schema.Types.Mixed }, // For any extra data specific to the purchase type,
  paymentMethod: { type: String, required: true },
  isPurchased: { type: Boolean },
  vatPrice: { type: Number },
  couponCode:{ type: String, default: "" }
});

// Save createdAt when a document is created
purchaseHistorySchema.pre("save", async function (next) {
  this.createdAt = new Date().getTime();
  next();
});

purchaseHistorySchema.plugin(paginate);

const PurchaseHistory = mongoose.model(
  "PurchaseHistory",
  purchaseHistorySchema
);

module.exports = PurchaseHistory;
