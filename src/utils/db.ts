import fs from "fs";
import path from "path";

const dbDir = path.join(__dirname, "../data");
const dbPath = path.join(dbDir, "db.json");

export const readDB = () => {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const defaultData = { users: [], cards: [], transactions: [], deposits: [] };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  if (!data.users) data.users = [];
  if (!data.cards) data.cards = [];
  if (!data.deposits) data.deposits = [];
  return data;
};

export const writeDB = (data: any) => {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};
