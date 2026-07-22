import express from "express";
import crypto from "crypto";
import { readDB, writeDB } from "./utils/db";

const app = express();
app.use(express.json());

const getOrCreateUser = (db: any, telegramId: string | number) => {
  let user = db.users.find((u: any) => String(u.telegramId) === String(telegramId));
  if (!user) {
    user = {
      telegramId: String(telegramId),
      balanceUSD: 0.00,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
  }
  return user;
};

app.get("/api/user/:telegramId", (req, res) => {
  try {
    const { telegramId } = req.params;
    const db = readDB();
    const user = getOrCreateUser(db, telegramId);
    writeDB(db);

    const userCards = db.cards.filter((c: any) => String(c.telegramId) === String(telegramId));

    res.status(200).json({
      success: true,
      data: {
        telegramId: user.telegramId,
        balanceUSD: user.balanceUSD,
        cardsCount: userCards.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/deposits/create", (req, res) => {
  try {
    const { telegramId, amountUSD, currency } = req.body;

    if (!telegramId || !amountUSD || amountUSD <= 0) {
      return res.status(400).json({ success: false, message: "Invalid deposit parameters" });
    }

    const db = readDB();
    getOrCreateUser(db, telegramId);

    const newDeposit = {
      id: crypto.randomUUID(),
      telegramId: String(telegramId),
      amountUSD: Number(amountUSD),
      payCurrency: currency || "USDT",
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    db.deposits.push(newDeposit);
    writeDB(db);

    res.status(201).json({
      success: true,
      message: "Deposit invoice created",
      data: {
        depositId: newDeposit.id,
        amountUSD: newDeposit.amountUSD,
        payCurrency: newDeposit.payCurrency,
        payAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        status: newDeposit.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/deposits/mock-pay", (req, res) => {
  try {
    const { depositId } = req.body;
    const db = readDB();

    const deposit = db.deposits.find((d: any) => d.id === depositId);
    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }

    if (deposit.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Deposit already completed" });
    }

    deposit.status = "COMPLETED";
    const user = getOrCreateUser(db, deposit.telegramId);
    user.balanceUSD += deposit.amountUSD;

    writeDB(db);

    res.status(200).json({
      success: true,
      message: `Successfully credited $${deposit.amountUSD} to user ${deposit.telegramId}`,
      newBalance: user.balanceUSD
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/cards/buy", (req, res) => {
  try {
    const { telegramId, cardPrice } = req.body;
    const price = Number(cardPrice) || 10.00;

    const db = readDB();
    const user = getOrCreateUser(db, telegramId);

    if (user.balanceUSD < price) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Required: $${price}, Available: $${user.balanceUSD}`
      });
    }

    user.balanceUSD -= price;

    const cardNumber = "4000" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const newCard = {
      id: crypto.randomUUID(),
      telegramId: String(telegramId),
      cardNumber,
      cvv,
      expiryMonth: new Date().getMonth() + 1,
      expiryYear: new Date().getFullYear() + 3,
      balance: 5.00,
      currency: "USD",
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.cards.push(newCard);
    writeDB(db);

    res.status(201).json({
      success: true,
      message: "Card successfully purchased!",
      data: {
        card: newCard,
        userRemainingBalance: user.balanceUSD
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/transactions/:telegramId", (req, res) => {
  try {
    const { telegramId } = req.params;
    const db = readDB();

    const userDeposits = (db.deposits || [])
      .filter((d: any) => String(d.telegramId) === String(telegramId))
      .map((d: any) => ({
        id: d.id,
        type: "DEPOSIT",
        title: `Пополнение (${d.payCurrency})`,
        amount: d.amountUSD,
        status: d.status,
        date: d.createdAt
      }));

    const userCards = (db.cards || [])
      .filter((c: any) => String(c.telegramId) === String(telegramId))
      .map((c: any) => ({
        id: c.id,
        type: "BUY_CARD",
        title: "Покупка виртуальной карты",
        amount: -10.00,
        status: "COMPLETED",
        date: c.createdAt
      }));

    const allTransactions = [...userDeposits, ...userCards].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.status(200).json({
      success: true,
      data: allTransactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default app;
