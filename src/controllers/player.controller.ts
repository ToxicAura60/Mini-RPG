import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../types/auth.js";

export const getPlayerStatistics = async (req: AuthenticatedRequest, res: Response) => {
  const player = req.player!;

  return res.status(200).json({
    success: true,
    data: player,
  });
};

export const getPlayerInventory = async (req: AuthenticatedRequest, res: Response) => {
  const player = req.player!;

  let inventory
  try {
    inventory = await prisma.playerInventory.findMany({
      where: { playerId: player.id },
      select: {
        id: true,
        quantity: true,
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            rarity: true,
            levelRequired: true,
            attackPower: true,
            defensePower: true,
            price: true,
          },
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      errors: [{ field: null, message: "Something went wrong while checking inventory" }]
    });
  }
  return res.status(200).json({
    success: true,
    data: inventory,
  });
};

export const equipItem = async (req: AuthenticatedRequest, res: Response) => {
  const player = req.player!;
  const { itemId } = req.body;

  let inventoryItem
  try {
    inventoryItem = await prisma.playerInventory.findUnique({
      where: { playerId_itemId: { playerId: player.id, itemId } },
      include: { item: true },
    });
  } catch(err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Something went wrong while checking inventory" }],
    });
  }

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      errors: [{ field: "itemId", message: "Item not found in inventory" }],
    });
  }

  const item = inventoryItem.item;

  try {
    await prisma.$transaction([
      prisma.playerInventory.delete({
        where: { id: inventoryItem.id },
      }),
      prisma.player.update({
        where: { id: player.id },
        data: {
            attackPower: player.attackPower + item.attackPower,
            defensePower: player.defensePower + item.defensePower,
          },
        }),
    ]);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to equip item" }],
    });
  }

  return res.status(200).json({
    success: true,
    message: `Equipped ${item.name} successfully!`,
    data: {
      attackPower: player.attackPower + item.attackPower,
      defensePower: player.defensePower + item.defensePower,
    },
  });
};