import Database from "better-sqlite3"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

export type Role = "PROFESSIONAL" | "GUEST" | "STUDENT" | "EXTERNAL_RESEARCHER" | "PROFESSOR" | "EDITOR_NOTICIAS"

export type User = {
  id: string
  email: string
  name: string
  displayName: string | null
  publicEmail: string | null
  linkedinUrl: string | null
  researchgateUrl: string | null
  scholarUrl: string | null
  photoUrl: string | null
  academicLevel: string | null
  memberCategory: string | null
  directorId: string | null
  directorName: string | null
  groupMember: boolean
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

export type NewsItem = {
  id: number
  title: string
  description: string
  summary: string
  date: string // YYYY-MM-DD
  image: string
  featured: boolean
  category: string
  tags: string[]
  author: string
  readTime: string
  content: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type Publication = {
  id: number
  title: string
  authors: string
  journal: string
  conference: string | null
  year: number
  image: string | null
  pdfUrl: string
  externalUrl: string
  supplementaryMaterial: string | null
  starred: boolean
  abstract: string
  keywords: string[]
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type MembershipRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export type MembershipRequest = {
  id: string
  userId: string
  status: MembershipRequestStatus
  createdAt: string
  resolvedBy: string | null
  resolvedAt: string | null
}

export type GroupMessage = {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
}

export type NotificationType = "MEMBERSHIP_REQUEST" | "NEWS_PUBLISHED" | "MEMBER_JOINED"

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  url: string | null
  meta: Record<string, any> | null
  createdAt: string
  readAt: string | null
}

function nowIso() {
  return new Date().toISOString()
}

function safeJsonParse(value: unknown): Record<string, any> | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || typeof parsed !== "object") return null
    return parsed as any
  } catch {
    return null
  }
}

function getGroupAdminEmails(): string[] {
  const raw =
    process.env.GROUP_ADMIN_EMAILS ||
    // Default as requested
    "kebinandrescontreras@gmail.com,rafael.torres@saber.uis.edu.co"
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function isGroupAdminEmail(email: string | null | undefined) {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!normalized) return false
  return getGroupAdminEmails().includes(normalized)
}

