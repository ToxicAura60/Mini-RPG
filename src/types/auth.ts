import type { Request } from "express";
import type { Player } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  player?: Omit<Player, "password">;
}