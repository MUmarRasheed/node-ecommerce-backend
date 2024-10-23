const Shop = require('../models/shops');
const { validationResult } = require('express-validator');
const { sendResponse, generateSlug, getEmailTemplate } = require('../helpers/utalityFunctions');
const messages = require('../messages/customMessages');
const config = require("config");
const sendEmail = require('../helpers/sendEmail');
const User = require('../models/users')

// Create Shop
async function createShop(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(sendResponse(1003, messages[1003], false, errors.array()));
    }

    try {
        // Destructure keys from req.body
        const { ownerName, address, phone, website, name, description, coverImage, logo, location } = req.body;

        const existingShop = await Shop.findOne({ name, ownerId: req.loginUser._id });
        if (existingShop) {
            return res.status(400).json(sendResponse(1093, messages[1093], false));
        }
        const slug = generateSlug(name);
        
        // Check for valid geoLocation
        let geoLocation;
        if (location && location.lat && location.lng) {
            geoLocation = {
                type: 'Point',
                coordinates: [location.lng, location.lat],
                address: location.address,
                zip: location.zip || '',          // Optional zip code
                lat: location.lat,
                lng: location.lng
            };
        } else {
            return res.status(400).json(sendResponse(1000, "Invalid location data", false));
        }

        const newShop = new Shop({
            ownerName,
            ownerId: req.loginUser._id,
            address,
            phone,
            website,
            name,
            slug,
            description,
            coverImage,
            logo,
            ...(geoLocation && { location: geoLocation })
        });
  
        const shop = await newShop.save();
        const userEmailData = { name: ownerName, shopName: name };
        const userEmailHtml = await getEmailTemplate(userEmailData, "shopVerification.hbs", false, false);
        await sendEmail(req.loginUser.email, config.mailEmail, userEmailHtml, userEmailData, "", "Your Shop is In Verification Process", "");

        return res.status(201).json(sendResponse(1060, messages[1060], true, shop));

    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Get All Shops
async function getAllShops(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    let options = {
        page: !req.query.page ? 1 : parseInt(req.query.page),
        limit: !req.query.limit ? config.pageSize : parseInt(req.query.limit),
        sort: { createdAt: -1 },
    };

    let match = { isApproved: true, isActive: true };

    try {
        const result = await Shop.paginate(match, options);
        return res.status(200).json(sendResponse(1064, messages[1064], true, result));
    } catch (err) {
        return res.send(sendResponse(1039, messages[1039], false, err));
    }
}

// Get Pending Shops
async function getPendingShops(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  // Set up pagination options
  const options = {
      page: parseInt(req.query.page) || 1, // Default to page 1
      limit: parseInt(req.query.limit) || config.pageSize, // Default to configured page size
      sort: { createdAt: -1 } // Optional: sort by createdAt or any other field
  };

  try {
      // Use the paginate method to get paginated results
      const result = await Shop.paginate({ isApproved: false }, options);
      return res.status(200).json(sendResponse(1064, messages[1064], true, result));
  } catch (err) {
      return res.status(500).json(sendResponse(1000, messages[1000], false, err.message));
  }
}


// Get Single Shop by ID
async function getShopById(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            return res.status(404).json(sendResponse(1065, messages[1065], false));
        }
        return res.status(200).json(sendResponse(1063, messages[1063], true, shop));
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

// Approve Shop
async function approveShop(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  try {
      // Find the shop first
      const shop = await Shop.findById(req.params.id);
      if (!shop) {
          return res.status(404).json(sendResponse(1065, messages[1065], false));
      }
   // Check if the shop is already approved
   if (shop.isApproved) {
    return res.status(400).json(sendResponse(1097, messages[1097], false)); // Shop already approved
  }
      // Retrieve the owner's user information
      const owner = await User.findById(shop.ownerId); // Assuming ownerId is the userId
      if (!owner || !owner.email) {
          return res.status(404).json(sendResponse(1005, messages[1005], false)); // Handle case where owner is not found or email is missing
      }

      // Update shop approval status
      shop.isApproved = true;
      shop.isActive = true;

      const updatedShop = await shop.save();

      // Prepare and send email notification
      const ownerEmail = owner.email;
      const userEmailData = { name: owner.name, shopName: shop.name }; // Adjust this based on your user model
      const userEmailHtml = await getEmailTemplate(userEmailData, "shopApproval.hbs", false, false);
      
      await sendEmail(ownerEmail, config.mailEmail, userEmailHtml, userEmailData, "", "Your Shop Has Been Approved", "");

      return res.status(200).json(sendResponse(1096, messages[1096], true));
  } catch (error) {
      return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
  }
}

// Update Shop
async function updateShop(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(sendResponse(1003, messages[1003], false, errors.array()));
    }
  
    try {
      const shop = await Shop.findById(req.params.id);
      if (!shop) {
        return res.status(404).json(sendResponse(1065, messages[1065], false));
      }
  
      // Validate and construct geoLocation data
      let geoLocation = null;
      if (req.body.location) {
        const { lat, lng, address, zip } = req.body.location;
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          geoLocation = {
            type: "Point",
            coordinates: [lng, lat],  // Ensure GeoJSON format: [longitude, latitude]
            address: address || "",
            zip: zip || "",
          };
        } else {
          return res.status(400).json(sendResponse(1000, "Invalid location data", false));
        }
      }
  
      // Prepare the update data
      const updateData = { ...req.body };
      if (geoLocation) {
        Object.assign(updateData, { location: geoLocation });
      }
  
      // Update the shop data in the database
      const updatedShop = await Shop.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
  
      return res.status(200).json(sendResponse(1061, messages[1061], true, updatedShop));
    } catch (error) {
      // Catch duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json(sendResponse(1093, messages[1093], false));
      }
      return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
  }

// Delete Shop
async function deleteShop(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    try {
        const shop = await Shop.findOne({_id:req.params.id, ownerId: req.loginUser._id });
        if (!shop) {
            return res.status(404).json(sendResponse(1065, messages[1065], false));
        }

        await Shop.findByIdAndDelete(req.params.id);
        return res.status(200).json(sendResponse(1098, messages[1098], true ));
    } catch (error) {
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

module.exports = {
    createShop,
    getAllShops,
    getPendingShops,
    getShopById,
    approveShop,
    updateShop,
    deleteShop
};
