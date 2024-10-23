const { body, param } = require("express-validator");

module.exports = function addressValidator(api) {
    switch (api) {
        case "addAddress":
            return [
                body("title").exists().withMessage("Title is required"),
                body("default").optional().isBoolean().withMessage("Default must be a boolean"),
                body("address").exists().withMessage("Address is required"),
            ];
        case "updateAddress":
            return [
                body("addressId").exists().withMessage("Address ID is required"),
                body("title").optional(),
                body("default").optional().isBoolean().withMessage("Default must be a boolean"),
                body("address").optional(),
            ];
        case "deleteAddress":
            return [
                param("addressId").exists().withMessage("Address ID is required"),
            ];
        default:
            return [];
    }
};
