"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const init_db_1 = require("./init-db");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
async function startServer() {
    // Инициализируем базу данных при запуске
    await (0, init_db_1.initDatabase)();
    app_1.default.listen(PORT, () => {
        console.log(`🚀 Сервер и Mini App запущены на порту ${PORT}`);
    });
}
startServer();
