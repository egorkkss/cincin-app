"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBot = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const db_1 = require("./utils/db");
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const MY_TON_WALLET = process.env.TON_WALLET_ADDRESS || "UQCrU8nLAToxmsNeTaz8yWm2nHa0hjvbKYIVRxjN";
const TON_RATE = 0.6839;
const getOrCreateUser = (db, telegramId) => {
    let user = db.users?.find((u) => String(u.telegramId) === String(telegramId));
    if (!user) {
        user = {
            telegramId: String(telegramId),
            balanceUSD: 0.00,
            createdAt: new Date().toISOString()
        };
        if (!db.users)
            db.users = [];
        db.users.push(user);
    }
    return user;
};
const initBot = () => {
    if (!TOKEN) {
        console.log("⚠️ Telegram Bot Token не указан в .env. Бот пропущен.");
        return;
    }
    const bot = new node_telegram_bot_api_1.default(TOKEN, { polling: true });
    console.log("�� Telegram-бот с поддержкой Tonkeeper запущен!");
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const db = (0, db_1.readDB)();
        const user = getOrCreateUser(db, chatId);
        (0, db_1.writeDB)(db);
        bot.sendMessage(chatId, `�� **Добро пожаловать в Финтех-сервис Виртуальных Карт!**\n\n` +
            `💰 **Ваш внутренний баланс:** $${user.balanceUSD.toFixed(2)} USD\n\n` +
            `Используйте меню для пополнения через Tonkeeper и покупки карт:`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💎 Пополнить через Tonkeeper (TON)", callback_data: "deposit_menu" }],
                    [{ text: "💳 Купить виртуальную карту ($10)", callback_data: "buy_card" }],
                    [{ text: "📋 Мои карты", callback_data: "list_cards" }]
                ]
            }
        });
    });
    bot.on("callback_query", async (query) => {
        const chatId = query.message?.chat.id;
        if (!chatId)
            return;
        try {
            await bot.answerCallbackQuery(query.id);
        }
        catch (e) { }
        const db = (0, db_1.readDB)();
        const user = getOrCreateUser(db, chatId);
        if (query.data === "deposit_menu") {
            bot.sendMessage(chatId, `💎 **Выберите сумму пополнения баланса:**`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "$10 USD", callback_data: "deposit_10" },
                            { text: "$25 USD", callback_data: "deposit_25" },
                            { text: "$50 USD", callback_data: "deposit_50" }
                        ]
                    ]
                }
            });
        }
        if (query.data?.startsWith("deposit_")) {
            const rawValue = query.data.replace("deposit_", "");
            let amountUSD = Number(rawValue);
            // Защита от NaN, если прилетел некорректный или старый callback
            if (isNaN(amountUSD) || amountUSD <= 0) {
                amountUSD = 10; // дефолтное значение на случай сбоя
            }
            const amountTON = (amountUSD * TON_RATE).toFixed(2);
            const nanoTon = Math.floor(Number(amountTON) * 1e9);
            const memo = `DEP-${chatId}-${crypto_1.default.randomBytes(3).toString("hex").toUpperCase()}`;
            const tonkeeperUrl = `https://app.tonkeeper.com/transfer/${MY_TON_WALLET}?amount=${nanoTon}&text=${encodeURIComponent(memo)}`;
            const newDeposit = {
                id: memo,
                telegramId: String(chatId),
                amountUSD: amountUSD,
                amountTON: Number(amountTON),
                status: "PENDING",
                createdAt: new Date().toISOString()
            };
            if (!db.deposits)
                db.deposits = [];
            db.deposits.push(newDeposit);
            (0, db_1.writeDB)(db);
            bot.sendMessage(chatId, `💎 **Оплата через Tonkeeper / TON Wallet**\n\n` +
                `Сумма: **$${amountUSD} USD** (~**${amountTON} TON**)\n` +
                `Кошелек назначения: \`${MY_TON_WALLET}\`\n` +
                `Комментарий: \`${memo}\`\n\n` +
                `⚠️ Обязательно указывайте этот комментарий при переводе!`, {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "💎 Оплатить в Tonkeeper", url: tonkeeperUrl }],
                        [{ text: "🔄 Проверить транзакцию в TON", callback_data: `check_ton_${memo}` }]
                    ]
                }
            });
        }
        if (query.data?.startsWith("check_ton_")) {
            const memo = query.data.replace("check_ton_", "");
            const deposit = db.deposits?.find((d) => d.id === memo);
            if (deposit && deposit.status === "COMPLETED") {
                bot.sendMessage(chatId, "✅ Этот депозит уже зачислен!");
                return;
            }
            try {
                const response = await axios_1.default.get(`https://toncenter.com/api/v2/getTransactions?address=${MY_TON_WALLET}&limit=20`);
                const transactions = response.data.result || [];
                let found = false;
                for (const tx of transactions) {
                    const inMsg = tx.in_msg;
                    if (inMsg && inMsg.message === memo) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    if (deposit)
                        deposit.status = "COMPLETED";
                    user.balanceUSD += deposit ? deposit.amountUSD : 10;
                    (0, db_1.writeDB)(db);
                    bot.sendMessage(chatId, `🎉 **Транзакция найдена в блокчейне TON!**\n\n` +
                        `Зачислено: **$${deposit ? deposit.amountUSD : 10} USD**\n` +
                        `Ваш текущий баланс: **$${user.balanceUSD.toFixed(2)} USD**`);
                }
                else {
                    bot.sendMessage(chatId, `⏳ Транзакция с комментарием \`${memo}\` пока не найдена. Подождите 15-30 секунд и нажмите кнопку снова.`);
                }
            }
            catch (e) {
                bot.sendMessage(chatId, "⚠️ Не удалось обратиться к блокчейн-узлу TON. Попробуйте через минуту.");
            }
        }
        if (query.data === "buy_card") {
            const cardPrice = 10.00;
            if (user.balanceUSD < cardPrice) {
                bot.sendMessage(chatId, `❌ **Недостаточно средств на балансе!**\n\n` +
                    `Стоимость карты: **$${cardPrice} USD**\n` +
                    `Ваш баланс: **$${user.balanceUSD.toFixed(2)} USD**`, {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [[{ text: "💎 Пополнить через Tonkeeper", callback_data: "deposit_menu" }]]
                    }
                });
                return;
            }
            user.balanceUSD -= cardPrice;
            const cardNumber = "4000" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
            const cvv = Math.floor(100 + Math.random() * 900).toString();
            const newCard = {
                id: crypto_1.default.randomUUID(),
                telegramId: String(chatId),
                cardNumber,
                cvv,
                expiryMonth: new Date().getMonth() + 1,
                expiryYear: new Date().getFullYear() + 3,
                balance: 5.00,
                currency: "USD",
                isActive: true,
                createdAt: new Date().toISOString()
            };
            if (!db.cards)
                db.cards = [];
            db.cards.push(newCard);
            (0, db_1.writeDB)(db);
            bot.sendMessage(chatId, `✅ **Виртуальная карта успешно куплена!**\n\n` +
                `💳 **Номер:** \`${newCard.cardNumber}\`\n` +
                `🔒 **CVV:** \`${newCard.cvv}\`\n` +
                `📅 **Срок:** \`${newCard.expiryMonth}/${newCard.expiryYear}\`\n` +
                `💰 **Баланс карты:** $${newCard.balance}\n\n` +
                `Остаток на счете: **$${user.balanceUSD.toFixed(2)} USD**`, { parse_mode: "Markdown" });
        }
        if (query.data === "list_cards") {
            const userCards = db.cards?.filter((c) => String(c.telegramId) === String(chatId)) || [];
            if (userCards.length === 0) {
                bot.sendMessage(chatId, "У вас пока нет купленных карт.");
                return;
            }
            userCards.forEach((card) => {
                const status = card.isActive ? "🟢 Активна" : "🔴 Заблокирована";
                bot.sendMessage(chatId, `💳 *Карта:* \`${card.cardNumber}\`\n` +
                    `💰 *Баланс карты:* $${card.balance} ${card.currency}\n` +
                    `Статус: ${status}`, { parse_mode: "Markdown" });
            });
        }
    });
};
exports.initBot = initBot;
