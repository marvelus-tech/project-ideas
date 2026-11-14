import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let database: DatabaseSync | null = null;

export function dataDir() {
  return process.env.CNSTRCT_DATA_DIR || path.join(process.cwd(), "data");
}

export function getDb() {
  if (database) return database;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const next = new DatabaseSync(path.join(dir, "cnstrct.db"));
  next.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      interests TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '',
      has_idea INTEGER NOT NULL DEFAULT 0,
      idea_text TEXT NOT NULL DEFAULT '',
      space TEXT NOT NULL DEFAULT 'none',
      capital TEXT NOT NULL DEFAULT 'none',
      trades TEXT NOT NULL DEFAULT 'maybe',
      location TEXT NOT NULL DEFAULT '',
      constraints TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      status TEXT NOT NULL,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      computer_seconds INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      schedule_label TEXT NOT NULL,
      interval_ms INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      next_run_at INTEGER,
      last_run_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      kind TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE (agent_id, seq)
    );
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      row_id TEXT NOT NULL,
      call_id TEXT NOT NULL,
      tool TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      resolved_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS policies (
      user_id TEXT NOT NULL,
      tool TEXT NOT NULL,
      mode TEXT NOT NULL,
      PRIMARY KEY (user_id, tool)
    );
    CREATE TABLE IF NOT EXISTS pending_turns (
      agent_id TEXT PRIMARY KEY,
      state TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      service TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS computers (
      agent_id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
  `);
  database = next;
  seedSample();
  return next;
}

function seedSample() {
  const db = database;
  if (!db) return;
  const existing = db.prepare("SELECT id FROM businesses WHERE slug = ?").get("harbor-tradie-desk");
  if (existing) return;
  const now = Date.now();
  db.prepare("INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)").run(
    "user_sample",
    "sample@cnstrct.local",
    "Sample owner",
    now,
  );
  db.prepare(
    `INSERT INTO profiles (user_id, interests, skills, has_idea, idea_text, space, capital, trades, location, constraints, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    "user_sample",
    "neighborhood hardware and weekend repairs",
    "explaining a job in plain language",
    0,
    "",
    "garage",
    "under-100",
    "yes",
    "Harbor, WA",
    "Evenings only",
    now,
  );
  db.prepare(
    "INSERT INTO businesses (id, user_id, template_id, name, slug, city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run("biz_sample", "user_sample", "home-services", "Harbor Tradie Desk", "harbor-tradie-desk", "Harbor", now);
}

export function closeDb() {
  database?.close();
  database = null;
}
