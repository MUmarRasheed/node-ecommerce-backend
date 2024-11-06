// routes/complaint.routes.js

const express = require('express');
const { 
    fileComplaint, 
    updateComplaintStatus, 
    deleteComplaint, 
    getUserComplaints, 
    getAdminComplaints 
} = require('../controllers/orderComplaints');

const loginRouter = express.Router();
const complaintValidator = require('../validators/orderComplaints'); // Ensure correct path

// Submit a complaint with validation
loginRouter.post('/submit-complaint', complaintValidator("fileComplaint"), fileComplaint); 

// Get all complaints for user 
loginRouter.get('/get-user-complaints',complaintValidator("getUserComplaints"), getUserComplaints);     

// Get all complaints for admin
loginRouter.get('/get-admin-complaints',complaintValidator("getAdminComplaints"),getAdminComplaints);     

// Update complaint status (admin use) with validation
loginRouter.put('/update-complaint-status/:complaintId', complaintValidator("updateComplaint"), updateComplaintStatus);

// Delete a complaint
loginRouter.delete('/delete-complaint/:complaintId',complaintValidator("deleteComplaint"), deleteComplaint);

module.exports = { loginRouter };
