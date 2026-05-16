import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

export type Role = "STUDENT" | "PROFESSOR"

export type User = {
  id: string
  email: string
  name: string
  passwordHash: string
  role: Role
  driveEmbedUrl: string | null
  docEmbedUrl: string | null
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  date: string // YYYY-MM-DD (local)
  title: string
  description: string | null
  createdBy: string
  createdAt: string
}

function nowIso() {
  return new Date().toISOString()
}

function ensureDirExists(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function getPostgresUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  )
}

let pgSqlSingleton: ReturnType<typeof neon> | null = null
let pgInitialized = false

function getPgSql() {
  if (pgSqlSingleton) return pgSqlSingleton
  const url = getPostgresUrl()
  if (!url) return null
  pgSqlSingleton = neon(url)
  return pgSqlSingleton
}

async function ensurePgSchema() {
  if (pgInitialized) return
  const sql = getPgSql()
  if (!sql) return

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      drive_embed_url TEXT,
      doc_embed_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS doc_embed_url TEXT;`

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);`

  pgInitialized = true
}

let sqliteSingleton: Database.Database | null = null

function getSqliteDb() {
  if (sqliteSingleton) return sqliteSingleton

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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
  `)

  // Lightweight migration for existing SQLite DBs
  const userCols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>
  const hasDocEmbed = userCols.some((c) => c.name === "doc_embed_url")
  if (!hasDocEmbed) {
    db.exec(`ALTER TABLE users ADD COLUMN doc_embed_url TEXT;`)
  }

  sqliteSingleton = db
  return db
}

function shouldUsePostgres() {
  const url = getPostgresUrl()
  if (url) return true
  // In Vercel, prefer failing fast if no DB is configured (SQLite is not reliable there).
  if (process.env.VERCEL) return true
  return false
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()

    const rows = await sql<
      Array<{
        id: string
        email: string
        name: string
        password_hash: string
        role: Role
        drive_embed_url: string | null
        doc_embed_url: string | null
        created_at: string
        updated_at: string
      }>
    >`SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url, created_at, updated_at
      FROM users WHERE email = ${email} LIMIT 1`

    const row = rows[0]
    if (!row) return null
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      role: row.role,
      driveEmbedUrl: row.drive_embed_url ?? null,
      docEmbedUrl: row.doc_embed_url ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  const db = getSqliteDb()
  const row = db
    .prepare(
      `SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url, created_at, updated_at
       FROM users WHERE email = ? LIMIT 1`,
    )
    .get(email) as any
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    driveEmbedUrl: row.drive_embed_url ?? null,
    docEmbedUrl: row.doc_embed_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getUserById(id: string): Promise<User | null> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()

    const rows = await sql<
      Array<{
        id: string
        email: string
        name: string
        password_hash: string
        role: Role
        drive_embed_url: string | null
        doc_embed_url: string | null
        created_at: string
        updated_at: string
      }>
    >`SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url, created_at, updated_at
      FROM users WHERE id = ${id} LIMIT 1`

    const row = rows[0]
    if (!row) return null
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      role: row.role,
      driveEmbedUrl: row.drive_embed_url ?? null,
      docEmbedUrl: row.doc_embed_url ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  const db = getSqliteDb()
  const row = db
    .prepare(
      `SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
    )
    .get(id) as any
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    driveEmbedUrl: row.drive_embed_url ?? null,
    docEmbedUrl: row.doc_embed_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createUser(input: { name: string; email: string; passwordHash: string; role?: Role }): Promise<User> {
  const id = crypto.randomUUID()
  const createdAt = nowIso()
  const updatedAt = createdAt
  const role = input.role ?? "STUDENT"

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()

    await sql`
      INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
      VALUES (${id}, ${input.email}, ${input.name}, ${input.passwordHash}, ${role}, ${createdAt}, ${updatedAt})
    `
  } else {
    const db = getSqliteDb()
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.email, input.name, input.passwordHash, role, createdAt, updatedAt)
  }

  return {
    id,
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    role,
    driveEmbedUrl: null,
    docEmbedUrl: null,
    createdAt,
    updatedAt,
  }
}

