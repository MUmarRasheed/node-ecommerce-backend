const express = require("express");
const loginRouter = express.Router();
const wishlistController = require("../controllers/wishLists"); // Adjust path as needed
const wishlistValidator = require("../validators/wishLists");

// Define the routes
loginRouter.post(
  "/add-to-wishlist/:userId",
  wishlistValidator("addToWishlist"),
  wishlistController.addToWishlist
);
loginRouter.delete(
  "/remove-wishlist/:userId",
  wishlistValidator("removeFromWishlist"),
  wishlistController.removeFromWishlist
);
loginRouter.get(
  "/get-wishlist/:userId",
  wishlistValidator("getUserWishlist"),
  wishlistController.getUserWishlist
);
loginRouter.delete(
  "/clear-wishlist/:userId",
  wishlistValidator("clearWishlist"),
  wishlistController.clearWishlist
);

module.exports = { loginRouter };
