const { validationResult } = require('express-validator');
const Complaint = require('../models/orderComplaints');
const Product = require('../models/products');
const User = require('../models/users'); // Ensure the path is correct
const config = require('config')

const { sendResponse,getEmailTemplate } = require('../helpers/utalityFunctions');
const messages = require("../messages/customMessages");
const sendEmail    = require("../helpers/sendEmail");
const Order = require('../models/order'); // Assuming you have an Order model for saving order records


// https://www.jotform.com/form-templates/customer-complaint-form

// File a complaint
const fileComplaint = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
    }

    try {
        const {
            firstName,
            lastName,
            email,
            phoneNumber,
            dateOfComplaint,
            orderNumber,
            natureOfComplaint,
            priority,
            description,
            resolutionSought,
            proofOfPurchase,
            supportingDocuments,
            productId // Capture product ID
        } = req.body;

        const userId = req.loginUser._id;

        // Get the email of the user who filed the complaint
        const user = await User.findById(userId).select('email');
        if (!user) {
            return res.status(404).send(sendResponse(1005, messages[1005], false));
        }

        // Check if a complaint has already been submitted for this order and product by the user
        const existingComplaint = await Complaint.findOne({ orderNumber, productId, userId });
        if (existingComplaint) {
            return res.status(400).send(sendResponse(1121, messages[1121], false));
        }

        // Check if the order exists and belongs to the user
        const order = await Order.findOne({ orderNumber, userId });
        if (!order) {
            return res.status(404).send(sendResponse(1090, messages[1090], false));
        }

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send(sendResponse(2015, messages[2015], false));
        }


        // Create a new complaint instance
        const complaint = new Complaint({
            firstName,
            lastName,
            email,
            phoneNumber,
            dateOfComplaint,
            orderNumber,
            natureOfComplaint,
            description,
            resolutionSought,
            proofOfPurchase,
            supportingDocuments,
            userId,
            priority: priority || 'medium',
            productId // Store productId with the complaint
        });

        await complaint.save();

        // Get the product owner's email
        const productOwnerId = product.userId; // Assuming userId in Product refers to the owner
        const productOwner = await User.findById(productOwnerId).select('email');
        if (!productOwner) {
            return res.status(404).send(sendResponse(1005, messages[1005], false));
        }

        // Prepare email data for the product owner
        const ownerEmailData = {
            productName: product.name,
            name: firstName,
            firstName,
            lastName,
            email,
            phoneNumber,
            dateOfComplaint,
            complaint: {
                ...complaint.toObject(), // Pass complaint as an object for better property access in template
            }
        };

        // Render and send email to the product owner
        const ownerEmailHtml = await getEmailTemplate(ownerEmailData, "complaintNotification.hbs", false, false);
        await sendEmail(productOwner.email, config.mailEmail, ownerEmailHtml, ownerEmailData, "", "New Complaint Filed", "");

        // Prepare email data for the user
        const userEmailData = {
            name: firstName,
            orderNumber,
        };

        // Render and send confirmation email to user
        const userEmailHtml = await getEmailTemplate(userEmailData, "complainConfirmationUser.hbs", false, false);
        await sendEmail(user.email, config.mailEmail, userEmailHtml, userEmailData, "", "Complaint Submission Confirmation", "");

        return res.status(200).send(sendResponse(1116, messages[1116], true));
    } catch (error) {
        console.error("🚀 ~ fileComplaint ~ error:", error);
        return res.status(500).send(sendResponse(1000, messages[1000], false, error.message));
    }
};


