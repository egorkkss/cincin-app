"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("./utils/db");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Вспомогательная функция поиска/создания пользователя
const getOrCreateUser = (db, telegramId) => {
    let user = db.users.find((u) => String(u.telegramId) === String(telegramId));
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
// 1. Получить профиль и баланс пользователя
app.get("/api/user/:telegramId", (req, res) => {
    try {
        const { telegramId } = req.params;
        const db = (0, db_1.readDB)();
        const user = getOrCreateUser(db, telegramId);
        (0, db_1.writeDB)(db);
        const userCards = db.cards.filter((c) => String(c.telegramId) === String(telegramId));
        res.status(200).json({
            success: true,
            data: {
                telegramId: user.telegramId,
                balanceUSD: user.balanceUSD,
                cardsCount: userCards.length
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// 2. Создание заявки на пополнение через крипту
app.post("/api/deposits/create", (req, res) => {
    try {
        const { telegramId, amountUSD, currency } = req.body; // currency: USDT, TON, BTC
        if (!telegramId || !amountUSD || amountUSD <= 0) {
            return res.status(400).json({ success: false, message: "Invalid deposit parameters" });
        }
        const db = (0, db_1.readDB)();
        getOrCreateUser(db, telegramId);
        const newDeposit = {
            id: crypto_1.default.randomUUID(),
            telegramId: String(telegramId),
            amountUSD: Number(amountUSD),
            payCurrency: currency || "USDT",
            status: "PENDING", // PENDING, COMPLETED, FAILED
            createdAt: new Date().toISOString()
        };
        db.deposits.push(newDeposit);
        (0, db_1.writeDB)(db);
        // В реальности здесь формируется ссылка/адрес от Crypto API (Cryptomus/CryptoPay)
        res.status(201).json({
            success: true,
            message: "Deposit invoice created",
            data: {
                depositId: newDeposit.id,
                amountUSD: newDeposit.amountUSD,
                payCurrency: newDeposit.payCurrency,
                payAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", // Фейковый адрес для теста
                status: newDeposit.status
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// 3. Эмуляция подтверждения оплаты (Mock Webhook)
app.post("/api/deposits/mock-pay", (req, res) => {
    try {
        const { depositId } = req.body;
        const db = (0, db_1.readDB)();
        const deposit = db.deposits.find((d) => d.id === depositId);
        if (!deposit) {
            return res.status(404).json({ success: false, message: "Deposit not found" });
        }
        if (deposit.status === "COMPLETED") {
            return res.status(400).json({ success: false, message: "Deposit already completed" });
        }
        // Зачисляем баланс пользователю
        deposit.status = "COMPLETED";
        const user = getOrCreateUser(db, deposit.telegramId);
        user.balanceUSD += deposit.amountUSD;
        (0, db_1.writeDB)(db);
        res.status(200).json({
            success: true,
            message: `Successfully credited $${deposit.amountUSD} to user ${deposit.telegramId}`,
            newBalance: user.balanceUSD
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// 4. Покупка виртуальной карты с внутреннего баланса аккаунта
app.post("/api/cards/buy", (req, res) => {
    try {
        const { telegramId, cardPrice } = req.body; // например, цена выпуска $10
        const price = Number(cardPrice) || 10.00;
        const db = (0, db_1.readDB)();
        const user = getOrCreateUser(db, telegramId);
        if (user.balanceUSD < price) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Required: $${price}, Available: $${user.balanceUSD}`
            });
        }
        // Списываем баланс
        user.balanceUSD -= price;
        // Выпускаем карту (например, стартовый баланс на карте $5)
        const cardNumber = "4000" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
        const cvv = Math.floor(100 + Math.random() * 900).toString();
        const newCard = {
            id: crypto_1.default.randomUUID(),
            telegramId: String(telegramId),
            cardNumber,
            cvv,
            expiryMonth: new Date().getMonth() + 1,
            expiryYear: new Date().getFullYear() + 3,
            balance: 5.00, // Номинал карты
            currency: "USD",
            isActive: true,
            createdAt: new Date().toISOString()
        };
        db.cards.push(newCard);
        (0, db_1.writeDB)(db);
        res.status(201).json({
            success: true,
            message: "Card successfully purchased!",
            data: {
                card: newCard,
                userRemainingBalance: user.balanceUSD
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.default = app;