function adminDefaultMemberCategory(email: string) {
  const normalized = email.trim().toLowerCase()
  if (normalized === "kebinandrescontreras@gmail.com") {
    return { memberCategory: "Estudiante de doctorado", academicLevel: "DOCTORADO" }
  }
  return null
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
      display_name TEXT,
      public_email TEXT,
      linkedin_url TEXT,
      researchgate_url TEXT,
      scholar_url TEXT,
      photo_url TEXT,
      academic_level TEXT,
      member_category TEXT,
      director_id TEXT,
      director_name TEXT,
      group_member BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS doc_embed_url TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS public_email TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS researchgate_url TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS scholar_url TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_level TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS member_category TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS director_id TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS director_name TEXT;`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS group_member BOOLEAN NOT NULL DEFAULT FALSE;`

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

  await sql`
    CREATE TABLE IF NOT EXISTS news (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      title TEXT,
      description TEXT,
      summary TEXT,
      date TEXT,
      image TEXT,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      category TEXT,
      tags TEXT DEFAULT '[]',
      author TEXT,
      read_time TEXT,
      content TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS publications (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      journal TEXT NOT NULL,
      conference TEXT,
      year INTEGER NOT NULL,
      image TEXT,
      pdf_url TEXT NOT NULL,
      external_url TEXT NOT NULL,
      supplementary_material TEXT,
      starred BOOLEAN NOT NULL DEFAULT FALSE,
      abstract TEXT NOT NULL,
      keywords TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS membership_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_by TEXT,
      resolved_at TEXT
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS group_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      url TEXT,
      meta TEXT,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
  `

  // Migrations for older Postgres schemas
  try {
    await sql`ALTER TABLE news ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;`
  } catch {}
  try {
    await sql`ALTER TABLE publications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;`
  } catch {}
  try {
    await sql`ALTER TABLE news ALTER COLUMN title DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN description DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN summary DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN date DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN image DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN category DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN tags DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN author DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN read_time DROP NOT NULL;`
    await sql`ALTER TABLE news ALTER COLUMN tags SET DEFAULT '[]';`
  } catch {}

  await sql`ALTER TABLE news ADD COLUMN IF NOT EXISTS created_by TEXT;`
  await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta TEXT;`

  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);`
  await sql`CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);`
  await sql`CREATE INDEX IF NOT EXISTS idx_publications_year ON publications(year);`
  await sql`CREATE INDEX IF NOT EXISTS idx_membership_requests_user ON membership_requests(user_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);`
  await sql`CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at);`
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);`
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at);`

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
      display_name TEXT,
      public_email TEXT,
      linkedin_url TEXT,
      researchgate_url TEXT,
      scholar_url TEXT,
      photo_url TEXT,
      academic_level TEXT,
      member_category TEXT,
      director_id TEXT,
      director_name TEXT,
      group_member INTEGER NOT NULL DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      summary TEXT NOT NULL,
      date TEXT NOT NULL,
      image TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      tags TEXT NOT NULL,
      author TEXT NOT NULL,
      read_time TEXT NOT NULL,
      content TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_news_date ON news(date);

    CREATE TABLE IF NOT EXISTS publications (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      journal TEXT NOT NULL,
      conference TEXT,
      year INTEGER NOT NULL,
      image TEXT,
      pdf_url TEXT NOT NULL,
      external_url TEXT NOT NULL,
      supplementary_material TEXT,
      starred INTEGER NOT NULL DEFAULT 0,
      abstract TEXT NOT NULL,
      keywords TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_publications_year ON publications(year);

    CREATE TABLE IF NOT EXISTS membership_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_by TEXT,
      resolved_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_membership_requests_user ON membership_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);

    CREATE TABLE IF NOT EXISTS group_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      url TEXT,
      meta TEXT,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at);
  `)

  // Lightweight migration for existing SQLite DBs
  const userCols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>
  const hasDocEmbed = userCols.some((c) => c.name === "doc_embed_url")
  if (!hasDocEmbed) {
    db.exec(`ALTER TABLE users ADD COLUMN doc_embed_url TEXT;`)
  }
  const ensureUserCol = (name: string, ddl: string) => {
    const cols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>
    const has = cols.some((c) => c.name === name)
    if (!has) db.exec(ddl)
  }
  ensureUserCol("display_name", `ALTER TABLE users ADD COLUMN display_name TEXT;`)
  ensureUserCol("public_email", `ALTER TABLE users ADD COLUMN public_email TEXT;`)
  ensureUserCol("linkedin_url", `ALTER TABLE users ADD COLUMN linkedin_url TEXT;`)
  ensureUserCol("researchgate_url", `ALTER TABLE users ADD COLUMN researchgate_url TEXT;`)
  ensureUserCol("scholar_url", `ALTER TABLE users ADD COLUMN scholar_url TEXT;`)
  ensureUserCol("photo_url", `ALTER TABLE users ADD COLUMN photo_url TEXT;`)
  ensureUserCol("academic_level", `ALTER TABLE users ADD COLUMN academic_level TEXT;`)
  ensureUserCol("member_category", `ALTER TABLE users ADD COLUMN member_category TEXT;`)
  ensureUserCol("director_id", `ALTER TABLE users ADD COLUMN director_id TEXT;`)
  ensureUserCol("director_name", `ALTER TABLE users ADD COLUMN director_name TEXT;`)
  ensureUserCol("group_member", `ALTER TABLE users ADD COLUMN group_member INTEGER NOT NULL DEFAULT 0;`)

  const newsCols = db.prepare(`PRAGMA table_info(news)`).all() as Array<{ name: string }>
  const hasNewsCreatedBy = newsCols.some((c) => c.name === "created_by")
  if (!hasNewsCreatedBy) {
    db.exec(`ALTER TABLE news ADD COLUMN created_by TEXT;`)
  }

  const notifCols = db.prepare(`PRAGMA table_info(notifications)`).all() as Array<{ name: string }>
  const hasNotifMeta = notifCols.some((c) => c.name === "meta")
  if (!hasNotifMeta) {
    db.exec(`ALTER TABLE notifications ADD COLUMN meta TEXT;`)
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
        display_name: string | null
        public_email: string | null
        linkedin_url: string | null
        researchgate_url: string | null
        scholar_url: string | null
        photo_url: string | null
        academic_level: string | null
        member_category: string | null
        director_id: string | null
        director_name: string | null
        group_member: boolean
        created_at: string
        updated_at: string
      }>
    >`SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url,
        display_name, public_email, linkedin_url, researchgate_url, scholar_url, photo_url, academic_level, member_category, director_id, director_name, group_member,
        created_at, updated_at
      FROM users WHERE email = ${email} LIMIT 1`

    const row = rows[0]
    if (!row) return null
    const user: User = {
      id: row.id,
      email: row.email,
      name: row.name,
      displayName: row.display_name ?? null,
      publicEmail: row.public_email ?? null,
      linkedinUrl: row.linkedin_url ?? null,
      researchgateUrl: row.researchgate_url ?? null,
      scholarUrl: row.scholar_url ?? null,
      photoUrl: row.photo_url ?? null,
      academicLevel: row.academic_level ?? null,
      memberCategory: row.member_category ?? null,
      directorId: row.director_id ?? null,
      directorName: row.director_name ?? null,
      groupMember: Boolean(row.group_member),
      passwordHash: row.password_hash,
      role: row.role,
      driveEmbedUrl: row.drive_embed_url ?? null,
      docEmbedUrl: row.doc_embed_url ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    // Bootstrap admins: ensure they are group members and have defaults.
    if (isGroupAdminEmail(user.email) && !user.groupMember) {
      await setUserGroupMember(user.id, true).catch(() => {})
      user.groupMember = true
    }
    const defaults = adminDefaultMemberCategory(user.email)
    if (defaults && (!user.memberCategory || !user.academicLevel)) {
      await updateUserProfile(user.id, {
        memberCategory: user.memberCategory ?? defaults.memberCategory,
        academicLevel: user.academicLevel ?? defaults.academicLevel,
      }).catch(() => {})
      user.memberCategory = user.memberCategory ?? defaults.memberCategory
      user.academicLevel = user.academicLevel ?? defaults.academicLevel
    }

    return user
  }

  const db = getSqliteDb()
  const row = db
    .prepare(
      `SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url,
        display_name, public_email, linkedin_url, researchgate_url, scholar_url, photo_url, academic_level, member_category, director_id, director_name, group_member,
        created_at, updated_at
       FROM users WHERE email = ? LIMIT 1`,
    )
    .get(email) as any
  if (!row) return null
  const user: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    displayName: row.display_name ?? null,
    publicEmail: row.public_email ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    researchgateUrl: row.researchgate_url ?? null,
    scholarUrl: row.scholar_url ?? null,
    photoUrl: row.photo_url ?? null,
    academicLevel: row.academic_level ?? null,
    memberCategory: row.member_category ?? null,
    directorId: row.director_id ?? null,
    directorName: row.director_name ?? null,
    groupMember: Boolean(row.group_member),
    passwordHash: row.password_hash,
    role: row.role,
    driveEmbedUrl: row.drive_embed_url ?? null,
    docEmbedUrl: row.doc_embed_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  if (isGroupAdminEmail(user.email) && !user.groupMember) {
    await setUserGroupMember(user.id, true).catch(() => {})
    user.groupMember = true
  }
  const defaults = adminDefaultMemberCategory(user.email)
  if (defaults && (!user.memberCategory || !user.academicLevel)) {
    await updateUserProfile(user.id, {
      memberCategory: user.memberCategory ?? defaults.memberCategory,
      academicLevel: user.academicLevel ?? defaults.academicLevel,
    }).catch(() => {})
    user.memberCategory = user.memberCategory ?? defaults.memberCategory
    user.academicLevel = user.academicLevel ?? defaults.academicLevel
  }

  return user
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
        display_name: string | null
        public_email: string | null
        linkedin_url: string | null
        researchgate_url: string | null
        scholar_url: string | null
        photo_url: string | null
        academic_level: string | null
        member_category: string | null
        director_id: string | null
        director_name: string | null
        group_member: boolean
        created_at: string
        updated_at: string
      }>
    >`SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url,
        display_name, public_email, linkedin_url, researchgate_url, scholar_url, photo_url, academic_level, member_category, director_id, director_name, group_member,
        created_at, updated_at
      FROM users WHERE id = ${id} LIMIT 1`

    const row = rows[0]
    if (!row) return null
    const user: User = {
      id: row.id,
      email: row.email,
      name: row.name,
      displayName: row.display_name ?? null,
      publicEmail: row.public_email ?? null,
      linkedinUrl: row.linkedin_url ?? null,
      researchgateUrl: row.researchgate_url ?? null,
      scholarUrl: row.scholar_url ?? null,
      photoUrl: row.photo_url ?? null,
      academicLevel: row.academic_level ?? null,
      memberCategory: row.member_category ?? null,
      directorId: row.director_id ?? null,
      directorName: row.director_name ?? null,
      groupMember: Boolean(row.group_member),
      passwordHash: row.password_hash,
      role: row.role,
      driveEmbedUrl: row.drive_embed_url ?? null,
      docEmbedUrl: row.doc_embed_url ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    if (isGroupAdminEmail(user.email) && !user.groupMember) {
      await setUserGroupMember(user.id, true).catch(() => {})
      user.groupMember = true
    }
    const defaults = adminDefaultMemberCategory(user.email)
    if (defaults && (!user.memberCategory || !user.academicLevel)) {
      await updateUserProfile(user.id, {
        memberCategory: user.memberCategory ?? defaults.memberCategory,
        academicLevel: user.academicLevel ?? defaults.academicLevel,
      }).catch(() => {})
      user.memberCategory = user.memberCategory ?? defaults.memberCategory
      user.academicLevel = user.academicLevel ?? defaults.academicLevel
    }

    return user
  }

  const db = getSqliteDb()
  const row = db
    .prepare(
      `SELECT id, email, name, password_hash, role, drive_embed_url, doc_embed_url,
        display_name, public_email, linkedin_url, researchgate_url, scholar_url, photo_url, academic_level, member_category, director_id, director_name, group_member,
        created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
    )
    .get(id) as any
  if (!row) return null
  const user: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    displayName: row.display_name ?? null,
    publicEmail: row.public_email ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    researchgateUrl: row.researchgate_url ?? null,
    scholarUrl: row.scholar_url ?? null,
    photoUrl: row.photo_url ?? null,
    academicLevel: row.academic_level ?? null,
    memberCategory: row.member_category ?? null,
    directorId: row.director_id ?? null,
    directorName: row.director_name ?? null,
    groupMember: Boolean(row.group_member),
    passwordHash: row.password_hash,
    role: row.role,
    driveEmbedUrl: row.drive_embed_url ?? null,
    docEmbedUrl: row.doc_embed_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  if (isGroupAdminEmail(user.email) && !user.groupMember) {
    await setUserGroupMember(user.id, true).catch(() => {})
    user.groupMember = true
  }
  const defaults = adminDefaultMemberCategory(user.email)
  if (defaults && (!user.memberCategory || !user.academicLevel)) {
    await updateUserProfile(user.id, {
      memberCategory: user.memberCategory ?? defaults.memberCategory,
      academicLevel: user.academicLevel ?? defaults.academicLevel,
    }).catch(() => {})
    user.memberCategory = user.memberCategory ?? defaults.memberCategory
    user.academicLevel = user.academicLevel ?? defaults.academicLevel
  }

  return user
}

