import dotenv from "dotenv";
import express from "express";
import app from "./app";
import { initDatabase } from "./init-db";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Явно разрешаем доступ к папке public
app.use(express.static("public"));

async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  });
}

startServer();
