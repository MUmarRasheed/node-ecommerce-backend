const Shop = require('../models/shops');
const { validationResult } = require('express-validator');
const { sendResponse, generateSlug, getEmailTemplate,convertToObjectId } = require('../helpers/utalityFunctions');
const messages = require('../messages/customMessages');
const config = require("config");
const sendEmail = require('../helpers/sendEmail');
const User = require('../models/users')
const Order = require('../models/order')

// Get All Shops
async function getAllShops(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
    }

    let options = {
        page: !req.query.page ? 1 : parseInt(req.query.page),
        // select: { name: 1, email: 1, shopStatus: 1 },
        limit: !req.query.limit ? config.pageSize : parseInt(req.query.limit),
        sort: { createdAt: -1 },
    };

    let match = {};

    try {
        const result = await Shop.paginate(match, options);
        return res.status(200).json(sendResponse(1064, messages[1064], true, result));
    } catch (err) {
        return res.send(sendResponse(1039, messages[1039], false, err));
    }
}

async function getAdminShop(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  const adminId = convertToObjectId(req.loginUser._id);
  console.log("Admin ID:", req.loginUser._id);
  console.log("Converted Admin ID:", adminId);

  try {
      // Find the documents with the specified query, limit, and skip for pagination
      const result = await Shop.findOne( { ownerId: adminId })
      console.log("Query Result:", result); // Log the result for debugging
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
async function approveOrDisapproveShop(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).send(sendResponse(1003, messages[1003], false, errors.errors));
  }

  const { action, reason } = req.body; // Expecting { action: 'approve' } or { action: 'disapprove' }

  try {
    
      // Find the shop first
      const shop = await Shop.findById(req.params.id);
      if (!shop) {
          return res.status(404).json(sendResponse(1065, messages[1065], false));
      }
  
      // Find the user associated with the shop's ownerId
      const owner = await User.findById(shop.ownerId);
      if (!owner) {
          return res.status(404).json(sendResponse(1066, "Owner not found", false));
      }

      // Check if the shop is associated with a user role and if the email is verified
      if (shop.ownerId && owner.role === 2 && !owner.isEmailVerified) {
          return res.status(403).send(sendResponse(1050, messages[1050], false, false)); // Inform about unverified user
      }

      if (action === 'approve') {

          shop.isActive = true;
          shop.isApproved = true; // Set isApproved to true
          owner.shopStatus = true; // Set shopStatus to true for the owner

          await Promise.all([shop.save(), owner.save()]); // Save both shop and owner

          const agencyUserEmail = owner.email;
          const emailData = {
              name: shop.name,
              agencyEmail: owner.email,
              agencyUrl: `${config.agencyUrl}login`, // Unique login URL
          };

          const emailHtml = await getEmailTemplate(emailData, "agencyRegistration.hbs", false, false);
          await sendEmail(agencyUserEmail, config.mailEmail, emailHtml, emailData, "", "Your Shop Has Been Approved", "");
          return res.status(200).json(sendResponse(1096, messages[1096], true));
      } 
      else if (action === 'disapprove') {
          shop.isActive = false;
          shop.isApproved = false; // Set isApproved to false
          owner.shopStatus = false; // Set shopStatus to false for the owner

          await Promise.all([shop.save(), owner.save()]); // Save both shop and owner

          // Prepare and send disapproval email notification
          const agencyUserEmail = owner.email;
          const emailData = {
              name: shop.name,
              agencyEmail: owner.email,
              reason: reason
          };

          const emailHtml = await getEmailTemplate(emailData, "disapproveShop.hbs", false, false);
          await sendEmail(agencyUserEmail, config.mailEmail, emailHtml, emailData, "", "Your Shop Has Been Disapproved", "");

          return res.status(200).json(sendResponse(1099, "Your shop has been disapproved.", true));
      } else {
          return res.status(400).json(sendResponse(1004, "Invalid action specified.", false));
      }
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
        // Find the shop by ID and check ownership
        const shop = await Shop.findOne({ _id: req.params.id, ownerId: req.loginUser._id });
        if (!shop) {
            return res.status(404).json(sendResponse(1065, messages[1065], false));
        }

        // Check if there are any non-completed orders for this shop
        const pendingOrders = await Order.find({ shopId: req.params.id, orderStatus: { $ne: "completed" } });
        if (pendingOrders.length > 0) {
            return res.status(400).json(sendResponse(1066, "Cannot delete shop with pending orders.", false));
        }

        // Delete the shop if there are no non-completed orders
        await Shop.findByIdAndDelete(req.params.id);
        await User.findByIdAndDelete(req.params.id);

        return res.status(200).json(sendResponse(1098, messages[1098], true));
    } catch (error) {
        console.error("Error deleting shop:", error);
        return res.status(500).json(sendResponse(1000, messages[1000], false, error.message));
    }
}

module.exports = {
    getAllShops,
    getShopById,
    approveOrDisapproveShop,
    updateShop,
    deleteShop,
    getAdminShop
};
