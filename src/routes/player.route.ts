import { Router } from "express";
import { equipItem, getPlayerInventory, getPlayerStatistics } from "../controllers/player.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.middleware.js";

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
    body('inventoryId')
      .notEmpty().withMessage("inventoryId is required").bail()
      .isInt({ gt: 0 }).withMessage("inventoryId must be a positive integer")
  ],
  authenticateJWT,
  validate,
  equipItem
);


export default router;