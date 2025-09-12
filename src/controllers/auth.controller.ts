import type {Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  let existingPlayer
  try {
    existingPlayer = await prisma.player.findUnique({
      where: { username },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to check if username already exists" }],
    });
  }

  if (existingPlayer) {
    return res.status(400).json({
      success: false,
      errors: [{ field: "username", message: "This username is already taken. Please choose another one." }],
    });
  }

  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch(err) {
    return res.status(500).json({
      success: false,
      errors: [{ field: null, message: "Failed to hash password. Please try again later." }],
    });
  }

  try {
    await prisma.player.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
  } catch(e) {
    return res.status(500).json({ 
      success: false,
      errors: [{ field: null, message: "Failed to create new player. Database error." }]
    });
  }

  return res.status(201).json({
    success: true,
    message: "Player registered successfully",
  });
}

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  let player;
  try {
    player = await prisma.player.findUnique({ where: { username } });
  } catch(err) {
    return res.status(500).json({ 
      success: false, 
      errors: [{ field: null, message: "Failed to query the database" }] 
    });
  }

  if (!player) {
    return res.status(400).json({ 
      success: false,
      errors: [{ field: null, message: "Invalid username or password" }]
    });
  }


  let isValid: boolean;
  try {
    isValid = await bcrypt.compare(password, player.password);
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      errors: [{ field: "null", message: "Failed to validate password" }] 
    });
  }

  if (!isValid) {
    return res.status(400).json({ 
      success: false,
      errors: [{ field: null, message: "Invalid username or password" }]
    });
  }

  let token: string;
  try {
    token = jwt.sign(
      { playerId: player.id, username: player.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      errors: [{ field: null, message: "Failed to generate token" }]
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: token,
  });
};