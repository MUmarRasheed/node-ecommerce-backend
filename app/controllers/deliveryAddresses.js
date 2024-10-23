const User = require('../models/users'); // Ensure the path is correct
const { validationResult } = require('express-validator');
const { sendResponse } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");

const addAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        console.log("🚀 ~ addAddress ~ userId:", userId)
        const { title, default: isDefault, address } = req.body;

        const user = await User.findById(userId);
        console.log("🚀 ~ addAddress ~ user:", user)
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        // If the new address is marked as default, set others to non-default
        if (isDefault) {
            user.addresses.forEach(addr => { addr.default = false; });
        }

        user.addresses.push({ title, default: isDefault, address });
        await user.save();

        return res.status(201).json(sendResponse(1078, messages[1078], true, { addresses: user.addresses }));
    } catch (error) {
        return res.status(500).json(sendResponse(1085, messages[1085], false, { error: error.message }));
    }
};

const updateAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        console.log("🚀 ~ updateAddress ~ userId:", userId);
        
        const { title, default: isDefault, address, addressId } = req.body;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        // Find the address to update
        const addressToUpdate = user.addresses.id(addressId); // Use .id() to find the address by ID
        console.log("🚀 ~ updateAddress ~ addressToUpdate:", addressToUpdate);
        
        if (!addressToUpdate) {
            return res.status(404).json(sendResponse(1080, messages[1080], false));
        }

        // Set default address if applicable
        if (isDefault) {
            user.addresses.forEach(addr => { addr.default = false; });
        }

        // Update address fields
        addressToUpdate.title = title !== undefined ? title : addressToUpdate.title; // Update title if provided
        addressToUpdate.default = isDefault !== undefined ? isDefault : addressToUpdate.default; // Update default status
        addressToUpdate.address = address !== undefined ? address : addressToUpdate.address; // Update address if provided

        // Save the updated user document
        await user.save();
        return res.status(200).json(sendResponse(1081, messages[1081], true, { addresses: user.addresses }));
    } catch (error) {
        return res.status(500).json(sendResponse(1084, messages[1084], false, { error: error.message }));
    }
};

const deleteAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        const { addressId } = req.params; // Removed userId from params since it's in req.loginUser

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        // Use the 'id' method to find the address to remove
        const addressToRemove = user.addresses.id(addressId);
        if (!addressToRemove) {
            return res.status(404).json(sendResponse(1080, messages[1080], false));
        }

        // Instead of calling remove() on addressToRemove, use the parent document's methods
        user.addresses.pull(addressToRemove._id); // Remove the address by its _id

        await user.save();

        return res.status(200).json(sendResponse(1082, messages[1082], true, { addresses: user.addresses }));
    } catch (error) {
        return res.status(500).json(sendResponse(1085, messages[1085], false, { error: error.message }));
    }
};


const getAddresses = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        return res.status(200).json(sendResponse(1079, messages[1079], true, { addresses: user.addresses }));
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, { error: error.message }));
    }
};

module.exports = {
    addAddress,
    updateAddress,
    deleteAddress,
    getAddresses,
};
