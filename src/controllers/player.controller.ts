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
  const { inventoryId } = req.body;

  let inventoryItem;
  try {
    inventoryItem = await prisma.playerInventory.findUnique({
      where: { id: inventoryId },
      include: { item: true },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Something went wrong while checking inventory" }],
    });
  }

  if (!inventoryItem || inventoryItem.playerId !== player.id || inventoryItem.quantity < 1) {
    return res.status(404).json({
      success: false,
      errors: [{ field: "inventoryId", message: "Item not found in inventory" }],
    });
  }

  const item = inventoryItem.item;

  let newAttack = player.attackPower;
  let newDefense = player.defensePower;

  try {
    await prisma.$transaction(async (tx) => {
      const existingEquip = await tx.equippedItem.findUnique({
        where: {
          playerId_slot: {
            playerId: player.id,
            slot: item.type,
          },
        },
        include: { item: true },
      });

      if (existingEquip) {
        newAttack -= existingEquip.item.attackPower;
        newDefense -= existingEquip.item.defensePower;

        await tx.equippedItem.delete({ where: { id: existingEquip.id } });
      }

      newAttack += item.attackPower;
      newDefense += item.defensePower;

      await tx.equippedItem.create({
        data: {
          playerId: player.id,
          itemId: item.id,
          slot: item.type,
        },
      });

      if (inventoryItem.quantity === 1) {
        await tx.playerInventory.delete({ where: { id: inventoryItem.id } });
      } else {
        await tx.playerInventory.update({
          where: { id: inventoryItem.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      await tx.player.update({
        where: { id: player.id },
        data: {
          attackPower: newAttack,
          defensePower: newDefense,
        },
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to equip item" }],
    });
  }

  return res.status(200).json({
    success: true,
    message: `Equipped ${item.name} successfully!`,
    data: {
      attackPower: newAttack,
      defensePower: newDefense,
    },
  });
};