export async function createUser(input: {
  name: string
  email: string
  passwordHash: string
  role?: Role
  academicLevel?: string | null
  memberCategory?: string | null
}): Promise<User> {
  const id = crypto.randomUUID()
  const createdAt = nowIso()
  const updatedAt = createdAt
  const role = input.role ?? "STUDENT"
  const academicLevel = input.academicLevel ?? null
  const memberCategory = input.memberCategory ?? null
  const displayName = input.name

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()

    await sql`
      INSERT INTO users (id, email, name, display_name, password_hash, role, academic_level, member_category, created_at, updated_at)
      VALUES (${id}, ${input.email}, ${input.name}, ${displayName}, ${input.passwordHash}, ${role}, ${academicLevel}, ${memberCategory}, ${createdAt}, ${updatedAt})
    `
  } else {
    const db = getSqliteDb()
    db.prepare(
      `INSERT INTO users (id, email, name, display_name, password_hash, role, academic_level, member_category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.email, input.name, displayName, input.passwordHash, role, academicLevel, memberCategory, createdAt, updatedAt)
  }

  return {
    id,
    email: input.email,
    name: input.name,
    displayName,
    publicEmail: null,
    linkedinUrl: null,
    researchgateUrl: null,
    scholarUrl: null,
    photoUrl: null,
    academicLevel,
    memberCategory,
    directorId: null,
    directorName: null,
    groupMember: false,
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

export async function updateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const updatedAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = ${updatedAt} WHERE id = ${userId}`
    return
  }
  const db = getSqliteDb()
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(passwordHash, updatedAt, userId)
}

export async function updateUserProfile(
  userId: string,
  input: {
    displayName?: string | null
    publicEmail?: string | null
    linkedinUrl?: string | null
    researchgateUrl?: string | null
    scholarUrl?: string | null
    photoUrl?: string | null
    academicLevel?: string | null
    memberCategory?: string | null
    directorId?: string | null
    directorName?: string | null
  },
): Promise<void> {
  const updatedAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE users SET
      display_name = COALESCE(${input.displayName ?? null}, display_name),
      public_email = COALESCE(${input.publicEmail ?? null}, public_email),
      linkedin_url = COALESCE(${input.linkedinUrl ?? null}, linkedin_url),
      researchgate_url = COALESCE(${input.researchgateUrl ?? null}, researchgate_url),
      scholar_url = COALESCE(${input.scholarUrl ?? null}, scholar_url),
      photo_url = COALESCE(${input.photoUrl ?? null}, photo_url),
      academic_level = COALESCE(${input.academicLevel ?? null}, academic_level),
      member_category = COALESCE(${input.memberCategory ?? null}, member_category),
      director_id = COALESCE(${input.directorId ?? null}, director_id),
      director_name = COALESCE(${input.directorName ?? null}, director_name),
      updated_at = ${updatedAt}
      WHERE id = ${userId}`
    return
  }

  const db = getSqliteDb()
  db.prepare(
    `UPDATE users SET
      display_name = COALESCE(?, display_name),
      public_email = COALESCE(?, public_email),
      linkedin_url = COALESCE(?, linkedin_url),
      researchgate_url = COALESCE(?, researchgate_url),
      scholar_url = COALESCE(?, scholar_url),
      photo_url = COALESCE(?, photo_url),
      academic_level = COALESCE(?, academic_level),
      member_category = COALESCE(?, member_category),
      director_id = COALESCE(?, director_id),
      director_name = COALESCE(?, director_name),
      updated_at = ?
     WHERE id = ?`,
  ).run(
    input.displayName ?? null,
    input.publicEmail ?? null,
    input.linkedinUrl ?? null,
    input.researchgateUrl ?? null,
    input.scholarUrl ?? null,
    input.photoUrl ?? null,
    input.academicLevel ?? null,
    input.memberCategory ?? null,
    input.directorId ?? null,
    input.directorName ?? null,
    updatedAt,
    userId,
  )
}

export async function setUserGroupMember(userId: string, groupMember: boolean): Promise<void> {
  const updatedAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE users SET group_member = ${groupMember}, updated_at = ${updatedAt} WHERE id = ${userId}`
    return
  }
  const db = getSqliteDb()
  db.prepare(`UPDATE users SET group_member = ?, updated_at = ? WHERE id = ?`).run(groupMember ? 1 : 0, updatedAt, userId)
}

