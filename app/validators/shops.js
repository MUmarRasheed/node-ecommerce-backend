const { body, param } = require('express-validator');

const shopValidator = (method) => {
    switch (method) {
        case 'addShop':
            return [
                body('ownerName').notEmpty().withMessage('Owner name is required'),
                body('address').notEmpty().withMessage('Address is required'),
                body('phone').notEmpty().withMessage('Phone number is required'),
                body('website').optional().isString().withMessage('Website must be a valid string'),
                body('name').notEmpty().withMessage('Shop name is required'),
                body('description').optional().isString().withMessage('Description must be a string'),
                body('coverImage').optional().isObject().withMessage('Cover image must be an object'),
                body('logo').optional().isObject().withMessage('Logo must be an object'),
                body('location').optional().isObject().withMessage('Location must be an object')
            ];
        case 'updateShop':
            return [
                param('id').notEmpty().withMessage('Shop ID is required'),
                body('ownerName').optional().notEmpty().withMessage('Owner name is required'),
                body('address').optional().notEmpty().withMessage('Address is required'),
                body('phone').optional().notEmpty().withMessage('Phone number is required'),
                body('website').optional().isString().withMessage('Website must be a valid string'),
                body('name').optional().notEmpty().withMessage('Shop name is required'),
                body('description').optional().isString().withMessage('Description must be a string'),
                body('coverImage').optional().isObject().withMessage('Cover image must be an object'),
                body('logo').optional().isObject().withMessage('Logo must be an object'),
                body('location').optional().isObject().withMessage('Location must be an object')
            ];
        case 'getShop':
            return [
                param('id').notEmpty().withMessage('Shop ID is required'),
            ];
        case 'deleteShop':
            return [
                param('id').notEmpty().withMessage('Shop ID is required'),
            ];
        case 'approveShop':
            return [
                param('id').notEmpty().withMessage('Shop ID is required'),
            ];
        case 'getPendingShops':
            return [];
        case 'getAllShops':
            return [];
    }
};

module.exports = shopValidator;
