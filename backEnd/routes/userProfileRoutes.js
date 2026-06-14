const express = require("express");
const { body, param } = require("express-validator");

const userProfileController = require(
    "../controllers/userProfileController"
);

const router = express.Router();

const userIdParamValidation = [
    param("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a positive integer")
];

const userProfileValidation = [
    body("userName")
        .trim()
        .notEmpty()
        .withMessage("User name is required")
        .isLength({ max: 100 })
        .withMessage("User name must be 100 characters or fewer"),

    body("loginId")
        .trim()
        .notEmpty()
        .withMessage("Login ID is required")
        .isLength({ min: 3, max: 50 })
        .withMessage("Login ID must be 3-50 characters")
        .matches(/^[a-zA-Z0-9._@-]+$/)
        .withMessage("Login ID contains invalid characters"),

    body("emailAddress")
        .trim()
        .isEmail()
        .withMessage("Valid email address is required")
        .isLength({ max: 255 })
        .withMessage("Email address must be 255 characters or fewer"),

    body("mobileNo")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 30 })
        .withMessage("Mobile number must be 30 characters or fewer")
        .matches(/^[0-9+()\-\s]*$/)
        .withMessage("Mobile number contains invalid characters"),

    body("userStatus")
        .trim()
        .isIn(["ACTIVE", "INACTIVE", "LOCKED"])
        .withMessage("User status must be ACTIVE, INACTIVE, or LOCKED")
];

router.get(
    "/",
    userProfileController.getAllUsers
);

router.post(
    "/",
    userProfileValidation,
    userProfileController.createUser
);

router.put(
    "/:userId",
    userIdParamValidation,
    userProfileValidation,
    userProfileController.updateUser
);

router.delete(
    "/:userId",
    userIdParamValidation,
    userProfileController.deleteUser
);

module.exports = router;
