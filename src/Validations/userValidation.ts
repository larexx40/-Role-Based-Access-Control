import { body, ValidationChain } from 'express-validator';

export const signupValidations: ValidationChain[] = [
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email address"),
  body("phoneno").notEmpty().withMessage("Phoneno is required"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage("Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character"),
  body("name").notEmpty().withMessage("Name is required"),
];
