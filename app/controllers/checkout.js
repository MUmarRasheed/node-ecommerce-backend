const { sendResponse ,createPaymentIntent, convertToObjectId, getEmailTemplate } = require('../helpers/utalityFunctions');
const sendEmail    = require("../helpers/sendEmail");

const config = require('config')

const messages = require('../messages/customMessages');
const User = require('../models/users'); // Assuming this is the user model
const Product = require('../models/products'); // Assuming you have a Product model for stock management
const Order = require('../models/order'); // Assuming you have an Order model for saving order records
const { validationResult } = require('express-validator');
const Transaction = require('../models/transaction'); // Import the Transaction model
const Cart = require('../models/cart'); // Assuming this is the user model
const Stock = require('../models/productStocks')
const Shop = require('../models/shops');
// Checkout API

const checkout = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
    }
    try {
        const userId = req.loginUser._id; // Assuming user is authenticated
        const { addressId, cartId, contactId, paymentOption, cardId, deliveryTip = 0, leaveAtDoor, deliveryInstructions } = req.body;

        // Fetch user details (addresses, contacts, stripeCustomerId, etc.)
        const user = await User.findById(userId).select('addresses contacts stripeCustomerId email name');
        if (!user) {
            return res.status(404).send(sendResponse(1005, messages[1005], false));
        }

        // Validate address and contact
        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).send(sendResponse(1080, messages[1080], false)); // Updated error message
        }
        
        const contact = user.contacts.id(contactId);
        console.log("🚀 ~ checkout ~ contact:", contact)
        if (!contact) {
            return res.status(404).send(sendResponse(1086, messages[1086], false )); // Updated error message
        }

        // Fetch cart details
        const cart = await Cart.findOne({ _id: cartId, userId });
        if (!cart) {
            return res.status(404).send(sendResponse(1076, messages[1076], false));
        }

        // Calculate subTotal and total amount
        const subTotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        let shippingFee = calculateShippingFee(address); // Custom logic for shipping fee based on address
        const totalAmount = subTotal + parseFloat(deliveryTip) + shippingFee;

        let paymentIntent;

        // Handle payment based on paymentOption
        if (paymentOption === 'card' && cardId) {
            paymentIntent = await createPaymentIntent('usd', totalAmount, user.stripeCustomerId, cardId);
        } else if (paymentOption === 'cash_on_delivery') {
            paymentIntent = { id: null }; // For COD, no payment intent is created
        } else {
            return res.status(400).send(sendResponse(1087, messages[1087], false));
        }

        // Prepare for stock and product updates
        const purchasedProducts = [];
        const stockUpdates = [];
        const productUpdates = [];

        for (const item of cart.items) {
            const stock = await Stock.findById(item.stockId);
            if (!stock) {
                return res.status(404).send(sendResponse(1004, messages[1004], false, 'Stock not found.'));
            }
            const product = await Product.findById(stock.productId);

            if (!product) {
                return res.status(404).send(sendResponse(1057, messages[1057], false));
            }

            if (stock.quantity < item.quantity) {
                return res.status(400).send(sendResponse(1077, messages[1077], false));
            }

            stock.quantity -= item.quantity; // Update stock quantity
            product.quantity -= item.quantity; // Update product quantity
            product.ordersCount = (product.ordersCount || 0) + item.quantity; // Increment orderCount

            stockUpdates.push(stock);
            productUpdates.push(product);

            purchasedProducts.push({
                productId: stock.productId,
                productName: product.name,  // Save product name
                stockId: stock._id,
                quantity: item.quantity,
                price: item.price,
                shopId: product.shopId, // Add shopId from product
                ownerId: product.userId
            });
        }

        // Update the stock quantities in the database
        await Promise.all(stockUpdates.map(stock => stock.save()));
        await Promise.all(productUpdates.map(product => product.save()));

        // Create the order
        const order = new Order({
            orderNumber: `ORD-${Date.now()}`,
            userId,
            email: user.email,
            totalPrice: totalAmount.toFixed(2),
            subTotal,
            paymentMethod: paymentOption,
            products: purchasedProducts,
            deliveryAddress: address,
            deliveryTip,
            contactDetails: contact,
            leaveAtDoor,
            deliveryInstructions,
            paymentIntentId: paymentIntent.id,
            shippingFee,
            orderStatus: 'new'
        });

        await order.save();
        // Convert createdAt timestamp to a readable date
        const orderDate = new Date(order.createdAt).toLocaleString(); // You can customize the format as needed

        // Create a transaction record
        const transaction = new Transaction({
            orderId: order._id,
            userId,
            amount: totalAmount.toFixed(2),
            currency: 'usd',
            paymentStatus: paymentOption === 'card' ? 'paid' : 'pending',
            paymentMethod: paymentOption,
            paymentIntentId: paymentIntent.id,
            deliveryTip,
            shippingFee,
            subTotal
        });

        await transaction.save();

        // Send order confirmation email to user
        const userEmailData = {
            name: user.name,
            orderNumber: order.orderNumber
        };
        const userEmailHtml = await getEmailTemplate(userEmailData, "orderConfirmationUser.hbs", false, false);
        await sendEmail(user.email, config.mailEmail, userEmailHtml, userEmailData, "", "Order Confirmation", "");

        // Send order notification email to admin
        const adminEmailData = {
            orderNumber: order.orderNumber,
            userEmail: user.email,
            orderDate: orderDate, // Include the formatted date here
            totalAmount: totalAmount.toFixed(2),
            paymentMethod: paymentOption,
            deliveryAddress: {
                address: address.address.formattedAddress,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
            },
            contactDetails: {
                phoneNumber: contact.number
            },
            deliveryTip,
            deliveryInstructions,
            products: purchasedProducts.map(item => ({
                productName: item.productName,  // Include product name
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: (item.price * item.quantity).toFixed(2)
            })),
            subTotal: subTotal.toFixed(2),
            deliveryFee: shippingFee.toFixed(2),
            grandTotal: totalAmount.toFixed(2)
        };
        
        const adminEmailHtml = await getEmailTemplate(adminEmailData, "orderConfirmationAdmin.hbs", false, false);
        await sendEmail(config.adminEmail, config.mailEmail, adminEmailHtml, adminEmailData, "", "New Order Notification", "");

        // Remove items from the cart
        await Cart.updateOne(
            { _id: cartId, userId },
            { $pull: { items: { _id: { $in: cart.items.map(item => item._id) } } } } // Remove all items in the cart
        );
        
        // Return successful response
        return res.status(200).send(sendResponse(1092, messages[1092], true));

    } catch (error) {
        console.error("🚀 ~ checkout ~ error:", error);
        return res.status(400).send(sendResponse(1000, messages[1000], false, error.message));
    }
};




