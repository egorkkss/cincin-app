import express from "express";
import crypto from "crypto";
import { readDB, writeDB } from "./utils/db";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const ADMIN_ID = "8041683307"; // Твой ID администратора

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(chatId: string | number, text: string) {
  if (!BOT_TOKEN || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML"
      })
    });
  } catch (err) {
    console.error("Failed to send telegram notification:", err);
  }
}

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

// 1. Получить профиль
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

// 2. Создание заявки на пополнение
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

// 3. Подтверждение оплаты + Уведомления пользователю и админу
app.post("/api/deposits/mock-pay", async (req, res) => {
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

    // Уведомление пользователю
    await sendTelegramNotification(
      deposit.telegramId,
      `✅ <b>Баланс успешно пополнен!</b>\nСумма: <b>+$${deposit.amountUSD}</b>\nТекущий баланс: $${user.balanceUSD}`
    );

    // Лог администратору
    if (ADMIN_ID) {
      await sendTelegramNotification(
        ADMIN_ID,
        `🔔 <b>[LOG] Пополнение баланса</b>\n�� Пользователь: <code>${deposit.telegramId}</code>\n💵 Сумма: $${deposit.amountUSD} (${deposit.payCurrency})`
      );
    }

    res.status(200).json({
      success: true,
      message: `Successfully credited $${deposit.amountUSD} to user ${deposit.telegramId}`,
      newBalance: user.balanceUSD
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 4. Покупка виртуальной карты + Уведомления
app.post("/api/cards/buy", async (req, res) => {
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

    // Уведомление пользователю
    await sendTelegramNotification(
      telegramId,
      `💳 <b>Виртуальная карта успешно куплена!</b>\nНомер: <code>${cardNumber}</code>\nCVV: <code>${cvv}</code>\nОстаток баланса: $${user.balanceUSD}`
    );

    // Лог администратору
    if (ADMIN_ID) {
      await sendTelegramNotification(
        ADMIN_ID,
        `🔔 <b>[LOG] Покупка карты</b>\n�� Пользователь: <code>${telegramId}</code>\n💳 Стоимость: $${price}`
      );
    }

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

export default app;
