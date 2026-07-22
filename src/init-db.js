"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        balance NUMERIC(18, 2) DEFAULT 0.00,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT REFERENCES users(telegram_id),
        type VARCHAR(50) NOT NULL,
        amount NUMERIC(18, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        tx_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS virtual_cards (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT REFERENCES users(telegram_id),
        card_number_masked VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Таблицы БД успешно инициализированы!');
    }
    catch (err) {
        console.error('❌ Ошибка инициализации БД:', err);
    }
    finally {
        client.release();
    }
}
