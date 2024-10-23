const express = require('express');
const { addAddress, getAddresses, updateAddress, deleteAddress } = require('../controllers/deliveryAddresses'); // Adjust the path as needed
const addressValidator = require('../validators//deliveryAddresses'); // Adjust the path as needed

const loginRouter = express.Router();

// Add Address
loginRouter.post('/add-delivery-addresses', addressValidator('addAddress'), addAddress);

// Get Addresses
loginRouter.get('/get-delivery-addresses', getAddresses);

// Update Address
loginRouter.put('/update-delivery-address', addressValidator('updateAddress'), updateAddress);

// Delete Address
loginRouter.delete('/delete-delivery-address/:addressId', addressValidator('deleteAddress'), deleteAddress);

module.exports = { loginRouter };
