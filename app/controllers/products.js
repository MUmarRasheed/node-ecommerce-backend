const Product = require('../models/products');
const Stock = require('../models/productStocks'); // Import the Stock model
const { validationResult } = require('express-validator');
const { sendResponse, generateSlug , convertToObjectId , convertToMultipleObjectIds } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");
const ProductCategory = require('../models/productCategories'); // Import the ProductCategory model
const config = require('config')
const Shops = require('../models/shops')

// Create a Product
async function addProduct(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
        }

        const {
            name, 
            description, 
            image, 
            productImages, 
            tag,
            stocks,
            categoryId,
            subcategoryId,
            unit,
            shopId
        } = req.body;

        // Validate if category exists
        const validCategory = await ProductCategory.findById(categoryId);
        if (!validCategory) {
            return res.status(400).send(sendResponse(2003, messages[2003], false));
        }

        // Check if the shop exists and is active and approved
        const shop = await Shops.findById(shopId);
        if (!shop) {
            return res.status(404).json(sendResponse(1065, messages[1065], false));
        }
        if (!shop.isActive || !shop.isApproved) {
         return res.status(400).send(sendResponse(1095, messages[1095], false)); // Custom error code for inactive or unapproved shops
        }

        // Check if the product already exists in the shop
        const existingProduct = await Product.findOne({ 
            name, 
            shopId,
            categoryId,
            subcategoryId
        });

        if (existingProduct) {
            return res.status(400).send(sendResponse(1066, messages[1066], false));
        }

        // Generate slug for the product name
        const slug = generateSlug(name);
        console.log("🚀 ~ addProduct ~ slug:", slug);
        
        // Process tags to generate slugs for each tag
        const processedTags = tag.map(t => ({
            ...t,
            slug: generateSlug(t.name) // Generate slug from tag name
        }));

        // Create a new product object
        const newProductData = {
            name,
            slug, 
            description,
            image,
            productImages,
            tag: processedTags, 
            unit,
            categoryId,
            subcategoryId,
            shopId
        };

        // Create and save the product
        const newProduct = new Product(newProductData);
        const savedProduct = await newProduct.save();

        // Create Stocks if provided
        if (stocks && stocks.length > 0) {
            for (const stockData of stocks) {
                const newStock = new Stock({
                    ...stockData,
                    productId: savedProduct._id // Save the product ID in stock
                });
                const savedStock = await newStock.save();
                savedProduct.stockIds.push(savedStock._id); // Add stock ID to product
            }
            await savedProduct.save(); // Save the updated product with stock IDs
        }

        // Return success response with the created product
        return res.status(201).send(sendResponse(2010, messages[2010], savedProduct));

    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}



async function updateProduct(req, res) {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
        }

        const { categoryId, stocks, tag, shopId, subcategoryId } = req.body;

        // Find the product by ID and check if it belongs to the same shop
        const product = await Product.findOne({ _id: req.params.id, shopId });
        console.log("🚀 ~ updateProduct ~ product:", product);
        if (!product) {
            return res.status(404).send(sendResponse(2003, messages[2003], false));
        }

        // Validate if the category exists
        if (categoryId) {
            const validCategory = await ProductCategory.findById(categoryId);
            if (!validCategory) {
                return res.status(400).send(sendResponse(2003, messages[2003], false));
            }
        }

        // If tags are provided, generate slug for each tag
        if (tag && tag.length > 0) {
            const processedTags = tag.map(t => ({
                name: t.name,  // Keep the original name
                slug: generateSlug(t.name)  // Generate slug from tag name
            }));
            console.log("🚀 ~ processedTags ~ processedTags:", processedTags);
            product.tag = processedTags; // Update the product's tags with slugs
            console.log("🚀 ~ updateProduct ~ product.tag:", product.tag);
        }

        // Update product fields (excluding stocks for now)
        Object.assign(product, req.body); // This must come after processing the tags

        // Check stocks if provided
        if (stocks && stocks.length > 0) {
            product.stockIds = []; // Reset stock IDs array

            // Update or create stocks without checking for existing ones
            for (const stockData of stocks) {
                const stockUpdate = {
                title: stockData.title,
                price: stockData.price,
                salePrice: stockData.salePrice,
                minPrice: stockData.minPrice,
                maxPrice: stockData.maxPrice,
                quantity: stockData.quantity,
                sku: stockData.sku,
                options: stockData.options,
                unit: stockData.unit,
                isDisable: stockData.isDisable // Keep options as is
                };
                console.log("🚀 ~ updateProduct ~ stockUpdate:", stockUpdate);

                // Update existing stock if it exists, or create a new one
                const existingStock = await Stock.findOne({ title: stockData.title, productId: product._id });
                console.log("🚀 ~ updateProduct ~ existingStock:", existingStock);

                if (existingStock) {
                    // Update existing stock details
                    Object.assign(existingStock, stockUpdate);
                    await existingStock.save();
                    product.stockIds.push(existingStock._id); // Add updated stock ID
                } else {
                    // Create new stock and link to product
                    const newStock = new Stock({
                        ...stockUpdate,
                        productId: product._id // Save the product ID in stock
                    });
                    const savedStock = await newStock.save();
                    product.stockIds.push(savedStock._id); // Add new stock ID
                }
            }
        }

        // Save the updated product
        const updatedProduct = await product.save();

        return res.status(200).send(sendResponse(2013, messages[2013], true, updatedProduct));

    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Get All Products with Pagination
