const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const config = require("config");
const { Schema } = mongoose;
const { paginate } = require("../helpers/utalityFunctions");

/*
  - Create index for only those fields which you want to query (For Searching)
  - [ role ]  // change according to your requirements
      1 = Admin
      2 = Users
*/


// Address Schema
const addressSchema = new Schema({
  title: { type: String, required: true },
  default: { type: Boolean, default: false },
  address: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    formattedAddress: { type: String, required: true }
  }
});

// Contact Schema
const contactSchema = new Schema({
  title: { type: String, required: true },
  default: { type: Boolean, default: false },
  number: { type: String, required: true }
});

//User Schema
const userSchema = new Schema({
  name: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  phone: { type: String, default: "" },
  lastName: { type: String, default: "" },
  email: { type: String, unique: true, index: true, default: "" },
  role: { type: Number },
  profileImage: { type: String, default: "" },
  city: { type: String, default: "" },
  country: { type: String, default: "" },
  countryCode: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  token: { type: String },
  password: { type: String },
  active: { type: Boolean, default: false },
  isLoggedIn: { type: Boolean, default: false },
  stripeCustomerId: { type: String },
  createdAt: { type: Number },
  isBlocked: { type : Boolean, default: false },
  isEmailVerified: { type: Boolean },
  verificationToken: { type: String },
  addresses: [addressSchema],
  contacts: [contactSchema],
  verificationTokenExpiry: { type: Number },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // Refers to the shop admin manages,
  shopStatus: { type: Boolean }
});

//Save createdAt when a document created
userSchema.pre("save", async function (next) {
  this.createdAt = new Date().getTime();
  if (this.isModified("password")) {
    this.password = await bcrypt.hashSync(this.password, config.salt);
  }
  next();
});


userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.plugin(paginate);

const Users = mongoose.model("Users", userSchema);

Users.createIndexes();

module.exports = Users;