export async function listProfessors(): Promise<Array<Pick<User, "id" | "name" | "email">>> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = await sql<Array<{ id: string; name: string; email: string }>>`SELECT id, name, email FROM users WHERE role = 'PROFESSOR' ORDER BY name ASC`
    return rows
  }
  const db = getSqliteDb()
  const rows = db.prepare(`SELECT id, name, email FROM users WHERE role = 'PROFESSOR' ORDER BY name ASC`).all() as any[]
  return rows.map((r) => ({ id: r.id, name: r.name, email: r.email }))
}

export async function createMembershipRequest(userId: string): Promise<MembershipRequest> {
  const createdAt = nowIso()
  const id = crypto.randomUUID()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const existing = (await sql`SELECT id FROM membership_requests WHERE user_id = ${userId} AND status = 'PENDING' LIMIT 1`) as any[]
    if (existing[0]?.id) throw new Error("Ya existe una solicitud pendiente.")
    await sql`INSERT INTO membership_requests (id, user_id, status, created_at) VALUES (${id}, ${userId}, 'PENDING', ${createdAt})`
    return { id, userId, status: "PENDING", createdAt, resolvedBy: null, resolvedAt: null }
  }

  const db = getSqliteDb()
  const existing = db
    .prepare(`SELECT id FROM membership_requests WHERE user_id = ? AND status = 'PENDING' LIMIT 1`)
    .get(userId) as any
  if (existing?.id) throw new Error("Ya existe una solicitud pendiente.")
  db.prepare(`INSERT INTO membership_requests (id, user_id, status, created_at) VALUES (?, ?, 'PENDING', ?)`).run(
    id,
    userId,
    createdAt,
  )
  return { id, userId, status: "PENDING", createdAt, resolvedBy: null, resolvedAt: null }
}

export async function getPendingMembershipRequestForUser(userId: string): Promise<MembershipRequest | null> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id, user_id, status, created_at, resolved_by, resolved_at
      FROM membership_requests WHERE user_id = ${userId} AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`) as any[]
    const r = rows[0]
    if (!r) return null
    return {
      id: r.id,
      userId: r.user_id,
      status: r.status,
      createdAt: r.created_at,
      resolvedBy: r.resolved_by ?? null,
      resolvedAt: r.resolved_at ?? null,
    }
  }
  const db = getSqliteDb()
  const r = db
    .prepare(
      `SELECT id, user_id, status, created_at, resolved_by, resolved_at
       FROM membership_requests WHERE user_id = ? AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId) as any
  if (!r) return null
  return {
    id: r.id,
    userId: r.user_id,
    status: r.status,
    createdAt: r.created_at,
    resolvedBy: r.resolved_by ?? null,
    resolvedAt: r.resolved_at ?? null,
  }
}

export async function listPendingMembershipRequests(): Promise<
  Array<{ request: MembershipRequest; user: Pick<User, "id" | "name" | "email"> }>
> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT r.id as request_id, r.user_id, r.status, r.created_at, r.resolved_by, r.resolved_at,
      u.id as u_id, u.name as u_name, u.email as u_email
      FROM membership_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'PENDING'
      ORDER BY r.created_at ASC`) as any[]
    return rows.map((r) => ({
      request: {
        id: r.request_id,
        userId: r.user_id,
        status: r.status,
        createdAt: r.created_at,
        resolvedBy: r.resolved_by ?? null,
        resolvedAt: r.resolved_at ?? null,
      },
      user: { id: r.u_id, name: r.u_name, email: r.u_email },
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT r.id as request_id, r.user_id, r.status, r.created_at, r.resolved_by, r.resolved_at,
        u.id as u_id, u.name as u_name, u.email as u_email
       FROM membership_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.status = 'PENDING'
       ORDER BY r.created_at ASC`,
    )
    .all() as any[]
  return rows.map((r) => ({
    request: {
      id: r.request_id,
      userId: r.user_id,
      status: r.status,
      createdAt: r.created_at,
      resolvedBy: r.resolved_by ?? null,
      resolvedAt: r.resolved_at ?? null,
    },
    user: { id: r.u_id, name: r.u_name, email: r.u_email },
  }))
}

export async function resolveMembershipRequest(input: {
  requestId: string
  status: Exclude<MembershipRequestStatus, "PENDING">
  resolvedBy: string
}): Promise<void> {
  const resolvedAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`UPDATE membership_requests
      SET status = ${input.status}, resolved_by = ${input.resolvedBy}, resolved_at = ${resolvedAt}
      WHERE id = ${input.requestId} AND status = 'PENDING'`
    return
  }
  const db = getSqliteDb()
  db.prepare(
    `UPDATE membership_requests
     SET status = ?, resolved_by = ?, resolved_at = ?
     WHERE id = ? AND status = 'PENDING'`,
  ).run(input.status, input.resolvedBy, resolvedAt, input.requestId)
}

