import { Router } from "express";
import { equipItem, getPlayerInventory, getPlayerStatistics } from "../controllers/player.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { body } from "express-validator";

const router = Router();

router.get(
  "/statistics", 
  authenticateJWT,
  getPlayerStatistics
);


router.get(
  "/inventory", 
  authenticateJWT,
  getPlayerInventory
);

router.post(
  "/equip-item", 
  [
    body('itemId')
      .notEmpty().withMessage("item ID is required").bail()
      .isInt({ gt: 0 }).withMessage("Item ID must be a positive integer")
  ],
  authenticateJWT,
  equipItem
);


export default router;