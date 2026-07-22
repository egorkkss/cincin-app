import dotenv from "dotenv";
import app from "./app";
import { initDatabase } from "./init-db";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  // Инициализируем базу данных при запуске
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Сервер и Mini App запущены на порту ${PORT}`);
  });
}

startServer();