export async function listTeamMembers(): Promise<
  Array<Pick<User, "id" | "name" | "displayName" | "publicEmail" | "photoUrl" | "academicLevel" | "memberCategory" | "researchgateUrl" | "scholarUrl" | "linkedinUrl" | "role">>
> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id, name, display_name, public_email, photo_url, academic_level, member_category, researchgate_url, scholar_url, linkedin_url, role
      FROM users WHERE group_member = TRUE ORDER BY role = 'PROFESSOR' DESC, name ASC`) as any[]
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      displayName: r.display_name ?? null,
      publicEmail: r.public_email ?? null,
      photoUrl: r.photo_url ?? null,
      academicLevel: r.academic_level ?? null,
      memberCategory: r.member_category ?? null,
      researchgateUrl: r.researchgate_url ?? null,
      scholarUrl: r.scholar_url ?? null,
      linkedinUrl: r.linkedin_url ?? null,
      role: r.role,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, name, display_name, public_email, photo_url, academic_level, member_category, researchgate_url, scholar_url, linkedin_url, role
       FROM users WHERE group_member = 1 ORDER BY CASE WHEN role = 'PROFESSOR' THEN 0 ELSE 1 END, name ASC`,
    )
    .all() as any[]
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.display_name ?? null,
    publicEmail: r.public_email ?? null,
    photoUrl: r.photo_url ?? null,
    academicLevel: r.academic_level ?? null,
    memberCategory: r.member_category ?? null,
    researchgateUrl: r.researchgate_url ?? null,
    scholarUrl: r.scholar_url ?? null,
    linkedinUrl: r.linkedin_url ?? null,
    role: r.role,
  }))
}

export async function createGroupMessage(userId: string, message: string): Promise<GroupMessage> {
  const createdAt = nowIso()
  const id = crypto.randomUUID()
  const trimmed = message.trim()
  if (!trimmed) throw new Error("Mensaje vacío")

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`INSERT INTO group_messages (id, user_id, message, created_at) VALUES (${id}, ${userId}, ${trimmed}, ${createdAt})`
  } else {
    const db = getSqliteDb()
    db.prepare(`INSERT INTO group_messages (id, user_id, message, created_at) VALUES (?, ?, ?, ?)`).run(
      id,
      userId,
      trimmed,
      createdAt,
    )
  }

  const user = await getUserById(userId)
  return {
    id,
    userId,
    userName: user?.displayName || user?.name || "Usuario",
    message: trimmed,
    createdAt,
  }
}

export async function listGroupMessages(limit: number): Promise<GroupMessage[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)))
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT m.id, m.user_id, m.message, m.created_at, u.name, u.display_name
      FROM group_messages m
      JOIN users u ON u.id = m.user_id
      ORDER BY m.created_at DESC
      LIMIT ${safeLimit}`) as any[]
    return rows
      .map((r) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.display_name ?? r.name ?? "Usuario",
        message: r.message,
        createdAt: r.created_at,
      }))
      .reverse()
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT m.id, m.user_id, m.message, m.created_at, u.name, u.display_name
       FROM group_messages m
       JOIN users u ON u.id = m.user_id
       ORDER BY m.created_at DESC
       LIMIT ?`,
    )
    .all(safeLimit) as any[]
  return rows
    .map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.display_name ?? r.name ?? "Usuario",
      message: r.message,
      createdAt: r.created_at,
    }))
    .reverse()
}

export async function createNotification(
  input: Omit<Notification, "createdAt" | "readAt" | "id"> & { id?: string },
): Promise<Notification> {
  const createdAt = nowIso()
  const id = input.id || crypto.randomUUID()
  const readAt = null
  const metaJson = input.meta ? JSON.stringify(input.meta) : null

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`INSERT INTO notifications (id, user_id, type, title, body, url, meta, created_at, read_at)
      VALUES (${id}, ${input.userId}, ${input.type}, ${input.title}, ${input.body}, ${input.url}, ${metaJson}, ${createdAt}, ${readAt})`
    return { ...(input as any), id, createdAt, readAt }
  }

  const db = getSqliteDb()
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, url, meta, created_at, read_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, input.userId, input.type, input.title, input.body ?? null, input.url ?? null, metaJson, createdAt, readAt)
  return { ...(input as any), id, createdAt, readAt }
}

export async function listNotificationsForUser(userId: string, limit: number): Promise<Notification[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)))
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id, user_id, type, title, body, url, meta, created_at, read_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`) as any[]
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body ?? null,
      url: r.url ?? null,
      meta: safeJsonParse(r.meta),
      createdAt: r.created_at,
      readAt: r.read_at ?? null,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, user_id, type, title, body, url, meta, created_at, read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(userId, safeLimit) as any[]
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    body: r.body ?? null,
    url: r.url ?? null,
    meta: safeJsonParse(r.meta),
    createdAt: r.created_at,
    readAt: r.read_at ?? null,
  }))
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT COUNT(*)::int as c FROM notifications WHERE user_id = ${userId} AND read_at IS NULL`) as any[]
    return Number(rows?.[0]?.c ?? 0)
  }
  const db = getSqliteDb()
  const row = db.prepare(`SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL`).get(userId) as any
  return Number(row?.c ?? 0)
}

export async function markNotificationRead(userId: string, notificationId: string | null): Promise<void> {
  const readAt = nowIso()
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    if (notificationId) {
      await sql`UPDATE notifications SET read_at = ${readAt} WHERE id = ${notificationId} AND user_id = ${userId}`
    } else {
      await sql`UPDATE notifications SET read_at = ${readAt} WHERE user_id = ${userId} AND read_at IS NULL`
    }
    return
  }

  const db = getSqliteDb()
  if (notificationId) {
    db.prepare(`UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?`).run(readAt, notificationId, userId)
  } else {
    db.prepare(`UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`).run(readAt, userId)
  }
}

