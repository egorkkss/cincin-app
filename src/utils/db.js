"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDB = exports.readDB = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbDir = path_1.default.join(__dirname, "../data");
const dbPath = path_1.default.join(dbDir, "db.json");
const readDB = () => {
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs_1.default.existsSync(dbPath)) {
        const defaultData = { users: [], cards: [], transactions: [], deposits: [] };
        fs_1.default.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    const data = JSON.parse(fs_1.default.readFileSync(dbPath, "utf-8"));
    if (!data.users)
        data.users = [];
    if (!data.cards)
        data.cards = [];
    if (!data.deposits)
        data.deposits = [];
    return data;
};
exports.readDB = readDB;
const writeDB = (data) => {
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    fs_1.default.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};
exports.writeDB = writeDB;
