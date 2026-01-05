import { openDB } from "idb";

const DB_NAME = "ChatAppKeys";
const STORE_NAME = "keys";

export async function initKeyDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            db.createObjectStore(STORE_NAME);
        },
    });
}

export async function saveKeys(userId, keyPair) {
    const db = await initKeyDB();
    await db.put(STORE_NAME, keyPair, userId);
}

export async function getKeys(userId) {
    const db = await initKeyDB();
    return await db.get(STORE_NAME, userId);
}