export async function updateUserDriveEmbedUrl(userId: string, driveEmbedUrl: string): Promise<void> {
  const updatedAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE users SET drive_embed_url = ${driveEmbedUrl}, updated_at = ${updatedAt} WHERE id = ${userId}`
    return
  }

  const db = getSqliteDb()
  db.prepare(`UPDATE users SET drive_embed_url = ?, updated_at = ? WHERE id = ?`).run(driveEmbedUrl, updatedAt, userId)
}

export async function updateUserDocEmbedUrl(userId: string, docEmbedUrl: string): Promise<void> {
  const updatedAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE users SET doc_embed_url = ${docEmbedUrl}, updated_at = ${updatedAt} WHERE id = ${userId}`
    return
  }

  const db = getSqliteDb()
  db.prepare(`UPDATE users SET doc_embed_url = ?, updated_at = ? WHERE id = ?`).run(docEmbedUrl, updatedAt, userId)
}

export async function listStudents(): Promise<
  Array<Pick<User, "id" | "name" | "email" | "driveEmbedUrl" | "docEmbedUrl" | "updatedAt">>
> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()

    const rows = await sql<
      Array<{
        id: string
        name: string
        email: string
        drive_embed_url: string | null
        doc_embed_url: string | null
        updated_at: string
      }>
    >`SELECT id, name, email, drive_embed_url, doc_embed_url, updated_at
      FROM users WHERE role = 'STUDENT' ORDER BY name ASC`

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      driveEmbedUrl: r.drive_embed_url ?? null,
      docEmbedUrl: r.doc_embed_url ?? null,
      updatedAt: r.updated_at,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, name, email, drive_embed_url, doc_embed_url, updated_at
       FROM users WHERE role = 'STUDENT' ORDER BY name ASC`,
    )
    .all() as any[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    driveEmbedUrl: r.drive_embed_url ?? null,
    docEmbedUrl: r.doc_embed_url ?? null,
    updatedAt: r.updated_at,
  }))
}

export async function updateUserRoleByEmail(email: string, role: Role): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const updatedAt = nowIso()

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE users SET role = ${role}, updated_at = ${updatedAt} WHERE email = ${normalizedEmail}`
    return
  }

  const db = getSqliteDb()
  db.prepare(`UPDATE users SET role = ?, updated_at = ? WHERE email = ?`).run(role, updatedAt, normalizedEmail)
}

export async function createTask(input: {
  date: string
  title: string
  description?: string | null
  createdBy: string
}): Promise<Task> {
  const id = crypto.randomUUID()
  const createdAt = nowIso()
  const description = input.description ?? null

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`
      INSERT INTO tasks (id, date, title, description, created_by, created_at)
      VALUES (${id}, ${input.date}, ${input.title}, ${description}, ${input.createdBy}, ${createdAt})
    `
  } else {
    const db = getSqliteDb()
    db.prepare(
      `INSERT INTO tasks (id, date, title, description, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, input.date, input.title, description, input.createdBy, createdAt)
  }

  return {
    id,
    date: input.date,
    title: input.title,
    description,
    createdBy: input.createdBy,
    createdAt,
  }
}

export async function listTasksByDate(date: string): Promise<Task[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = await sql<
      Array<{ id: string; date: string; title: string; description: string | null; created_by: string; created_at: string }>
    >`SELECT id, date, title, description, created_by, created_at
      FROM tasks WHERE date = ${date} ORDER BY created_at DESC`
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      description: r.description ?? null,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, date, title, description, created_by, created_at
       FROM tasks WHERE date = ? ORDER BY created_at DESC`,
    )
    .all(date) as any[]

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    description: r.description ?? null,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }))
}

export async function listTaskDatesInRange(from: string, to: string): Promise<string[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = await sql<Array<{ date: string }>>`SELECT DISTINCT date
      FROM tasks
      WHERE date >= ${from} AND date <= ${to}
      ORDER BY date ASC`
    return rows.map((r) => r.date)
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT DISTINCT date
       FROM tasks
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
    )
    .all(from, to) as any[]
  return rows.map((r) => r.date as string)
}
