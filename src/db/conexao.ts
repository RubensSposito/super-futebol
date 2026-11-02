import * as SQLite from "expo-sqlite";
import { executarMigracoes } from "./migracoes";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = inicializarBanco().catch((erro: unknown) => {
      dbPromise = null;
      throw erro;
    });
  }
  return dbPromise;
}

async function inicializarBanco(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("superfutebol.db");
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await executarMigracoes(db);
  return db;
}

export async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_config WHERE key = ?",
    key,
  );
  return row?.value ?? null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)",
    key,
    value,
  );
}

export async function isSetupDone(): Promise<boolean> {
  return (await getConfig("setup_done")) === "1";
}