export async function getUserIdsByEmails(emails: string[]): Promise<string[]> {
  const normalized = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)))
  if (normalized.length === 0) return []

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id FROM users WHERE email = ANY(${normalized}::text[])`) as any[]
    return rows.map((r) => String(r.id))
  }

  const db = getSqliteDb()
  const placeholders = normalized.map(() => "?").join(",")
  const rows = db.prepare(`SELECT id FROM users WHERE email IN (${placeholders})`).all(...normalized) as any[]
  return rows.map((r) => String(r.id))
}

export async function listNotifiableUserIds(): Promise<string[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id FROM users WHERE group_member = TRUE OR role = 'PROFESSOR'`) as any[]
    return rows.map((r) => String(r.id))
  }
  const db = getSqliteDb()
  const rows = db.prepare(`SELECT id FROM users WHERE group_member = 1 OR role = 'PROFESSOR'`).all() as any[]
  return rows.map((r) => String(r.id))
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
      FROM users WHERE role IN ('PROFESSIONAL', 'GUEST', 'STUDENT', 'EXTERNAL_RESEARCHER', 'EDITOR_NOTICIAS') ORDER BY name ASC`

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
       FROM users WHERE role IN ('PROFESSIONAL','GUEST','STUDENT','EXTERNAL_RESEARCHER','EDITOR_NOTICIAS') ORDER BY name ASC`,
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

export async function listStudentsByDirector(
  directorId: string,
): Promise<Array<Pick<User, "id" | "name" | "email" | "driveEmbedUrl" | "docEmbedUrl" | "updatedAt">>> {
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
      FROM users
      WHERE role IN ('STUDENT', 'EXTERNAL_RESEARCHER', 'PROFESSIONAL', 'GUEST', 'EDITOR_NOTICIAS')
        AND director_id = ${directorId}
      ORDER BY name ASC`

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
       FROM users
       WHERE role IN ('STUDENT','EXTERNAL_RESEARCHER','PROFESSIONAL','GUEST','EDITOR_NOTICIAS')
         AND director_id = ?
       ORDER BY name ASC`,
    )
    .all(directorId) as any[]

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    driveEmbedUrl: r.drive_embed_url ?? null,
    docEmbedUrl: r.doc_embed_url ?? null,
    updatedAt: r.updated_at,
  }))
}

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((t) => String(t)).filter(Boolean)
  } catch {
    // ignore
  }
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function stringifyTags(tags: string[]) {
  return JSON.stringify(tags ?? [])
}

export async function listNews(): Promise<NewsItem[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at
      FROM news ORDER BY date DESC, featured DESC, id DESC`) as any[]
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description,
      summary: r.summary,
      date: r.date,
      image: r.image,
      featured: Boolean(r.featured),
      category: r.category,
      tags: parseTags(r.tags ?? "[]"),
      author: r.author,
      readTime: r.read_time,
      content: r.content ?? null,
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at
       FROM news ORDER BY date DESC, featured DESC, id DESC`,
    )
    .all() as any[]
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    description: r.description,
    summary: r.summary,
    date: r.date,
    image: r.image,
    featured: Boolean(r.featured),
    category: r.category,
    tags: parseTags(r.tags ?? "[]"),
    author: r.author,
    readTime: r.read_time,
    content: r.content ?? null,
    createdBy: r.created_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function listNewsByUser(userId: string): Promise<NewsItem[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at
      FROM news WHERE created_by = ${userId} ORDER BY date DESC, featured DESC, id DESC`) as any[]
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description,
      summary: r.summary,
      date: r.date,
      image: r.image,
      featured: Boolean(r.featured),
      category: r.category,
      tags: parseTags(r.tags ?? "[]"),
      author: r.author,
      readTime: r.read_time,
      content: r.content ?? null,
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at
       FROM news WHERE created_by = ? ORDER BY date DESC, featured DESC, id DESC`,
    )
    .all(userId) as any[]
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    description: r.description,
    summary: r.summary,
    date: r.date,
    image: r.image,
    featured: Boolean(r.featured),
    category: r.category,
    tags: parseTags(r.tags ?? "[]"),
    author: r.author,
    readTime: r.read_time,
    content: r.content ?? null,
    createdBy: r.created_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function getNewsOwner(id: number): Promise<string | null> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT created_by FROM news WHERE id = ${id} LIMIT 1`) as any[]
    return rows?.[0]?.created_by ?? null
  }
  const db = getSqliteDb()
  const row = db.prepare(`SELECT created_by FROM news WHERE id = ? LIMIT 1`).get(id) as any
  return row?.created_by ?? null
}

export async function createNews(
  input: Omit<NewsItem, "id" | "createdAt" | "updatedAt" | "createdBy">,
  userId: string,
): Promise<NewsItem> {
  const createdAt = nowIso()
  const updatedAt = createdAt
  const tags = stringifyTags(input.tags || [])

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`INSERT INTO news (title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at)
      VALUES (${input.title}, ${input.description}, ${input.summary}, ${input.date}, ${input.image}, ${input.featured}, ${input.category}, ${tags}, ${input.author}, ${input.readTime}, ${input.content}, ${userId}, ${createdAt}, ${updatedAt})
      RETURNING id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at`) as any[]
    const r = rows[0]
    return {
      id: Number(r.id),
      title: r.title,
      description: r.description,
      summary: r.summary,
      date: r.date,
      image: r.image,
      featured: Boolean(r.featured),
      category: r.category,
      tags: parseTags(r.tags ?? "[]"),
      author: r.author,
      readTime: r.read_time,
      content: r.content ?? null,
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  const db = getSqliteDb()
  const info = db
    .prepare(
      `INSERT INTO news (title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.description,
      input.summary,
      input.date,
      input.image,
      input.featured ? 1 : 0,
      input.category,
      tags,
      input.author,
      input.readTime,
      input.content ?? null,
      userId,
      createdAt,
      updatedAt,
    )
  const id = Number(info.lastInsertRowid)
  return {
    id,
    ...input,
    tags: input.tags || [],
    createdBy: userId,
    createdAt,
    updatedAt,
  }
}

export async function deleteNews(id: number): Promise<void> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`DELETE FROM news WHERE id = ${id}`
    return
  }
  const db = getSqliteDb()
  db.prepare(`DELETE FROM news WHERE id = ?`).run(id)
}

