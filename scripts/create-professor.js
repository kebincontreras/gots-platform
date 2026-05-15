const path = require("node:path")
const fs = require("node:fs")
const crypto = require("node:crypto")

const bcrypt = require("bcryptjs")
const Database = require("better-sqlite3")

function ensureDirExists(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function nowIso() {
  return new Date().toISOString()
}

function getDb() {
  const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "app.db")
  ensureDirExists(path.dirname(dbPath))
  const db = new Database(dbPath)
  db.pragma("journal_mode = WAL")
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      drive_embed_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
  return db
}

async function main() {
  const name = (process.env.PROF_NAME || "Profesor").trim()
  const email = (process.env.PROF_EMAIL || "").trim().toLowerCase()
  const password = process.env.PROF_PASSWORD || ""

  if (!email || !password) {
    console.error("Missing env vars: PROF_EMAIL and PROF_PASSWORD (optional PROF_NAME).")
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("PROF_PASSWORD too short (min 8).")
    process.exit(1)
  }

  const db = getDb()
  const existing = db
    .prepare(`SELECT id, email, role FROM users WHERE email = ? LIMIT 1`)
    .get(email)

  if (existing) {
    console.log("Professor already exists:", existing.email)
    process.exit(0)
  }

  const id = crypto.randomUUID()
  const createdAt = nowIso()
  const passwordHash = await bcrypt.hash(password, 12)

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'PROFESSOR', ?, ?)`,
  ).run(id, email, name, passwordHash, createdAt, createdAt)

  console.log("Created professor:", { id, email, name })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

