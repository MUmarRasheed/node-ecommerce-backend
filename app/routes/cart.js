const express = require('express');
const { addToCart, getCartItems, updateCartItem, deleteCartItem } = require('../controllers/cart');
const cartValidator  = require('../validators/cart');

const loginRouter = express.Router();

// Add Product to Cart
loginRouter.post('/add-to-cart',cartValidator('addToCart'), addToCart);

// Get Cart Items
loginRouter.get('/get-cart-items', getCartItems);

// Update Cart Item
loginRouter.put('/update-cart-items/:id', cartValidator('updateCartItem'), updateCartItem);

// Delete Cart Item
loginRouter.delete('/remove-cart-items',cartValidator('deleteCartItem'), deleteCartItem);

module.exports = {loginRouter};
