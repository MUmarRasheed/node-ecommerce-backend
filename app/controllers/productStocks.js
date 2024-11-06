const Stock = require('../models/productStocks'); // Adjust the path as needed
const Product = require('../models/products');
const { validationResult } = require('express-validator');
const { sendResponse , generateSKU } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");
const Shop = require('../models/shops');

// Add a new Stock
async function addStock(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    const { title, price, salePrice, quantity, options, isDisable, unit } = req.body;
    const productId = req.params.productId;
    const userId = req.loginUser._id; // Assuming user ID is available in req.user

    // Validate that the product exists and belongs to the user's shop
    const product = await Product.findById(productId).populate('shopId');
    if (!product) {
      return res.status(404).send(sendResponse(2015, messages[2015], false)); // Product not found
    }

    // Ensure the product belongs to the shop owned by the user
    const shop = await Shop.findById(product.shopId);
    if (!shop || String(shop.ownerId) !== String(userId)) {
      return res.status(403).send(sendResponse(1099, messages[1099], false)); // Not authorized to add stock to this product
    }

    // Generate SKU
    const sku = await generateSKU(title);
    console.log("🚀 ~ addStock ~ sku:", sku);
    
    // Check if stock already exists for the given product and title
    const existingStock = await Stock.findOne({ productId, title });

    if (existingStock) {
      // Update existing stock if found
      existingStock.price = price;
      existingStock.salePrice = salePrice;
      existingStock.quantity = quantity;
      existingStock.options = options;
      existingStock.unit = unit;
      existingStock.isDisable = isDisable;

      const updatedStock = await existingStock.save();

      return res.status(200).send(sendResponse(1055, messages[1055], true, updatedStock)); // Stock updated successfully
    } else {
      // Proceed with adding the new stock
      const newStock = new Stock({
        title,
        price,
        salePrice,
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
    }
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
    // Get pagination parameters from the request query
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

    // Fetch stocks for the user with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 } // Sort by createdAt in descending order
    };

    const stocks = await Stock.paginate({ userId: req.loginUser._id }, options);

    // Return paginated stocks to the user
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

    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const options = {
      page,
      limit,
      sort: { createdAt: -1 } // Sort by newest first
    };

    // Fetch stocks for the product with pagination
    const stocks = await Stock.paginate({ userId: req.loginUser._id, productId }, options);

    // Return paginated stocks to the user
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
    // Find the stock by ID and ensure it belongs to the user
    const stock = await Stock.findOne({ userId: req.loginUser._id, _id: req.params.id });
    if (!stock) {
      return res.status(404).send(sendResponse(1057, messages[1057], false)); // Stock not found
    }

    // Check if another stock with the same title exists (excluding the current stock)
    const { title } = req.body;
    if (title) {
      const existingStock = await Stock.findOne({ 
        title, 
        productId: stock.productId, // Ensure it's the same product
        _id: { $ne: stock._id }      // Exclude the current stock ID
      });

      if (existingStock) {
        return res.status(409).send(sendResponse(2017, messages[2017], false)); // Conflict: Same title exists
      }
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
