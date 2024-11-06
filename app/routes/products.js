const express           = require("express");
const loginRouter       = express.Router();
const router            = express.Router()
/*  IMPORT Validators */

const productValidator = require('../validators/products')

/*  IMPORT CONTROLLERS */

const productController       = require("../controllers/products");


// Create a Product
loginRouter.post('/add-product', productValidator('addProduct'), productController.addProduct);

// Get All Products
router.get('/get-products', productController.getAllProducts);
loginRouter.get('/get-admin-products', productController.getAdminProducts);

router.get('/search-product', productController.searchProducts);

// Get Single Product
router.get('/get-product-by-id/:id', productController.getProductById);

// Update a Product
loginRouter.put('/update-product/:id',productController.updateProduct);

// Delete a Product
loginRouter.delete('/delete-product/:id', productController.deleteProduct);

module.exports = { loginRouter, router }