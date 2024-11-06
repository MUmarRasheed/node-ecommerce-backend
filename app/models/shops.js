const mongoose = require('mongoose');
const { paginate } = require("../helpers/utalityFunctions");

// Enhanced Location Subschema
const LocationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point', required: false }, // GeoJSON type
  coordinates: { 
    type: [Number], // [lng, lat]
    required: true 
  },
  zip: { type: String, required: false },     // Zip code
  lat: { type: Number, required: false },     // Latitude
  lng: { type: Number, required: false }      // Longitude
}, { _id: false }); // Disable auto ID generation for sub-documents

// Main Shop Schema
const ShopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }, // References the admin (owner) of the shop
  ownerName: { type: String, required: true },
  isActive: { type: Boolean, required: false                                                                                                  },
  isApproved: { type: Boolean, required: false                                                                                                  },
  address: { type: String, required: false                                                                                                  },
  phone: { type: String, required: false                                                                                                  },
  website: { type: String, required: false                                                                                                  },
  name: { type: String, required: false                                                                                                 , unique: false },
  slug: { type: String, required: true },
  description: { type: String, required: false },
  coverImage: {
    thumbnail: { type: String, required: false },
    original: { type: String, required: false }
  },
  logo: {
    thumbnail: { type: String, required: false },
    original: { type: String, required: false }
  },
  createdAt: { type: Number },
  updatedAt: { type: Number },
  location: LocationSchema, // Use the enhanced location subschema
  category: { type: String, required: false }, // New category field, allowing multiple categories
});

// Index for geospatial queries
ShopSchema.index({ location: '2dsphere' });

ShopSchema.pre("save", function (next) {
  this.createdAt = new Date().getTime();
  next();
});

ShopSchema.plugin(paginate);

module.exports = mongoose.model('Shop', ShopSchema);
