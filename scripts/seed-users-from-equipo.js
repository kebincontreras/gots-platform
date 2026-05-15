/* eslint-disable no-console */
const fs = require("node:fs")
const path = require("node:path")
const crypto = require("node:crypto")
const bcrypt = require("bcryptjs")
const { neon } = require("@neondatabase/serverless")

function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
}

function roleForMember(m) {
  const cargo = normalize(m.cargo)
  const nivel = normalize(m.nivelEscolar)
  const programa = normalize(m.programaAcademico)
  if (cargo.includes("PROF") || nivel.includes("PROF") || programa.includes("PROF")) return "PROFESSOR"
  return "STUDENT"
}

function randomPassword() {
  // 14 chars base64url, strong enough for a temporary password.
  return crypto.randomBytes(12).toString("base64url").slice(0, 14)
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!dbUrl) {
    console.error("Missing DATABASE_URL/POSTGRES_URL. Copy it from Vercel -> Storage -> Neon -> .env.local")
    process.exit(1)
  }

  const jsonPath = path.join(process.cwd(), "public", "equipo.json")
  const raw = fs.readFileSync(jsonPath, "utf8")
  const data = JSON.parse(raw)
  const members = Array.isArray(data.team) ? data.team : []

  const sql = neon(dbUrl)

  await sql`
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
  `

  const created = []
  const skipped = []

  for (const m of members) {
    if (!m || m.activo === false) continue
    const email = (m.email || "").toString().trim().toLowerCase()
    if (!email) continue
    const name = `${m.nombre || ""} ${m.apellido || ""}`.trim() || email

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    if (existing.length) {
      skipped.push(email)
      continue
    }

    const password = randomPassword()
    const passwordHash = await bcrypt.hash(password, 12)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const role = roleForMember(m)

    await sql`
      INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
      VALUES (${id}, ${email}, ${name}, ${passwordHash}, ${role}, ${now}, ${now})
    `

    created.push({ email, name, role, password })
  }

  const outPath = path.join(process.cwd(), "seeded-users.csv")
  const lines = ["email,name,role,temp_password"]
  for (const row of created) {
    const safeName = `"${String(row.name).replaceAll('"', '""')}"`
    lines.push(`${row.email},${safeName},${row.role},${row.password}`)
  }
  fs.writeFileSync(outPath, lines.join("\n"), "utf8")

  console.log(`Created: ${created.length}, skipped(existing): ${skipped.length}`)
  console.log(`Wrote: ${outPath}`)
  console.log("IMPORTANT: send each temp password to the owner and ask them to change it after first login.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