// Get all orders for the authenticated user
const getOrders = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
        }

        // Get pagination parameters from query
        const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

        // Fetch orders with pagination
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 } // Sort by newest first
        };

        const orders = await Order.paginate({}, options);

        if (!orders.docs.length) {
            return res.status(404).send(sendResponse(1088, messages[1088], false));
        }

        // Return orders to the user with pagination info
        return res.status(200).send(sendResponse(200, messages[200], true, orders));
    } catch (error) {
        console.error("🚀 ~ getOrders ~ error:", error);
        return res.status(400).send(sendResponse(1089, messages[1089], false, error.message));
    }
};
const getOrdersByUserId = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
        }

        // Get pagination parameters from query
        const { page = 1, limit = 10, orderNumber } = req.query; // Default to page 1 and limit 10

        // Build the query object
        const query = { userId: req.loginUser._id };

        // If an orderNumber is provided, add it to the query using regex for partial matching
        if (orderNumber) {
            query.orderNumber = { $regex: new RegExp(orderNumber, 'i') }; // 'i' for case-insensitive matching
        }

        // Fetch orders for the user with pagination
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 } // Sort by newest first
        };

        const orders = await Order.paginate(query, options);

        if (!orders.docs.length) {
            return res.status(404).send(sendResponse(1088, messages[1088], false));
        }

        // Return orders to the user with pagination info
        return res.status(200).send(sendResponse(200, messages[200], true, orders));
    } catch (error) {
        console.error("🚀 ~ getOrdersByUserId ~ error:", error);
        return res.status(500).send(sendResponse(1089, messages[1089], false, error.message));
    }
};


// Get a specific order by ID
const getOrderById = async (req, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
    }
        const { orderId } = req.params;

        // Fetch the order by ID and check if it belongs to the user
        const order = await Order.findOne({ _id: orderId }).lean();


        if (!order) {
            return res.status(404).send(sendResponse(1090, messages[1090], false));
        }

        // Return the order
        return res.status(200).send(sendResponse(1089, messages[1089], true, { order }));
    } catch (error) {
        console.error("🚀 ~ getOrderById ~ error:", error);
        return res.status(400).send(sendResponse(1000, messages[1000], false, error.message));
    }
};


const calculateShippingFee = (address) => {
    // Example: Flat rate or custom logic based on address
    if (address.country === 'US') {
        return 5.99; // Flat rate for US
    } else if (address.country === 'Canada') {
        return 9.99; // Flat rate for Canada
    } else {
        return 0; // Flat rate for other countries
    }
};


