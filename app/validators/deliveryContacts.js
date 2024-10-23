const { body, param } = require('express-validator');

const contactValidator = (method) => {
    switch (method) {
        case 'addContact':
            return [
                body('title').notEmpty().withMessage('Title is required'),
                body('number').isString().notEmpty().withMessage('Number is required'),
                body('default').optional().isBoolean().withMessage('Default must be a boolean'),
            ];
        case 'updateContact':
            return [
                param('contactId').notEmpty().withMessage('Contact ID is required'),
                body('title').optional().isString(),
                body('number').optional().isString(),
                body('default').optional().isBoolean(),
            ];
        case 'deleteContact':
            return [
                param('contactId').notEmpty().withMessage('Contact ID is required'),
            ];
        case 'getContacts':
            return [];
    }
};

module.exports = contactValidator;
