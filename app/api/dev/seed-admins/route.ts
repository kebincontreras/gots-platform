import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUser, getUserByEmail, setUserGroupMember, updateUserProfile } from "@/lib/store"

function isDev() {
  return process.env.NODE_ENV !== "production"
}

function hasPostgresUrl() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL)
}

function passwordFromEmail(email: string) {
  const local = email.split("@")[0] ?? ""
  if (local.length < 8) throw new Error("Derived password too short")
  return local
}

async function ensureUser(email: string, name: string, role: any) {
  const normalized = email.trim().toLowerCase()
  const existing = await getUserByEmail(normalized)
  const password = passwordFromEmail(normalized)
  if (existing) return { email: normalized, password, existed: true }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser({ name, email: normalized, passwordHash, role })
  await setUserGroupMember(user.id, true).catch(() => {})
  await updateUserProfile(user.id, { displayName: name, publicEmail: normalized }).catch(() => {})
  return { email: normalized, password, existed: false }
}

export async function POST() {
  if (!isDev()) return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  if (!hasPostgresUrl()) {
    return NextResponse.json(
      {
        error:
          "Falta DATABASE_URL (Neon) en .env.local. En local estás usando SQLite y no se puede inicializar el seed (better-sqlite3).",
      },
      { status: 500 },
    )
  }
  const rafael = await ensureUser("rafael.torres@saber.uis.edu.co", "Rafael Torres", "PROFESSOR")
  const kebin = await ensureUser("kebinandrescontreras@gmail.com", "Kebin Contreras", "PROFESSOR")
  return NextResponse.json({ ok: true, users: { rafael, kebin } })
}
