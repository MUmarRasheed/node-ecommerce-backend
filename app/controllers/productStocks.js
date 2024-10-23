const Stock = require('../models/productStocks'); // Adjust the path as needed
const Product = require('../models/products');
const { validationResult } = require('express-validator');
const { sendResponse } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");
const Shop = require('../models/shops');

// Add a new Stock
async function addStock(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const { title, price, salePrice, quantity, sku, options, isDisable, unit } = req.body;
    const productId = req.params.productId;
    const userId = req.loginUser._id; // Assuming user ID is available in req.user

    // Validate that the product exists and belongs to the user's shop
    const product = await Product.findById(productId).populate('shopId');
    if (!product) {
      return res.status(404).send(sendResponse(2015, messages[2015], false)); // Product not found
    }

    // Ensure the product belongs to the shop owned by the user
    const shop = await Shop.findById(product.shopId);
    console.log("🚀 ~ addStock ~ shop:", shop)
    if (!shop || String(shop.ownerId) !== String(userId)) {
      return res.status(403).send(sendResponse(1099, messages[1099], false)); // Not authorized to add stock to this product
    }

    // Proceed with adding the new stock
    const newStock = new Stock({
      title,
      price,      // Directly manage price in stock
      salePrice,  // Directly manage sale price in stock
      quantity,
      sku,
      options,
      unit,
      isDisable,
      productId,
      shopId: shop._id,   // Save the shopId
      userId            // Save the userId
    });

    const savedStock = await newStock.save();

    // Optionally update product with new stock reference if needed
    await Product.findByIdAndUpdate(productId, { $push: { stockIds: savedStock._id } });

    return res.status(201).send(sendResponse(1052, messages[1052], true, savedStock));
  } catch (error) {
    console.error("Error adding stock:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Get All Stocks
async function getStocks(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }
  
  try {
    const stocks = await Stock.find({ userId: req.loginUser._id }).sort({createdAt:-1}); // Populate product details if needed
    return res.status(200).send(sendResponse(1054, messages[1054], true, stocks));
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Get All Stocks for a specific Product by Product ID
async function getStocksByProductId(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }
  try {
    const productId = req.params.id; // Get productId from request parameters
    // Validate that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send(sendResponse(2015, messages[2015], false)); // Product not found
    }

    // Fetch stocks for the product
    const stocks = await Stock.find({ userId: req.loginUser._id, productId }); // Populate product details
    return res.status(200).send(sendResponse(1054, messages[1054], true, stocks));
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Update a Stock
async function updateStock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
    // Find the stock by ID
    const stock = await Stock.findById({ userId: req.loginUser._id, _id : req.params.id });
    if (!stock) {
      return res.status(404).send(sendResponse(1057, messages[1057], false)); // Stock not found
    }

    // Update stock details directly
    Object.assign(stock, req.body);
    const updatedStock = await stock.save();

    return res.status(200).send(sendResponse(1055, messages[1055], true, updatedStock));
  } catch (error) {
    console.error("Error updating stock:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Delete a Stock
async function deleteStock(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
    // Find the stock by ID
    const stock = await Stock.findById({ userId: req.loginUser._id, _id: req.params.id });
    if (!stock) {
      return res.status(404).send(sendResponse(1057, messages[1057], false));
    }

    // Remove stock reference from the product
    await Product.updateMany({ userId: req.loginUser._id, stockIds: stock._id }, { $pull: { stockIds: stock._id } });

    // Remove the stock document using findByIdAndDelete
    await Stock.findByIdAndDelete(req.params.id);

    return res.status(200).send(sendResponse(1056, messages[1056], true));

  } catch (error) {
    console.error("Error deleting stock:", error);
    return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
  }
}

module.exports = { 
  addStock,
  getStocksByProductId,
  getStocks,
  updateStock,
  deleteStock
};
