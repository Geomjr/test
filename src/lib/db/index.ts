import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { migrate } from "./migrate";

export function dataDir(): string {
  const dir = path.resolve(process.env.DATA_DIR ?? "./data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function uploadsDir(): string {
  const dir = path.join(dataDir(), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

type DB = BetterSQLite3Database<typeof schema>;

function createDb(): { db: DB; sqlite: Database.Database } {
  const file = path.join(dataDir(), "orbit.db");
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  migrate(sqlite);
  return { db: drizzle(sqlite, { schema }), sqlite };
}

// Held on globalThis so dev HMR doesn't stack up connections.
const globalStore = globalThis as unknown as {
  __orbitDb?: { db: DB; sqlite: Database.Database };
};

function instance() {
  if (!globalStore.__orbitDb) globalStore.__orbitDb = createDb();
  return globalStore.__orbitDb;
}

export function db(): DB {
  return instance().db;
}

/** Raw handle, needed for FTS5 queries the ORM cannot express. */
export function rawDb(): Database.Database {
  return instance().sqlite;
}

export * as tables from "./schema";
