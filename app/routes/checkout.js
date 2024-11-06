const express = require('express');
// const contactValidator = require('../validators/deliveryContacts');
const { checkout, getOrders,getOrderById, updateOrderStatus, cancelOrder,getOrdersByUserId } = require('../controllers/checkout');
const checkoutValidator = require('../validators/checkout'); // Adjust the path as necessary

const loginRouter = express.Router();

// Add Contact
loginRouter.post('/create-order',checkoutValidator('checkout'), checkout);

// Get Orders
loginRouter.get('/get-orders', checkoutValidator('getOrders'), getOrders);
loginRouter.get('/get-user-orders', getOrdersByUserId);
loginRouter.get('/get-order-by-id/:orderId', checkoutValidator('getOrderById'), getOrderById);
loginRouter.put('/update-order-status', checkoutValidator('updateOrderStatus'), updateOrderStatus);
loginRouter.put('/cancel-order', checkoutValidator('cancelOrder'), cancelOrder);

module.exports = { loginRouter };
