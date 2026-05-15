import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

export type Role = "STUDENT" | "PROFESSOR"

export type User = {
  id: string
  email: string
  name: string
  passwordHash: string
  role: Role
  driveEmbedUrl: string | null
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

function ensureDirExists(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function nowIso() {
  return new Date().toISOString()
}

let dbSingleton: Database.Database | null = null

function getDb() {
  if (dbSingleton) return dbSingleton

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

  dbSingleton = db
  return db
}

export function getUserByEmail(email: string): User | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id, email, name, password_hash, role, drive_embed_url, created_at, updated_at
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function getUserById(id: string): User | null {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT id, email, name, password_hash, role, drive_embed_url, created_at, updated_at
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createUser(input: { name: string; email: string; passwordHash: string; role?: Role }): User {
  const db = getDb()
  const id = crypto.randomUUID()
  const createdAt = nowIso()
  const updatedAt = createdAt
  const role = input.role ?? "STUDENT"

  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.email, input.name, input.passwordHash, role, createdAt, updatedAt)

  return {
    id,
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    role,
    driveEmbedUrl: null,
    createdAt,
    updatedAt,
  }
}

export function updateUserDriveEmbedUrl(userId: string, driveEmbedUrl: string): void {
  const db = getDb()
  db.prepare(`UPDATE users SET drive_embed_url = ?, updated_at = ? WHERE id = ?`).run(driveEmbedUrl, nowIso(), userId)
}

export function listStudents(): Array<Pick<User, "id" | "name" | "email" | "driveEmbedUrl" | "updatedAt">> {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, name, email, drive_embed_url, updated_at
       FROM users WHERE role = 'STUDENT' ORDER BY name ASC`,
    )
    .all() as any[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    driveEmbedUrl: r.drive_embed_url ?? null,
    updatedAt: r.updated_at,
  }))
}

export function createTask(input: {
  date: string
  title: string
  description?: string | null
  createdBy: string
}): Task {
  const db = getDb()
  const id = crypto.randomUUID()
  const createdAt = nowIso()

  db.prepare(
    `INSERT INTO tasks (id, date, title, description, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, input.date, input.title, input.description ?? null, input.createdBy, createdAt)

  return {
    id,
    date: input.date,
    title: input.title,
    description: input.description ?? null,
    createdBy: input.createdBy,
    createdAt,
  }
}

export function listTasksByDate(date: string): Task[] {
  const db = getDb()
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

export function listTaskDatesInRange(from: string, to: string): string[] {
  const db = getDb()
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
