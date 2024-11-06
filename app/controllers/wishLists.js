const { validationResult } = require('express-validator');
const Wishlist = require('../models/wishLists'); // Adjust the path as necessary
const User = require('../models/users'); // Adjust the path as necessary
const Products = require('../models/products'); // Adjust the path as necessary
const { sendResponse } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");

// Add Product to Wishlist
async function addToWishlist(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        // Find the user first
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // User not found
        }

        // Check if the product ID is provided
        const { productId } = req.body;
        
        // Find or create the user's wishlist
        let wishlist = await Wishlist.findOne({ userId: user._id });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: user._id, products: [] });
        }

        // Check if the product is already in the wishlist
        if (wishlist.products.includes(productId)) {
            return res.status(400).json(sendResponse(1101, messages[1101], false)); // Product already in wishlist
        }

        // Check if the product exists
        const product = await Products.findById(productId);
        console.log("🚀 ~ addToWishlist ~ product:", product)
        if (!product) {
            return res.status(404).json(sendResponse(1010, "Product not found.", false)); // Product not found
        }

        // Add the product to the wishlist
        wishlist.products.push(productId);
        const updatedWishlist = await wishlist.save();

        return res.status(200).json(sendResponse(1100, messages[1100], true, updatedWishlist)); // Success
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Remove Product from Wishlist
async function removeFromWishlist(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        // Find the user first
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // User not found
        }

        // Check if the product ID is provided
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json(sendResponse(1010, messages[1010], false)); // Product ID not provided
        }

        // Find the user's wishlist
        const wishlist = await Wishlist.findOne({ userId: user._id });
        if (!wishlist) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // Wishlist not found
        }

        // Remove the product from the wishlist
        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { userId: user._id },
            { $pull: { products: productId } },
            { new: true }
        );

        return res.status(200).json(sendResponse(1102, messages[1102], true, updatedWishlist)); // Product removed successfully
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Get User Wishlist
async function getUserWishlist(req, res) {
    try {
        // Find the user first
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // User not found
        }

        // Retrieve the user's wishlist
        const wishlist = await Wishlist.findOne({ userId: user._id }).populate('products');
        if (!wishlist) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // Wishlist not found
        }

        return res.status(200).json(sendResponse(1103, messages[1103], true, wishlist)); // Wishlist retrieved successfully
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Clear Wishlist
async function clearWishlist(req, res) {
    try {
        // Find the user first
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // User not found
        }

        // Clear the user's wishlist
        const wishlist = await Wishlist.findOneAndDelete({ userId: user._id });
        if (!wishlist) {
            return res.status(404).json(sendResponse(1005, messages[1005], false)); // Wishlist not found
        }

        return res.status(200).json(sendResponse(1104, messages[1104], true, {})); // Wishlist cleared successfully
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Example Route Mappings
module.exports = {
    addToWishlist,
    removeFromWishlist,
    getUserWishlist,
    clearWishlist,
};
