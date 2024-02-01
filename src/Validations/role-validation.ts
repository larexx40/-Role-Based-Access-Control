import { body, ValidationChain } from 'express-validator';

export const roleValidations: ValidationChain[] = [
  body("name").notEmpty().withMessage("Role name is required").isLength({ max: 10}).withMessage("Role name should not be more than 10 characters"),
  body("permissions").notEmpty().withMessage("Permission(s) is required")
    
];
