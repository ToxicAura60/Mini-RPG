import dotenv from "dotenv";
dotenv.config();

import express from "express";
import authRouter from "./routes/auth.route.js";
import shopRouter from "./routes/shop.route.js";
import gameRouter from "./routes/game.route.js";
import playerRouter from "./routes/player.route.js";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/auth", authRouter);
app.use("/shop", shopRouter);
app.use("/game", gameRouter);
app.use("/player", playerRouter);

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