// Get complaints for a user or specific order
const getUserComplaints = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
    }

    try {
        const { orderNumber } = req.query;
        const userId = req.loginUser._id;

        const complaintsQuery = { userId };

        if (orderNumber) {
            complaintsQuery.orderNumber = orderNumber; // Add filter for order number if provided
        }

        // Set up pagination options
        const options = {
            page: parseInt(req.query.page) || 1, // Default to page 1
            limit: parseInt(req.query.limit) || config.pageSize, // Default to configured page size
            sort: { createdAt: -1 }, // Optional: sort by createdAt or any other field
        };

        // Use the paginate method to get paginated results
        const complaints = await Complaint.paginate(complaintsQuery, options);

        if (!complaints.docs.length) {
            return res.status(404).send(sendResponse(1114, messages[1114], false));
        }

        return res.status(200).send(sendResponse(1119, messages[1119], true, complaints));
    } catch (error) {
        console.error("🚀 ~ getComplaints ~ error:", error);
        return res.status(500).send(sendResponse(1089, messages[1089], false, error.message));
    }
};

const getAdminComplaints = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
    }

    try {
        const { orderNumber } = req.query;

        const complaintsQuery = { };

        if (orderNumber) {
            complaintsQuery.orderNumber = orderNumber; // Add filter for order number if provided
        }

        // Set up pagination options
        const options = {
            page: parseInt(req.query.page) || 1, // Default to page 1
            limit: parseInt(req.query.limit) || config.pageSize, // Default to configured page size
            sort: { createdAt: -1 }, // Optional: sort by createdAt or any other field
        };

        // Use the paginate method to get paginated results
        const complaints = await Complaint.paginate(complaintsQuery, options);

        if (!complaints.docs.length) {
            return res.status(404).send(sendResponse(1114, messages[1114], false));
        }

        return res.status(200).send(sendResponse(1119, messages[1119], true, complaints));
    } catch (error) {
        console.error("🚀 ~ getComplaints ~ error:", error);
        return res.status(500).send(sendResponse(1115, messages[1115], false, error.message));
    }
};

// Update complaint status (admin use)
const updateComplaintStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(sendResponse(1003, messages[1003], false, errors.array()));
        }
        const { complaintId } = req.params;
        const { status, resolutionSummary } = req.body;

        // Retrieve complaint to check current status
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).send(sendResponse(1114, messages[1114], false));
        }

        // If complaint is already resolved, return a message
        if (complaint.status === 'resolved') {
            return res.status(400).send(sendResponse(1120, messages[1120], false));
        }

        const product = await Product.findById(complaint.productId);
        if (!complaint) {
            return res.status(404).send(sendResponse(1114, messages[1114], false));
        }
        // Update complaint status and resolution summary
        complaint.status = status;
        complaint.resolutionSummary = resolutionSummary;
        await complaint.save();


        // Prepare data for email
        const userEmailData = {
            name: complaint.firstName, 
            orderNumber: complaint.orderNumber,
            productName: product.name,
            resolutionSummary,
            status: complaint.status,
        };

        // Render and send confirmation email to user
        const userEmailHtml = await getEmailTemplate(userEmailData, "complaintStatus.hbs", false, false);
        await sendEmail(complaint.email, config.mailEmail, userEmailHtml, userEmailData, "", "Complaint Status Info", "");

        return res.status(200).send(sendResponse(1117, messages[1117], true));
    } catch (error) {
        console.error("🚀 ~ updateComplaintStatus ~ error:", error);
        return res.status(500).send(sendResponse(1089, messages[1089], false, error.message));
    }
};

// Delete a complaint
const deleteComplaint = async (req, res) => {
    try {
        const { complaintId } = req.params;
        const userId = req.loginUser._id;

        const complaint = await Complaint.findOne({ _id: complaintId, userId });
        if (!complaint) {
            return res.status(404).send(sendResponse(1114, messages[1114], false));
        }

        await Complaint.deleteOne({ _id: complaintId });

        return res.status(200).send(sendResponse(1118, messages[1118], true));
    } catch (error) {
        console.error("🚀 ~ deleteComplaint ~ error:", error);
        return res.status(500).send(sendResponse(1089, messages[1089], false, error.message));
    }
};

module.exports = {
    fileComplaint,
    getUserComplaints,
    getAdminComplaints,
    updateComplaintStatus,
    deleteComplaint
};
