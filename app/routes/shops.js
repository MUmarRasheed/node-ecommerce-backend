const express = require('express');
const { createShop, getAllShops, getShopById, updateShop, deleteShop , getAdminShop, approveOrDisapproveShop } = require('../controllers/shops');
const shopValidator = require('../validators/shops');
const router = express.Router();
const loginRouter = express.Router();

loginRouter.get('/get-shops', getAllShops); // Get All Shops
loginRouter.get('/get-shop-by-id/:id', shopValidator('getShop'), getShopById); // Get Single Shop
loginRouter.put('/update-shop/:id', shopValidator('updateShop'), updateShop); // Update Shop
loginRouter.delete('/delete-shop/:id', shopValidator('deleteShop'), deleteShop); // Delete Shop

// Admin routes
loginRouter.put('/approve-shop/:id', approveOrDisapproveShop); // Admin approves the shop
loginRouter.get('/get-admin-shop', getAdminShop); // Admin approves the shop

module.exports = { loginRouter, router };
