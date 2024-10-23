const { body, query, param } = require('express-validator');

const checkoutValidator = (method) => {
    switch (method) {
        case 'checkout':
            return [
                body('addressId').notEmpty().withMessage('Address ID is required'), // Validate address ID
                body('cartId').notEmpty().withMessage('Cart ID is required'), // Validate cart ID
                body('contactId').notEmpty().withMessage('Contact ID is required'), // Validate contact ID
                body('paymentOption').isIn(['card', 'cash_on_delivery']).withMessage('Invalid payment option'), // Validate payment option
                body('deliveryTip').optional().isFloat({ gt: 0 }).withMessage('Delivery tip must be a positive number'), // Optional delivery tip
                body('leaveAtDoor').optional().isBoolean().withMessage('Leave at door must be a boolean'), // Optional leave at door
                body('deliveryInstructions').optional().isString().withMessage('Delivery instructions must be a string'), // Optional delivery instructions
            ];
        case 'getOrders':
            return []; // No specific validation for fetching all orders
        case 'getOrderById':
            return [
                param('orderId').notEmpty().withMessage('Order ID is required'), // Validate order ID from query
            ];
        case 'updateOrderStatus':
            return [
                body('orderId').notEmpty().withMessage('Order ID is required'), // Validate order ID
                body('userId').notEmpty().withMessage('User ID is required'), // Validate user ID
                body('status').notEmpty().isString().withMessage('Status is required'), // Validate status field
            ];
        default:
            return [];
    }
};

module.exports = checkoutValidator;
