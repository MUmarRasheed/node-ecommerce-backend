const express = require('express');
const { createShop, getAllShops, getShopById, updateShop, deleteShop , approveShop, getPendingShops } = require('../controllers/shops');
const shopValidator = require('../validators/shops');
const router = express.Router();
const loginRouter = express.Router();

loginRouter.post('/add-shop', shopValidator('addShop'), createShop); // Create Shop
loginRouter.get('/get-shops', getAllShops); // Get All Shops
loginRouter.get('/get-shop-by-id/:id', shopValidator('getShop'), getShopById); // Get Single Shop
loginRouter.put('/update-shop/:id', shopValidator('updateShop'), updateShop); // Update Shop
loginRouter.delete('/delete-shop/:id', shopValidator('deleteShop'), deleteShop); // Delete Shop

// Admin routes
loginRouter.put('/approve-shop/:id', approveShop); // Admin approves the shop
loginRouter.get('/get-pending-shops', getPendingShops); 
module.exports = { loginRouter, router };