const getAllProducts = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    let page = !req.query.page ? 1 : parseInt(req.query.page);
    let limit = !req.query.limit ? config.pageSize : parseInt(req.query.limit);
    let skip = (page - 1) * limit;

    let match = {}; // You can add filters here if necessary

    try {
        // Use a single aggregation with $facet for pagination and counting
        const result = await Product.aggregate([
            { $match: match }, // Match any specific filters if necessary
            {
                $lookup: {
                    from: 'stocks', // The collection name for stocks
                    localField: 'stockIds', // Field in products to match
                    foreignField: '_id', // Field in stocks to match
                    as: 'stockDetails' // The resulting field with stock data
                }
            },
            {
                // Filter out products that have no stock available
                $match: {
                    stockDetails: { $ne: [] } // Include only products with stock details
                }
            },
            {
                $facet: {
                    products: [
                        { $sort: { createdAt: -1 } }, // Sort by creation date
                        { $skip: skip }, // Pagination: skip the previous pages
                        { $limit: limit }, // Limit the number of results
                        {
                            // Project only necessary fields for both products and stocks
                            $project: {
                                name: 1,
                                slug: 1,
                                description: 1,
                                image: 1,
                                productImages: 1,
                                unit: 1,
                                tag: 1,
                                ordersCount: 1,
                                stockDetails: {
                                    _id: 1,
                                    price: 1,
                                    salePrice: 1,
                                    quantity: 1,
                                    title: 1,
                                    unit: 1 // Assuming you have a 'unit' field in stocks
                                }
                            }
                        }
                    ],
                    totalCount: [
                        { $count: 'total' } // Count the total number of products with stock
                    ]
                }
            }
        ]);

        const totalDocs = result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

        const response = {
            docs: result[0].products,
            totalDocs: totalDocs,
            limit: limit,
            page: page,
            totalPages: Math.ceil(totalDocs / limit)
        };

        return res.status(200).json(sendResponse(2011, messages[2011], true, response));
    } catch (err) {
        console.error("Error fetching products with stocks:", err);
        return res.status(500).send(sendResponse(1000, messages[1000], false, err.message));
    }
};


// Get Single Product by ID
async function getProductById(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        // Populate 'stockIds' but rename the field to 'stockDetails'
        const product = await Product.findById(req.params.id)
            .populate({
                path: 'stockIds',
                as: 'stockDetails'  // Alias stockIds to stockDetails
            });

        if (!product) {
            return res.status(404).send(sendResponse(2015, messages[2015], false));
        }

        // Transform the response object if necessary
        const productWithRenamedField = {
            ...product.toObject(),
            stockDetails: product.stockIds,  // Assign stockIds to stockDetails
        };
        delete productWithRenamedField.stockIds;  // Optionally remove stockIds if no longer needed

        return res.status(200).send(sendResponse(2011, messages[2011], true, productWithRenamedField));
    } catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}


// Delete a Product
async function deleteProduct(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }
    try {
        // Find the product by ID
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send(sendResponse(2015, messages[2015], false));
        }

        // Check if there are stocks associated with the product and delete them
        if (product.stockIds.length > 0) {
            const deleteResult = await Stock.deleteMany({ _id: { $in: product.stockIds } });
            if (deleteResult.deletedCount === 0) {
                console.warn("No stocks were deleted, they might not exist.");
            }
        }

        // Delete the product using findByIdAndDelete for cleaner code
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).send(sendResponse(2015, messages[2015], false));
        }

        // Send success response
        return res.status(200).send(sendResponse(2014, messages[2014], true));

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
}


