import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { body } from "express-validator";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

router.post(
  "/register",
  [
    body('username').notEmpty().withMessage("username is required"),
    body("password").isLength({ min: 8}).withMessage("password must be at least 8 characters")
  ],
  validate,
  register,
)

router.post(
  "/login",
  [
    body('username').notEmpty().withMessage("username is required"),
    body("password").notEmpty().withMessage("password is required")
  ],
  validate,
  login,
)

export default router;