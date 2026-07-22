import fs from 'fs';
import path from 'path';

const dbFilePath = path.join(process.cwd(), 'data.json');

export async function initDatabase() {
    if (!fs.existsSync(dbFilePath)) {
        const initialData = { users: [], cards: [] };
        fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
        console.log('Создан новый JSON-файл базы данных: data.json');
    } else {
        console.log('JSON-файл базы данных успешно обнаружен.');
    }
}

export function readData() {
    if (!fs.existsSync(dbFilePath)) {
        initDatabase();
    }
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
}

export function writeData(data: any) {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const pool = {
    async query(text: string, params: any[] = []) {
        console.log('[JSON DB] Запрос:', text);
        return { rows: [] };
    }
};
