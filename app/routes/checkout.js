const express = require('express');
// const contactValidator = require('../validators/deliveryContacts');
const { checkout, getOrders,getOrderById, updateOrderStatus } = require('../controllers/checkout');
const checkoutValidator = require('../validators/checkout'); // Adjust the path as necessary

const loginRouter = express.Router();

// Add Contact
loginRouter.post('/create-order',checkoutValidator('checkout'), checkout);

// Get Orders
loginRouter.get('/get-orders', checkoutValidator('getOrders'), getOrders);
loginRouter.get('/get-order-by-id/:orderId', checkoutValidator('getOrderById'), getOrderById);
loginRouter.put('/update-order-status', checkoutValidator('updateOrderStatus'), updateOrderStatus);

module.exports = { loginRouter };
