import { Router } from "express";
import { getLeaderboard, playGame } from "../controllers/game.controller.js";
import { authenticateJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/play",
  authenticateJWT,
  playGame
)

router.get(
  "/leaderboard",
  getLeaderboard
)


export default router;