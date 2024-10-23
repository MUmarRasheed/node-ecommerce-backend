const Cart = require('../models/Cart'); // Ensure the path is correct
const Product = require('../models/products'); // Ensure the path is correct
const Stock = require('../models/productStocks'); // Ensure the path is correct
const { validationResult } = require('express-validator');
const { sendResponse , convertToObjectId } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");

// Create (Add Multiple Products to Cart)
async function addToCart(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
        }

        const productsToAdd = req.body.products; // Expecting an array of products
        console.log("🚀 ~ addToCart ~ productsToAdd:", productsToAdd);

        // Validate that productsToAdd is an array
        if (!Array.isArray(productsToAdd) || productsToAdd.length === 0) {
            return res.status(400).send(sendResponse(1004, messages[1004], false));
        }

        const userId = req.loginUser._id; // Assuming you have the user ID from the request
        console.log("🚀 ~ addToCart ~ userId:", userId);
        let cart = await Cart.findOne({ userId });

        // If no cart exists for the user, create one
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        for (const productDetails of productsToAdd) {
            console.log("🚀 ~ addToCart ~ productDetails:", productDetails);
            const { productId, quantity, stockId } = productDetails;

            // Check if the product exists
            const product = await Product.findById(productId);
            console.log("🚀 ~ addToCart ~ product:", product);
            if (!product) {
                return res.status(400).send(sendResponse(1066, messages[1066], false));
            }

            // Handle stock validation
            let stockItem, finalPrice, salePrice;
            if (stockId) {
                // Check the available stock for the selected product
                stockItem = await Stock.findOne({ productId: productId, _id: stockId });
                console.log("🚀 ~ addToCart ~ stockItem:", stockItem);
                if (!stockItem) {
                    return res.status(404).send(sendResponse(1057, `Stock not found for product ID: ${productId}`, false));
                }
                if (stockItem.isDisable) {
                    return res.status(400).send(sendResponse(1073, messages[1073], false)); // Disabled stock
                }
                if (stockItem.quantity < quantity) {
                    return res.status(400).send(sendResponse(1072, messages[1072], false));
                }

                // Use salePrice if available, otherwise fallback to price
                finalPrice = stockItem.salePrice !== null && stockItem.salePrice !== undefined ? stockItem.salePrice : stockItem.price;
                salePrice = stockItem.salePrice; // Set salePrice based on stock item
            } else {
                return res.status(400).send(sendResponse(1074, "StockId is required for this product.", false));
            }

            // Check if the product already exists in the cart with the same stockId
            const existingItemIndex = cart.items.findIndex(item => 
                item.productId.toString() === productId &&
                (item.stockId ? item.stockId.toString() === stockId : !item.stockId)
            );

            if (existingItemIndex > -1) {
                // If the item already exists, update the quantity
                const updatedQuantity = cart.items[existingItemIndex].quantity + quantity;

                // Check if the updated quantity exceeds available stock
                if (updatedQuantity > stockItem.quantity) {
                    return res.status(400).send(sendResponse(1072, messages[1072], false));
                }

                cart.items[existingItemIndex].quantity = updatedQuantity;
            } else {
                // Create a new cart item
                cart.items.push({ productId, stockId, price: finalPrice, quantity, salePrice });
            }
        }

        // Save the cart
        await cart.save();

        return res.status(201).send(sendResponse(1068, messages[1068], cart.items)); // All products added successfully
    } catch (error) {
        console.error("Error adding to cart:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}



// Update (Update Cart Item)
async function updateCartItem(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        const updates = req.body.products; // Expecting an array of product updates
        console.log("🚀 ~ updateCartItem ~ updates:", updates);

        // Check if the cart exists for the user
        const userId = req.loginUser._id; 
        const cart = await Cart.findOne({ userId });
        console.log("🚀 ~ updateCartItem ~ cart:", cart);

        if (!cart) {
            return res.status(404).send(sendResponse(1076, messages[1076], false)); // Cart not found
        }

        const updatedItems = []; // To keep track of updated items

        for (const update of updates) {
            const { productId, quantity, stockId } = update; // stockId is required
            console.log("🚀 ~ updateCartItem ~ update:", update);

            // Fetch stock information for the product
            const stock = await Stock.findById(stockId);
            if (!stock) {
                return res.status(404).send(sendResponse(1057, messages[1057], false)); // Stock not found
            }

            // Check stock availability
            if (quantity > stock.quantity) {
                return res.status(400).send(sendResponse(1072, messages[1072], false)); // Insufficient stock
            }

            // Check for existing item in the cart
            const existingItemIndex = cart.items.findIndex(item => 
                item.productId.toString() === productId && item.stockId.toString() === stockId
            );
            console.log("🚀 ~ updateCartItem ~ existingItemIndex:", existingItemIndex);

            // Update the quantity or add new item
            if (existingItemIndex !== -1) {
                // Update the existing item's quantity
                if (quantity <= 0) {
                    // If quantity is 0 or less, remove the item from cart
                    cart.items.splice(existingItemIndex, 1);
                } else {
                    // Update quantity if it's greater than 0
                    cart.items[existingItemIndex].quantity = quantity; // Update quantity
                }
            } else {
                // If the item does not exist, add it to the cart
                cart.items.push({
                    productId,
                    stockId,
                    price: stock.salePrice !== null && stock.salePrice !== undefined ? stock.salePrice : stock.price, // Set the price based on stock
                    quantity,
                });
            }
            updatedItems.push({
                productId,
                stockId,
                quantity,
                _id: existingItemIndex !== -1 ? cart.items[existingItemIndex]._id : undefined // Track the updated item
            });
        }

        // Save the updated cart
        await cart.save();

        // Return the updated cart items
        return res.status(200).send(sendResponse(1069, messages[1069], {
            updatedItems: updatedItems.length ? updatedItems : cart.items, // Send updated items or current items if no updates
        }));
    } catch (error) {
        console.error("Error updating cart item:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}







// Delete (Remove Product from Cart)
async function deleteCartItem(req, res) {
    const errors = validationResult(req);
    console.log("🚀 ~ deleteCartItem ~ validationErrors:", errors);
    
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        const itemsToDelete = req.body.products; // Expecting an array of { productId, stockId }
        console.log("🚀 ~ deleteCartItem ~ itemsToDelete:", itemsToDelete);
        const userId = req.loginUser._id;
        console.log("🚀 ~ deleteCartItem ~ userId:", userId)    

        if (!Array.isArray(itemsToDelete)) {
            return res.status(400).send(sendResponse(1003, "Invalid input format: 'products' must be an array", false));
        }

        // Find the user's cart
        const cart = await Cart.findOne({ userId });
        console.log("🚀 ~ deleteCartItem ~ cart:", cart)
        if (!cart) {
            return res.status(404).send(sendResponse(1076, messages[1076], false)); // Cart not found
        }

        let deletedCount = 0; // Keep track of how many items were deleted

        for (const item of itemsToDelete) {
            console.log("🚀 ~ deleteCartItem ~ item:", item);
            const { productId, stockId } = item;

            // Convert productId and stockId to ObjectId
            const productObjectId = convertToObjectId(productId);
            const stockObjectId = stockId ? convertToObjectId(stockId) : null; // Convert only if stockId is provided

            console.log("🚀 ~ deleteCartItem ~ Deleting:", productObjectId, stockObjectId);

            // Find the index of the item in the cart
            const existingItemIndex = cart.items.findIndex(cartItem =>
                cartItem.productId.equals(productObjectId) && 
                (stockObjectId ? cartItem.stockId.equals(stockObjectId) : !cartItem.stockId) // Check if stockId matches or is undefined
            );
            console.log("🚀 ~ deleteCartItem ~ existingItemIndex:", existingItemIndex)

            if (existingItemIndex !== -1) {
                // Remove the item from the cart if found
                cart.items.splice(existingItemIndex, 1); 
                deletedCount++;
            }
        }

        // Save the updated cart if any items were deleted
        if (deletedCount > 0) {
            await cart.save();
        }

        // Prepare the response
        return res.status(200).send(sendResponse(
            1070, `${deletedCount} item(s) deleted successfully`,
            true,
            { deletedCount }
        ));
    } catch (error) {
        console.error("Error deleting cart items:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}



// Read (Get Cart Items)
async function getCartItems(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        const userId = req.loginUser._id; 
        const cart = await Cart.findOne({ userId })
            .populate('items.productId', 'name image productImages unit') // Populate product details
            .populate('items.stockId', 'title'); // Corrected populate for stockId
        console.log("🚀 ~ getCartItems ~ cart:", cart.items)
        if (!cart || cart.items.length === 0) {
            return res.status(200).send(sendResponse(1071, messages[1071], false)); // Cart is empty
        }

        // Map through cart items to format the response
        const formattedItems = cart.items.map(item => {
            console.log("🚀 ~ formattedItems ~ item:", item)

            return {
                cartId : cart._id,
                productId: item.productId._id,
                name: item.productId.name,
                images:item.productId.image,
                productImages: item.productId.productImages,
                quantity: item.quantity,
                price: item.price,
                unit: item.productId.unit,
                stockId: item.stockId.id,
                size: item.stockId ? item.stockId.title : null // Add stock title
            };
        });

        return res.status(200).send(sendResponse(1074, messages[1074], formattedItems)); // Return formatted cart items
    } catch (error) {
        console.error("Error retrieving cart items:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}


module.exports = {
    addToCart,
    getCartItems,
    updateCartItem,
    deleteCartItem,
};
