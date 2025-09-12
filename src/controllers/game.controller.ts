import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.js";
import { prisma } from "../lib/prisma.js";

const EXP_PER_LEVEL = 100;

export const playGame = async (req: AuthenticatedRequest, res: Response) => {
  const player = req.player!;

  const score = Math.floor(Math.random() * 101);

  let coinReward = 0;
  let expReward = 0;
  if (score < 50) {
    coinReward = 5;
    expReward = 10;
  } else if (score <= 80) {
    coinReward = 10;
    expReward = 20;
  } else {
    coinReward = 20;
    expReward = 40;
  }

  let newExp = player.exp + expReward;
  let newLevel = player.level;

  while (newExp >= EXP_PER_LEVEL) {
    newExp -= EXP_PER_LEVEL;
    newLevel += 1;
  }

  let updated;
  try {
    [updated] = await prisma.$transaction([
      prisma.player.update({
        where: { id: player.id },
        data: {
          coins: player.coins + coinReward,
          exp: newExp,
          level: newLevel,
        },
      }),
      prisma.gameHistory.create({
        data: {
          playerId: player.id,
          score,
          coinReward,
          expReward,
        },
      }),
    ]);    

  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to update game history or player stats" }],
    });
  }

  let totalScore: number;
  try {
    const aggregate = await prisma.gameHistory.aggregate({
      where: { playerId: player.id },
      _sum: { score: true },
    });
    totalScore = aggregate._sum.score ?? 0;
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to calculate total score" }],
    });
  }

  return res.status(200).json({
    success: true,
    message: "Game played successfully",
    data: {
      score,
      coinReward,
      expReward,
      newCoins: updated.coins,
      newExp: updated.exp,
      newLevel: updated.level,
      totalScore
    },
  });
};


export const getLeaderboard = async (req: Request, res: Response) => {
  let leaderboardData;
  try {
    leaderboardData = await prisma.gameHistory.groupBy({
      by: ["playerId"],
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 10,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to aggregate leaderboard scores" }],
    });
  }
  const playerIds = leaderboardData.map((entry) => entry.playerId);

  let players;
  try {
    players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, username: true, level: true, coins: true },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to fetch player data" }],
    });
  }

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const leaderboard = leaderboardData.map((entry) => ({
    playerId: entry.playerId,
    username: playerMap.get(entry.playerId)?.username ?? "Unknown",
    level: playerMap.get(entry.playerId)?.level ?? 0,
    coins: playerMap.get(entry.playerId)?.coins ?? 0,
    totalScore: entry._sum.score ?? 0,
  }));

  return res.status(200).json({
    success: true,
    data: leaderboard,
  });
};