async function searchProducts(req, res) {
    const {
        categoryIds, // Expecting a comma-separated list of category IDs
        subcategoryIds,
        shopId,
        newArrival, // Boolean for new arrivals
        mostOrdered, // Boolean for most ordered
        sortByPrice, // New parameter for sorting by price (lowest/highest)
        page = 1, // Pagination page number
        limit = 10 // Pagination limit
    } = req.query;

    try {
        // Create match criteria for products
        const matchCriteria = {};

        // Handle multiple category IDs
        if (categoryIds) {
            const categoryIdsArray = convertToMultipleObjectIds(categoryIds.split(',').map(id => id.trim()));
            matchCriteria.categoryId = { $in: categoryIdsArray }; // Set category IDs for filtering
        }

        // Handle multiple subcategory IDs
        if (subcategoryIds) {
            const subcategoryIdsArray = convertToMultipleObjectIds(subcategoryIds.split(',').map(id => id.trim()));
            matchCriteria.subcategoryId = { $in: subcategoryIdsArray }; // Set subcategory IDs for filtering
        }

        // Filter by shop ID
        if (shopId) {
            matchCriteria.shopId = convertToObjectId(shopId);
        }

        // Filter for new arrivals
        if (newArrival) {
            const thirtyDaysAgo = new Date().getTime() - 5 * 24 * 60 * 60 * 1000;
            matchCriteria.createdAt = { $gte: thirtyDaysAgo }; // Products created within the last 5 days
        }


        // Count total matching products (before pagination)
        const totalCount = await Product.countDocuments(matchCriteria);

        // Aggregate query
        const products = await Product.aggregate([
            { $match: matchCriteria }, // Match products based on the defined criteria
            {
                $lookup: {
                    from: 'stocks', // The name of the stocks collection
                    localField: 'stockIds', // Field from the Product collection
                    foreignField: '_id', // Field from the Stock collection
                    as: 'stocks' // Output array field
                }
            },
            {
                $addFields: {
                    // Calculate min and max prices considering sale prices first
                    minPrice: {
                        $min: {
                            $map: {
                                input: '$stocks',
                                as: 'stock',
                                in: {
                                    $cond: [
                                        { $gt: ['$$stock.salePrice', 0] }, // Check if salePrice exists
                                        '$$stock.salePrice', // Use salePrice if exists
                                        '$$stock.price' // Otherwise use price
                                    ]
                                }
                            }
                        }
                    },
                    maxPrice: {
                        $max: {
                            $map: {
                                input: '$stocks',
                                as: 'stock',
                                in: {
                                    $cond: [
                                        { $gt: ['$$stock.salePrice', 0] }, // Check if salePrice exists
                                        '$$stock.salePrice', // Use salePrice if exists
                                        '$$stock.price' // Otherwise use price
                                    ]
                                }
                            }
                        }
                    },
                    // Similar logic for saleMinPrice and saleMaxPrice
                    saleMinPrice: {
                        $min: { $map: { input: '$stocks', as: 'stock', in: '$$stock.salePrice' } }
                    },
                    saleMaxPrice: {
                        $max: { $map: { input: '$stocks', as: 'stock', in: '$$stock.salePrice' } }
                    }
                }
            },
            {
                // Updated sort criteria to handle sorting by price
                $sort: {
                    ...(mostOrdered ? { ordersCount: -1 } : {}),
                    ...(sortByPrice === 'lowest' ? { minPrice: 1 } : {}),
                    ...(sortByPrice === 'highest' ? { maxPrice: -1 } : {}),
                    ...(!mostOrdered && !sortByPrice ? { createdAt: -1 } : {})
                }
            },
            {
                $skip: (page - 1) * limit // Pagination skip
            },
            {
                $limit: Number(limit) // Pagination limit
            },
            {
                $project: {
                    name: 1,
                    image: 1,
                    productImages: 1,
                    // stockIds: 1,
                    unit: 1,
                    salePrice: { $arrayElemAt: ['$stocks.salePrice', 0] }, // Getting the first sale price
                    minPrice: 1, // Include the calculated min price
                    maxPrice: 1, // Include the calculated max price
                    saleMinPrice: 1, // Include the calculated sale min price
                    saleMaxPrice: 1, // Include the calculated sale max price
                    ordersCount: 1,
                    unit: { $arrayElemAt: ['$stocks.unit', 0] }, // Getting the first stock unit
                    createdAt: 1,
                    stocks: { // Include stock details
                        $map: {
                            input: '$stocks',
                            as: 'stockDetails',
                            in: {
                                title: '$$stockDetails.title',
                                quantity:'$$stockDetails.quantity',
                                price: '$$stockDetails.price',
                                salePrice: '$$stockDetails.salePrice',
                                unit: '$$stockDetails.unit',
                                // Include other stock fields as necessary
                            }
                        }
                    }
                    // Include other necessary fields
                }
            }
        ]);

        // Return the paginated products
        return res.status(200).send({
            success: true,
            data: products,
            page, // Current page
            limit, // Limit
            totalDocs: totalCount, // Total documents that match criteria
            totalPages: Math.ceil(totalCount / limit), // Total pages
        });
    } catch (error) {
        console.error("Error searching products:", error);
        return res.status(500).send({
            success: false,
            message: "An error occurred while searching for products.",
            error: error.message,
        });
    }
}

module.exports = {
addProduct,
getProductById,
getAllProducts,
updateProduct,
deleteProduct,
searchProducts
}

