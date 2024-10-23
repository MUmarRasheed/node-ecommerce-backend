const mongoose = require('mongoose');
const { paginate } = require("../helpers/utalityFunctions");

// Enhanced Location Subschema
const LocationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point', required: true }, // GeoJSON type
  coordinates: { 
    type: [Number], // [lng, lat]
    required: true 
  },
  address: { type: String, required: false }, // Full address
  zip: { type: String, required: false },     // Zip code
  lat: { type: Number, required: false },     // Latitude
  lng: { type: Number, required: false }      // Longitude
}, { _id: false }); // Disable auto ID generation for sub-documents

// Main Shop Schema
const ShopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }, // References the admin (owner) of the shop
  ownerName: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: false },
  isApproved: { type: Boolean, required: true, default: false },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  website: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: {
    thumbnail: { type: String, required: true },
    original: { type: String, required: true }
  },
  logo: {
    thumbnail: { type: String, required: true },
    original: { type: String, required: true }
  },
  createdAt: { type: Number },
  updatedAt: { type: Number },
  location: LocationSchema // Use the enhanced location subschema
});

// Index for geospatial queries
ShopSchema.index({ location: '2dsphere' });

ShopSchema.pre("save", function (next) {
  this.createdAt = new Date().getTime();
  next();
});

ShopSchema.plugin(paginate);

module.exports = mongoose.model('Shop', ShopSchema);
