"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDatabase = initDatabase;
exports.readData = readData;
exports.writeData = writeData;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbFilePath = path_1.default.join(process.cwd(), 'data.json');
async function initDatabase() {
    if (!fs_1.default.existsSync(dbFilePath)) {
        const initialData = { users: [], cards: [] };
        fs_1.default.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
        console.log('Создан новый JSON-файл базы данных: data.json');
    }
    else {
        console.log('JSON-файл базы данных успешно обнаружен.');
    }
}
function readData() {
    if (!fs_1.default.existsSync(dbFilePath)) {
        initDatabase();
    }
    return JSON.parse(fs_1.default.readFileSync(dbFilePath, 'utf-8'));
}
function writeData(data) {
    fs_1.default.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
}
exports.pool = {
    async query(text, params = []) {
        console.log('[JSON DB] Запрос:', text);
        return { rows: [] };
    }
};
