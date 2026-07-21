import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { initBot } from "./bot";
import { readDB } from "./utils/db";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/user/:telegramId", (req, res) => {
  const { telegramId } = req.params;
  const db = readDB();
  const user = db.users?.find((u: any) => String(u.telegramId) === String(telegramId)) || {
    telegramId,
    balanceUSD: 0.00
  };
  const cards = db.cards?.filter((c: any) => String(c.telegramId) === String(telegramId)) || [];
  
  res.json({ user, cards });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер и Mini App запущены на порту ${PORT}`);
  initBot();
});
