import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/auth.js";
import { prisma } from "../lib/prisma.js";


export const buyItem = async (req: AuthenticatedRequest, res: Response) => {
  const { itemId, quantity } = req.body;

  const player = req.player!;

  const rarityLimit = {
    common: parseInt(process.env.RARITY_LIMIT_COMMON ?? "10"),
    rare: parseInt(process.env.RARITY_LIMIT_RARE ?? "5"),
    epic: parseInt(process.env.RARITY_LIMIT_EPIC ?? "3"),
    legendary: parseInt(process.env.RARITY_LIMIT_LEGENDARY ?? "1"),
  };

  const rarityMultiplier = {
    common: parseInt(process.env.RARITY_MULTIPLIER_COMMON ?? "1"),
    rare: parseInt(process.env.RARITY_MULTIPLIER_RARE ?? "2"),
    epic: parseInt(process.env.RARITY_MULTIPLIER_EPIC ?? "3"),
    legendary: parseInt(process.env.RARITY_MULTIPLIER_LEGENDARY ?? "5"),
  };

  let item;
  try {
    item = await prisma.item.findUnique({ where: { id: itemId } });
  } catch(err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to retrieve item from database."}],
    });
  }

  if (!item) {
    return res.status(404).json({ 
      success: false, 
      errors: [{ field: "itemId", message: "Item not found" }]
    });
  };

  if (player.level < item.levelRequired) {
    return res.status(400).json({
      success: false,
      errors: [{ field: null, message: `Level ${item.levelRequired} required to buy this item`}]
    });
  }

  let totalSameRarity;
  try {
    totalSameRarity = await prisma.playerInventory.aggregate({
      where: {
        playerId: player.id,
        item: { rarity: item.rarity },
      },
      _sum: { quantity: true },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to calculate total items of this rarity."}],
    });
  }
  const currentRarityQuantity = totalSameRarity._sum.quantity ?? 0;
  const limit = rarityLimit[item.rarity];

  if (currentRarityQuantity + quantity > limit) {
    return res.status(400).json({
      success: false,
      errors: [{
        field: "quantity",
        message: `Cannot purchase more than ${limit} ${item.rarity} item(s) in total. You already have ${currentRarityQuantity}.`,
      }],
    });
  }

  const multiplier = rarityMultiplier[item.rarity];
  
  let totalPrice = 0;
  for(let i = currentRarityQuantity; i <= currentRarityQuantity + quantity - 1; i++) {
      totalPrice += item.price * Math.pow(multiplier, i);
  }


  if (player.coins < totalPrice) {
    return res.status(400).json({
      success: false,
      errors: [{ field: null, message: "Not enough coins" }],
    });
  }

  try {
    await prisma.$transaction([
      prisma.player.update({
        where: { id: player.id },
        data: { coins: player.coins - totalPrice },
      }),
       prisma.playerInventory.upsert({
        where: { playerId_itemId: { playerId: player.id, itemId } },
        update: { quantity: { increment: quantity } },
        create: { playerId: player.id, itemId, quantity },
      }),
    ]);
  } catch(err) {
    return res.status(500).json({ 
      success: false, 
      errors: [{ field: null, message: "Failed to complete purchase." }]
    });
  }
  return res.status(200).json({ 
    success: true, 
    message: "Item purchased successfully" 
  });
}

export const getItems = async (req: Request, res: Response) => {
  let items;
  try {
    items = await prisma.item.findMany({
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
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to retrieve items from the database." }],
    });
  }
  return res.status(200).json({
    success: true,
    data: items,
  });
};

export const calculatePrice = async (req: AuthenticatedRequest, res: Response) => {
  const player = req.player!;

  const { itemId, quantity } = req.body;

  const rarityMultiplier = {
    common: parseInt(process.env.RARITY_MULTIPLIER_COMMON ?? "1"),
    rare: parseInt(process.env.RARITY_MULTIPLIER_RARE ?? "2"),
    epic: parseInt(process.env.RARITY_MULTIPLIER_EPIC ?? "3"),
    legendary: parseInt(process.env.RARITY_MULTIPLIER_LEGENDARY ?? "5")
  };

  let item;
  try {
    item = await prisma.item.findUnique({ where: { id: itemId } });
  } catch(err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to retrieve item from database."}],
    });
  }

  if (!item) {
    return res.status(404).json({ 
      success: false, 
      errors: [{ field: "itemId", message: "Item not found" }]
    });
  };

  let totalSameRarity;
  try {
    totalSameRarity = await prisma.playerInventory.aggregate({
      where: {
        playerId: player.id,
        item: { rarity: item.rarity },
      },
      _sum: { quantity: true },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to calculate total items of this rarity."}],
    });
  }
  const currentRarityQuantity = totalSameRarity._sum.quantity ?? 0;

  const multiplier = rarityMultiplier[item.rarity];
  
  let totalPrice = 0;
  for(let i = currentRarityQuantity; i <= currentRarityQuantity + quantity - 1; i++) {
      totalPrice += item.price * Math.pow(multiplier, i);
  }

  return res.status(200).json({ 
    success: true, 
    data: {
      totalPrice: totalPrice
    }
  });
}