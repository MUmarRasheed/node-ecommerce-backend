const express = require('express');
const { addContact, getContacts, updateContact, deleteContact } = require('../controllers/deliveryContacts');
const contactValidator = require('../validators/deliveryContacts');

const loginRouter = express.Router();

// Add Contact
loginRouter.post('/add-delivery-contact', contactValidator('addContact'), addContact);

// Get Contacts
loginRouter.get('/get-delivery-contacts', getContacts);

// Update Contact
loginRouter.put('/update-delivery-contact/:contactId', contactValidator('updateContact'), updateContact);

// Delete Contact
loginRouter.delete('/delete-delivery-contact/:contactId', contactValidator('deleteContact'), deleteContact);

module.exports = { loginRouter };
