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
      doc_embed_url TEXT,
      display_name TEXT,
      public_email TEXT,
      linkedin_url TEXT,
      researchgate_url TEXT,
      scholar_url TEXT,
      photo_url TEXT,
      academic_level TEXT,
      member_category TEXT,
      director_id TEXT,
      group_member INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  // Add missing columns for older DBs
  const cols = db.prepare(`PRAGMA table_info(users)`).all()
  const has = (name) => cols.some((c) => c.name === name)
  const add = (ddl) => db.exec(ddl)
  if (!has("doc_embed_url")) add(`ALTER TABLE users ADD COLUMN doc_embed_url TEXT;`)
  if (!has("display_name")) add(`ALTER TABLE users ADD COLUMN display_name TEXT;`)
  if (!has("public_email")) add(`ALTER TABLE users ADD COLUMN public_email TEXT;`)
  if (!has("linkedin_url")) add(`ALTER TABLE users ADD COLUMN linkedin_url TEXT;`)
  if (!has("researchgate_url")) add(`ALTER TABLE users ADD COLUMN researchgate_url TEXT;`)
  if (!has("scholar_url")) add(`ALTER TABLE users ADD COLUMN scholar_url TEXT;`)
  if (!has("photo_url")) add(`ALTER TABLE users ADD COLUMN photo_url TEXT;`)
  if (!has("academic_level")) add(`ALTER TABLE users ADD COLUMN academic_level TEXT;`)
  if (!has("member_category")) add(`ALTER TABLE users ADD COLUMN member_category TEXT;`)
  if (!has("director_id")) add(`ALTER TABLE users ADD COLUMN director_id TEXT;`)
  if (!has("group_member")) add(`ALTER TABLE users ADD COLUMN group_member INTEGER NOT NULL DEFAULT 0;`)
  return db
}

async function main() {
  const email = (process.env.DEMO_EMAIL || "demo@gots.local").trim().toLowerCase()
  const password = process.env.DEMO_PASSWORD || "GotsLocal2026!"
  const name = (process.env.DEMO_NAME || "Demo Local").trim()
  const role = (process.env.DEMO_ROLE || "PROFESSIONAL").trim().toUpperCase()

  if (!email || !password) {
    console.error("Missing DEMO_EMAIL/DEMO_PASSWORD (optional DEMO_NAME/DEMO_ROLE).")
    process.exit(1)
  }
  if (password.length < 8) {
    console.error("DEMO_PASSWORD too short (min 8).")
    process.exit(1)
  }

  const db = getDb()
  const existing = db.prepare(`SELECT id, email, role FROM users WHERE email = ? LIMIT 1`).get(email)
  if (existing) {
    console.log("Demo user already exists:", existing.email)
    return
  }

  const id = crypto.randomUUID()
  const createdAt = nowIso()
  const passwordHash = await bcrypt.hash(password, 12)

  db.prepare(
    `INSERT INTO users (
      id, email, name, password_hash, role,
      display_name, public_email, academic_level, member_category, group_member,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    email,
    name,
    passwordHash,
    role,
    name,
    email,
    "DOCTORADO",
    "Estudiante de doctorado",
    1,
    createdAt,
    createdAt,
  )

  console.log("Created demo user:", { email, password, role })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

