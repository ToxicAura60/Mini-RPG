import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/auth.js";
import { prisma } from "../lib/prisma.js";

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      errors: [{ field: "authorization", message: "Authorization header must be in format: Bearer <token>" }]
    });
  }
  
  const token = authHeader.split(" ")[1];
    if (!token || token.trim() === "") {
    return res.status(401).json({
      success: false,
      errors: [{ field: null, message: "Token is missing" }]
    });
  }

  let decoded: { playerId: number; username: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { playerId: number, username: string };
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  let player;
  try {
    player =  await prisma.player.findUnique({
      where: { id: decoded.playerId },
      select: {
        id: true,
        username: true,
        coins: true,
        exp: true,
        level: true,
        createdAt: true,
        attackPower: true,
        defensePower: true,
      },
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      errors: [{ field: null, message: "Something went wrong" }]
    });
  }
  if (!player) {
    return res.status(401).json({ success: false, errors: [{ field: null, message: "Player not found" }] });
  }
  req.player = player;
  next();

 
};
