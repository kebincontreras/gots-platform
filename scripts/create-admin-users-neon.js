const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")

const bcrypt = require("bcryptjs")

function loadDotEnvLocal() {
  const file = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(file)) return
  const raw = fs.readFileSync(file, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null) process.env[key] = value
  }
}

function getPostgresUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || null
}

function passwordFromEmail(email) {
  const local = String(email).split("@")[0] || ""
  if (local.length < 8) throw new Error(`Password would be too short for ${email}`)
  return local
}

async function ensureUser(sql, { email, name, role }) {
  const password = passwordFromEmail(email)
  const rows = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
  const existingId = rows?.[0]?.id ? String(rows[0].id) : null

  if (existingId) {
    const passwordHash = await bcrypt.hash(password, 12)
    const updatedAt = new Date().toISOString()
    await sql`UPDATE users SET
      name = ${name},
      password_hash = ${passwordHash},
      role = ${role},
      display_name = COALESCE(display_name, ${name}),
      public_email = COALESCE(public_email, ${email}),
      group_member = TRUE,
      updated_at = ${updatedAt}
      WHERE id = ${existingId}`
    return { email, password, id: existingId, updated: true }
  }

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const passwordHash = await bcrypt.hash(password, 12)
  await sql`INSERT INTO users (
    id, email, name, password_hash, role,
    display_name, public_email, group_member,
    created_at, updated_at
  ) VALUES (
    ${id}, ${email}, ${name}, ${passwordHash}, ${role},
    ${name}, ${email}, TRUE,
    ${createdAt}, ${createdAt}
  )`
  return { email, password, id, updated: false }
}

async function main() {
  loadDotEnvLocal()
  const url = getPostgresUrl()
  if (!url) {
    console.error("Missing DATABASE_URL/POSTGRES_URL in .env.local (Neon).")
    process.exit(1)
  }

  const { neon } = require("@neondatabase/serverless")
  const sql = neon(url)

  // Ensure schema basics
  await sql`
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
      group_member BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `

  const rafael = await ensureUser(sql, {
    email: "rafael.torres@saber.uis.edu.co",
    name: "Rafael Torres",
    role: "PROFESSOR",
  })
  const kebin = await ensureUser(sql, {
    email: "kebinandrescontreras@gmail.com",
    name: "Kebin Contreras",
    role: "PROFESSOR",
  })

  console.log("Admin accounts ready:")
  console.log(rafael)
  console.log(kebin)
  console.log("Passwords are the part before @ (as requested).")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

