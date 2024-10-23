const { validationResult } = require('express-validator');
const { sendResponse } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");
const User = require('../models/users'); // Ensure the path is correct

// Add Contact
const addContact = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        const { title, number, default: isDefault } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        // Set default contact if applicable
        if (isDefault) {
            user.contacts.forEach(contact => { contact.default = false; });
        }

        // Create new contact and add to user
        const newContact = { title, number, default: isDefault };
        user.contacts.push(newContact);
        await user.save();

        return res.status(201).json(sendResponse(1081, 'Contact added successfully', true, { contacts: user.contacts }));
    } catch (error) {
        return res.status(500).json(sendResponse(1084, 'Failed to add contact', false, { error: error.message }));
    }
};

// Get Contacts
const getContacts = async (req, res) => {
    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        return res.status(200).json(sendResponse(1081, 'Contacts retrieved successfully', true, { contacts: user.contacts }));
    } catch (error) {
        return res.status(500).json(sendResponse(1084, 'Failed to retrieve contacts', false, { error: error.message }));
    }
};

// Update Contact
const updateContact = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        const { contactId } = req.params; // Get contactId from request parameters
        const { title, number, default: isDefault } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        const contactToUpdate = user.contacts.id(contactId);
        if (!contactToUpdate) {
            return res.status(404).json(sendResponse(1080, 'Contact not found', false));
        }

        // Update contact fields
        contactToUpdate.title = title || contactToUpdate.title;
        contactToUpdate.number = number || contactToUpdate.number;
        contactToUpdate.default = isDefault !== undefined ? isDefault : contactToUpdate.default;

        await user.save();
        return res.status(200).json(sendResponse(1081, 'Contact updated successfully', true, { contacts: user.contacts }));
    } catch (error) {
        return res.status(500).json(sendResponse(1084, 'Failed to update contact', false, { error: error.message }));
    }
};

// Delete Contact
const deleteContact = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, 'Validation Error', false, errors.errors));
    }

    try {
        const userId = req.loginUser._id; // Corrected user ID retrieval
        const { contactId } = req.params; // Get contactId from request parameters

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(sendResponse(1005, messages[1005], false));
        }

        const contactToRemove = user.contacts.id(contactId);
        if (!contactToRemove) {
            return res.status(404).json(sendResponse(1080, 'Contact not found', false));
        }

        user.contacts.pull(contactId); // Remove the contact by its ID
        await user.save();

        return res.status(200).json(sendResponse(1082, 'Contact deleted successfully', true, { contacts: user.contacts }));
    } catch (error) {
        return res.status(500).json(sendResponse(1085, 'Failed to delete contact', false, { error: error.message }));
    }
};

module.exports = {
    addContact,
    getContacts,
    updateContact,
    deleteContact
};