// Update order status API
const updateOrderStatus = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
    }
    const { status , orderId , userId } = req.body; // Extract new status from request body

    try {

        // Check if the order exists and belongs to the user
        const order = await Order.findOne({ _id: orderId, userId: convertToObjectId(userId) });
        if (!order) {
            return res.status(404).send(sendResponse(1090, messages[1090], false ));
        }

        // Update the order status
        order.orderStatus = status; // Set the new status
        await order.save(); // Save the updated order

        // Return success response
        return res.status(200).send(sendResponse(1091, messages[1091],true));
    } catch (error) {
        console.error("🚀 ~ updateOrderStatus ~ error:", error);
        return res.status(400).send(sendResponse(1000, messages[1000], false, error.message));
    }
};


const cancelOrder = async (req, res) => {
    try {
        const userId = req.loginUser._id; // Assuming user is authenticated
        const { orderId, cancellationReason } = req.body;

        // Find the order by id and ensure it belongs to the user
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).send(sendResponse(1090, messages[1090], false)); // Order not found
        }
        if (order.orderStatus === 'cancelled') {
            return res.status(404).send(sendResponse(1090, messages[1090], false)); // Order not found
        }

        // Check if the order is cancellable (only 'dispatched' orders can be cancelled)
        if (order.orderStatus === 'dispatched' || order.orderStatus === 'accepted') {
            return res.status(400).send(sendResponse(1107, messages[1107], false)); // Updated message for non-cancellable order
        }

        // Track which shop owners to notify
        const shopOwnersEmails = {};

        // Update stock (revert product quantities) and gather shop owners' emails
        for (const item of order.products) {
            const stock = await Stock.findById(item.stockId);
            const product = await Product.findById(item.productId);

            if (stock && product) {
                stock.quantity += item.quantity; // Revert stock quantity
                product.quantity += item.quantity; // Revert product quantity
                product.ordersCount -= item.quantity; // Decrement orders count
                await stock.save();
                await product.save();
            }

            // Fetch the shop details and shop owner email
            const shop = await Shop.findById(item.shopId);
            if (shop && shop.ownerId) {
                const shopOwner = await User.findById(shop.ownerId);
                if (shopOwner) {
                    if (!shopOwnersEmails[item.shopId]) {
                        shopOwnersEmails[item.shopId] = {
                            email: shopOwner.email,
                            shopName: shop.name, // Store the shop name here
                            products: []
                        };
                    }
                    // Add the product details for this shop
                    shopOwnersEmails[item.shopId].products.push({
                        productName: item.productName,
                        quantity: item.quantity,
                        price: item.price
                    });
                }
            }
        }

        // Update the order status to 'cancelled'
        order.orderStatus = 'cancelled';
        await order.save();

        // Send order cancellation email to the user
        const userEmailData = {
            name: req.loginUser.name,
            orderNumber: order.orderNumber,
        };
        const userEmailHtml = await getEmailTemplate(userEmailData, 'orderCancelledUser.hbs', false, false);
        await sendEmail(req.loginUser.email, config.mailEmail, userEmailHtml, userEmailData, '', 'Order Cancellation Confirmation', '');

        // Send notification email to each shop owner with their specific product details
        for (const [shopId, { email, products, shopName }] of Object.entries(shopOwnersEmails)) {
            const totalAmount = products.reduce((sum, item) => sum + item.price * item.quantity, 0); // Calculate total amount for the shop's products

            const orderDate = new Date(order.createdAt);
            const formattedDate = `${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}`; // e.g. "10/24/2024 1:05:40 PM"

            const adminEmailData = {
                orderNumber: order.orderNumber,
                customerEmail: req.loginUser.email,
                customerName: req.loginUser.name,
                orderDate: formattedDate,
                totalAmount,
                shopName: shopName, // Use shopName from the shopOwnersEmails
                cancellationReason,
                paymentMethod: order.paymentMethod,
                products: shopOwnersEmails, // The list of products for this shop
            };

            const adminEmailHtml = await getEmailTemplate(adminEmailData, 'orderCancelledAdmin.hbs', false, false);
            await sendEmail(email, config.mailEmail, adminEmailHtml, adminEmailData, '', 'Order Cancelled Notification', '');
        }

        // Return successful response
        return res.status(200).send(sendResponse(1108, messages[1108], true));

    } catch (error) {
        console.error('🚀 ~ cancelOrder ~ error:', error);
        return res.status(400).send(sendResponse(1000, messages[1000], false, error.message));
    }
};



module.exports = {
  checkout,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrdersByUserId
};
