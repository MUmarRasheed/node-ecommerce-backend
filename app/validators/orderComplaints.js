// complaintValidator.js
const { body, query } = require("express-validator");

module.exports = function complaintValidator(api) {
  switch (api) {
    case "fileComplaint":
      return [
        body("firstName")
          .exists().withMessage("firstName is required")
          .notEmpty().withMessage("firstName must not be empty"),
        body("lastName")
          .exists().withMessage("lastName is required")
          .notEmpty().withMessage("lastName must not be empty"),
        body("email")
          .exists().withMessage("email is required")
          .isEmail().withMessage("Invalid email format"),
        body("phoneNumber")
          .exists().withMessage("phoneNumber is required")
          .notEmpty().withMessage("phoneNumber must not be empty"),
        body("dateOfComplaint")
          .exists().withMessage("dateOfComplaint is required")
          .isISO8601().withMessage("dateOfComplaint must be a valid date"),
        body("orderNumber")
          .exists().withMessage("orderNumber is required")
          .notEmpty().withMessage("orderNumber must not be empty"),
        body("natureOfComplaint")
          .exists().withMessage("natureOfComplaint is required")
          .notEmpty().withMessage("natureOfComplaint must not be empty"),
        body("description")
          .exists().withMessage("description is required")
          .notEmpty().withMessage("description must not be empty"),
        body("resolutionSought")
          .exists().withMessage("resolutionSought is required")
          .notEmpty().withMessage("resolutionSought must not be empty"),
        body("productId")
          .exists().withMessage("productId is required")
          .notEmpty().withMessage("productId must not be empty")
          .isMongoId().withMessage("productId must be a valid MongoDB ID")
      ];

    case "getUserComplaints":
      return [
        query("orderNumber")
          .optional()
          .notEmpty().withMessage("orderNumber must not be empty"),
        query("page")
          .optional()
          .isInt({ min: 1 }).withMessage("page must be a positive integer"),
        query("limit")
          .optional()
          .isInt({ min: 1 }).withMessage("limit must be a positive integer")
      ];

    case "getAdminComplaints":
      return [
        query("orderNumber")
          .optional()
          .notEmpty().withMessage("orderNumber must not be empty"),
        query("page")
          .optional()
          .isInt({ min: 1 }).withMessage("page must be a positive integer"),
        query("limit")
          .optional()
          .isInt({ min: 1 }).withMessage("limit must be a positive integer")
      ];

    case "updateComplaint":
      return [
        body("status")
          .exists().withMessage("status is required")
          .notEmpty().withMessage("status must not be empty")
      ];

    case "deleteComplaint":
      return [
        body("complaintId")
          .exists().withMessage("complaintId is required")
          .isMongoId().withMessage("complaintId must be a valid MongoDB ID")
      ];
  }
};
