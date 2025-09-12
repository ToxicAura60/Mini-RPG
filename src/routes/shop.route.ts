import { Router } from "express";
import { buyItem, calculatePrice, getItems } from "../controllers/shop.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

router.post(
  "/buy", 
  [
    body('itemId')
      .notEmpty().withMessage("item ID is required").bail()
      .isInt({ gt: 0 }).withMessage("Item ID must be a positive integer"),
    body("quantity")
      .notEmpty().withMessage("quantity is required").bail()
      .isInt({min: 1}).withMessage("Quantity must be at least 1")
  ],
  authenticateJWT,
  validate,
  buyItem
);

router.get(
  "/list", 
  getItems
);

router.post(
  "/calculate-price", 
  [
    body('itemId')
      .notEmpty().withMessage("item ID is required").bail()
      .isInt({ gt: 0 }).withMessage("Item ID must be a positive integer"),
    body("quantity")
      .notEmpty().withMessage("quantity is required").bail()
      .isInt({min: 1}).withMessage("Quantity must be at least 1")
  ],
  authenticateJWT,
  validate,
  calculatePrice
);


export default router;