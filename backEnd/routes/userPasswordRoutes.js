const express = require("express");
const { body, param } = require("express-validator");

const userPasswordController = require(
    "../controllers/userPasswordController"
);

const router = express.Router();

const userIdParamValidation = [
    param("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a positive integer")
];

const passwordRecordValidation = [
    body("isActive")
        .isInt({ min: 0, max: 1 })
        .withMessage("Active flag must be 0 or 1"),

    body("newPassword")
        .optional({ values: "falsy" })
        .isLength({ min: 8, max: 128 })
        .withMessage("New password must be 8-128 characters")
];

router.get(
    "/",
    userPasswordController.getAllUserPasswords
);

router.put(
    "/:userId",
    userIdParamValidation,
    passwordRecordValidation,
    userPasswordController.updateUserPassword
);

module.exports = router;
