const express = require('express');
const router = express.Router();
const loginRouter = express.Router();

const { addStock, getStocks, getStocksByProductId, updateStock, deleteStock } = require('../controllers/productStocks'); // Adjust the path as needed
const stockValidator = require("../validators/productStocks"); // Adjust the path as needed

// CRUD routes for stocks
loginRouter.post('/add-product-stock/:productId', stockValidator("addStock"), addStock);
loginRouter.get('/get-product-stocks', getStocks);
loginRouter.get('/get-product-stock-by-id/:id',stockValidator("getStockById"), getStocksByProductId);
loginRouter.put('/update-product-stock/:id', stockValidator("updateStock"), updateStock);
loginRouter.delete('/delete-product-stock/:id',stockValidator("deleteStock"), deleteStock);

module.exports = { router, loginRouter };