export async function updateNews(
  id: number,
  input: Partial<Omit<NewsItem, "id" | "createdAt" | "updatedAt" | "createdBy">>,
): Promise<NewsItem> {
  const updatedAt = nowIso()
  const tags = input.tags ? stringifyTags(input.tags) : undefined

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()

    const rows = (await sql`UPDATE news SET
      title = COALESCE(${input.title ?? null}, title),
      description = COALESCE(${input.description ?? null}, description),
      summary = COALESCE(${input.summary ?? null}, summary),
      date = COALESCE(${input.date ?? null}, date),
      image = COALESCE(${input.image ?? null}, image),
      featured = COALESCE(${typeof input.featured === "boolean" ? input.featured : null}, featured),
      category = COALESCE(${input.category ?? null}, category),
      tags = COALESCE(${tags ?? null}, tags),
      author = COALESCE(${input.author ?? null}, author),
      read_time = COALESCE(${input.readTime ?? null}, read_time),
      content = COALESCE(${input.content ?? null}, content),
      updated_at = ${updatedAt}
      WHERE id = ${id}
      RETURNING id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at`) as any[]
    const r = rows[0]
    if (!r) throw new Error("Not found")
    return {
      id: Number(r.id),
      title: r.title ?? "",
      description: r.description ?? "",
      summary: r.summary ?? "",
      date: r.date ?? "",
      image: r.image ?? "/placeholder.svg",
      featured: Boolean(r.featured),
      category: r.category ?? "",
      tags: parseTags(r.tags ?? "[]"),
      author: r.author ?? "",
      readTime: r.read_time ?? "",
      content: r.content ?? null,
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  const db = getSqliteDb()
  const current = db.prepare(`SELECT id FROM news WHERE id = ? LIMIT 1`).get(id) as any
  if (!current) throw new Error("Not found")

  db.prepare(
    `UPDATE news SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      summary = COALESCE(?, summary),
      date = COALESCE(?, date),
      image = COALESCE(?, image),
      featured = COALESCE(?, featured),
      category = COALESCE(?, category),
      tags = COALESCE(?, tags),
      author = COALESCE(?, author),
      read_time = COALESCE(?, read_time),
      content = COALESCE(?, content),
      updated_at = ?
     WHERE id = ?`,
  ).run(
    input.title ?? null,
    input.description ?? null,
    input.summary ?? null,
    input.date ?? null,
    input.image ?? null,
    typeof input.featured === "boolean" ? (input.featured ? 1 : 0) : null,
    input.category ?? null,
    tags ?? null,
    input.author ?? null,
    input.readTime ?? null,
    input.content ?? null,
    updatedAt,
    id,
  )

  const row = db
    .prepare(
      `SELECT id, title, description, summary, date, image, featured, category, tags, author, read_time, content, created_by, created_at, updated_at
       FROM news WHERE id = ? LIMIT 1`,
    )
    .get(id) as any
  return {
    id: Number(row.id),
    title: row.title ?? "",
    description: row.description ?? "",
    summary: row.summary ?? "",
    date: row.date ?? "",
    image: row.image ?? "/placeholder.svg",
    featured: Boolean(row.featured),
    category: row.category ?? "",
    tags: parseTags(row.tags ?? "[]"),
    author: row.author ?? "",
    readTime: row.read_time ?? "",
    content: row.content ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function parseKeywords(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map((t) => String(t)).filter(Boolean)
  } catch {
    // ignore
  }
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

function stringifyKeywords(keywords: string[]) {
  return JSON.stringify(keywords ?? [])
}

export async function listPublications(): Promise<Publication[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT id, title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at
      FROM publications ORDER BY year DESC, starred DESC, id DESC`) as any[]
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      authors: r.authors,
      journal: r.journal,
      conference: r.conference ?? null,
      year: Number(r.year),
      image: r.image ?? null,
      pdfUrl: r.pdf_url,
      externalUrl: r.external_url,
      supplementaryMaterial: r.supplementary_material ?? null,
      starred: Boolean(r.starred),
      abstract: r.abstract,
      keywords: parseKeywords(r.keywords ?? "[]"),
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  const db = getSqliteDb()
  const rows = db
    .prepare(
      `SELECT id, title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at
       FROM publications ORDER BY year DESC, starred DESC, id DESC`,
    )
    .all() as any[]
  return rows.map((r) => ({
    id: Number(r.id),
    title: r.title,
    authors: r.authors,
    journal: r.journal,
    conference: r.conference ?? null,
    year: Number(r.year),
    image: r.image ?? null,
    pdfUrl: r.pdf_url,
    externalUrl: r.external_url,
    supplementaryMaterial: r.supplementary_material ?? null,
    starred: Boolean(r.starred),
    abstract: r.abstract,
    keywords: parseKeywords(r.keywords ?? "[]"),
    createdBy: r.created_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function createPublication(
  userId: string | null,
  input: Omit<Publication, "id" | "createdAt" | "updatedAt" | "createdBy">,
): Promise<Publication> {
  const createdAt = nowIso()
  const updatedAt = createdAt
  const keywords = stringifyKeywords(input.keywords || [])

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`INSERT INTO publications (title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at)
      VALUES (${input.title}, ${input.authors}, ${input.journal}, ${input.conference}, ${input.year}, ${input.image}, ${input.pdfUrl}, ${input.externalUrl}, ${input.supplementaryMaterial}, ${input.starred}, ${input.abstract}, ${keywords}, ${userId}, ${createdAt}, ${updatedAt})
      RETURNING id, title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at`) as any[]
    const r = rows[0]
    return {
      id: Number(r.id),
      title: r.title,
      authors: r.authors,
      journal: r.journal,
      conference: r.conference ?? null,
      year: Number(r.year),
      image: r.image ?? null,
      pdfUrl: r.pdf_url,
      externalUrl: r.external_url,
      supplementaryMaterial: r.supplementary_material ?? null,
      starred: Boolean(r.starred),
      abstract: r.abstract,
      keywords: parseKeywords(r.keywords ?? "[]"),
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  const db = getSqliteDb()
  const info = db
    .prepare(
      `INSERT INTO publications (title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.authors,
      input.journal,
      input.conference ?? null,
      input.year,
      input.image ?? null,
      input.pdfUrl,
      input.externalUrl,
      input.supplementaryMaterial ?? null,
      input.starred ? 1 : 0,
      input.abstract,
      keywords,
      userId,
      createdAt,
      updatedAt,
    )
  const id = Number(info.lastInsertRowid)
  return {
    id,
    ...input,
    createdBy: userId,
    createdAt,
    updatedAt,
  }
}

export async function getPublicationOwner(id: number): Promise<string | null> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`SELECT created_by FROM publications WHERE id = ${id} LIMIT 1`) as any[]
    return rows?.[0]?.created_by ?? null
  }
  const db = getSqliteDb()
  const row = db.prepare(`SELECT created_by FROM publications WHERE id = ? LIMIT 1`).get(id) as any
  return row?.created_by ?? null
}

