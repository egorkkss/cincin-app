"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const bot_1 = require("./bot");
const db_1 = require("./utils/db");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.get("/api/user/:telegramId", (req, res) => {
    const { telegramId } = req.params;
    const db = (0, db_1.readDB)();
    const user = db.users?.find((u) => String(u.telegramId) === String(telegramId)) || {
        telegramId,
        balanceUSD: 0.00
    };
    const cards = db.cards?.filter((c) => String(c.telegramId) === String(telegramId)) || [];
    res.json({ user, cards });
});
app.listen(PORT, () => {
    console.log(`🚀 Сервер и Mini App запущены на порту ${PORT}`);
    (0, bot_1.initBot)();
});