export async function deletePublication(id: number): Promise<void> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    await sql`DELETE FROM publications WHERE id = ${id}`
    return
  }
  const db = getSqliteDb()
  db.prepare(`DELETE FROM publications WHERE id = ?`).run(id)
}

export async function updatePublication(
  id: number,
  input: Partial<Omit<Publication, "id" | "createdAt" | "updatedAt" | "createdBy">>,
): Promise<Publication> {
  const updatedAt = nowIso()
  const keywords = input.keywords ? stringifyKeywords(input.keywords) : undefined

  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = (await sql`UPDATE publications SET
      title = COALESCE(${input.title ?? null}, title),
      authors = COALESCE(${input.authors ?? null}, authors),
      journal = COALESCE(${input.journal ?? null}, journal),
      conference = COALESCE(${input.conference ?? null}, conference),
      year = COALESCE(${typeof input.year === "number" ? input.year : null}, year),
      image = COALESCE(${input.image ?? null}, image),
      pdf_url = COALESCE(${input.pdfUrl ?? null}, pdf_url),
      external_url = COALESCE(${input.externalUrl ?? null}, external_url),
      supplementary_material = COALESCE(${input.supplementaryMaterial ?? null}, supplementary_material),
      starred = COALESCE(${typeof input.starred === "boolean" ? input.starred : null}, starred),
      abstract = COALESCE(${input.abstract ?? null}, abstract),
      keywords = COALESCE(${keywords ?? null}, keywords),
      updated_at = ${updatedAt}
      WHERE id = ${id}
      RETURNING id, title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at`) as any[]
    const r = rows[0]
    if (!r) throw new Error("Not found")
    return {
      id: Number(r.id),
      title: r.title,
      authors: r.authors,
      journal: r.journal,
      conference: r.conference ?? null,
      year: Number(r.year),
      image: r.image ?? null,
      pdfUrl: r.pdf_url,
      externalUrl: r.external_url,
      supplementaryMaterial: r.supplementary_material ?? null,
      starred: Boolean(r.starred),
      abstract: r.abstract,
      keywords: parseKeywords(r.keywords ?? "[]"),
      createdBy: r.created_by ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  const db = getSqliteDb()
  const current = db.prepare(`SELECT id FROM publications WHERE id = ? LIMIT 1`).get(id) as any
  if (!current) throw new Error("Not found")

  db.prepare(
    `UPDATE publications SET
      title = COALESCE(?, title),
      authors = COALESCE(?, authors),
      journal = COALESCE(?, journal),
      conference = COALESCE(?, conference),
      year = COALESCE(?, year),
      image = COALESCE(?, image),
      pdf_url = COALESCE(?, pdf_url),
      external_url = COALESCE(?, external_url),
      supplementary_material = COALESCE(?, supplementary_material),
      starred = COALESCE(?, starred),
      abstract = COALESCE(?, abstract),
      keywords = COALESCE(?, keywords),
      updated_at = ?
     WHERE id = ?`,
  ).run(
    input.title ?? null,
    input.authors ?? null,
    input.journal ?? null,
    input.conference ?? null,
    typeof input.year === "number" ? input.year : null,
    input.image ?? null,
    input.pdfUrl ?? null,
    input.externalUrl ?? null,
    input.supplementaryMaterial ?? null,
    typeof input.starred === "boolean" ? (input.starred ? 1 : 0) : null,
    input.abstract ?? null,
    keywords ?? null,
    updatedAt,
    id,
  )

  const row = db
    .prepare(
      `SELECT id, title, authors, journal, conference, year, image, pdf_url, external_url, supplementary_material, starred, abstract, keywords, created_by, created_at, updated_at
       FROM publications WHERE id = ? LIMIT 1`,
    )
    .get(id) as any
  return {
    id: Number(row.id),
    title: row.title,
    authors: row.authors,
    journal: row.journal,
    conference: row.conference ?? null,
    year: Number(row.year),
    image: row.image ?? null,
    pdfUrl: row.pdf_url,
    externalUrl: row.external_url,
    supplementaryMaterial: row.supplementary_material ?? null,
    starred: Boolean(row.starred),
    abstract: row.abstract,
    keywords: parseKeywords(row.keywords ?? "[]"),
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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

export async function listTasksByDate(date: string, createdBy?: string): Promise<Task[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = createdBy
      ? await sql<
          Array<{
            id: string
            date: string
            title: string
            description: string | null
            created_by: string
            created_at: string
          }>
        >`SELECT id, date, title, description, created_by, created_at
          FROM tasks
          WHERE date = ${date} AND created_by = ${createdBy}
          ORDER BY created_at DESC`
      : await sql<
          Array<{
            id: string
            date: string
            title: string
            description: string | null
            created_by: string
            created_at: string
          }>
        >`SELECT id, date, title, description, created_by, created_at
          FROM tasks
          WHERE date = ${date}
          ORDER BY created_at DESC`
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
       FROM tasks WHERE date = ? AND (? IS NULL OR created_by = ?) ORDER BY created_at DESC`,
    )
    .all(date, createdBy ?? null, createdBy ?? null) as any[]

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    description: r.description ?? null,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }))
}

export async function listTaskDatesInRange(from: string, to: string, createdBy?: string): Promise<string[]> {
  if (shouldUsePostgres()) {
    const sql = getPgSql()
    if (!sql) throw new Error("Database not configured: missing DATABASE_URL/POSTGRES_URL")
    await ensurePgSchema()
    const rows = createdBy
      ? await sql<Array<{ date: string }>>`SELECT DISTINCT date
          FROM tasks
          WHERE date >= ${from} AND date <= ${to} AND created_by = ${createdBy}
          ORDER BY date ASC`
      : await sql<Array<{ date: string }>>`SELECT DISTINCT date
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
         AND (? IS NULL OR created_by = ?)
       ORDER BY date ASC`,
    )
    .all(from, to, createdBy ?? null, createdBy ?? null) as any[]
  return rows.map((r) => r.date as string)
}
