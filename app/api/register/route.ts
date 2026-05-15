import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUser, getUserByEmail } from "@/lib/store"

function getRoleForEmail(email: string) {
  const list = (process.env.PROFESSOR_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase()) ? "PROFESSOR" : "STUDENT"
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const name = (body?.name ?? "").toString().trim()
  const email = (body?.email ?? "").toString().trim().toLowerCase()
  const password = (body?.password ?? "").toString()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 })
  }

  const existing = await getUserByEmail(email)
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser({ name, email, passwordHash, role: getRoleForEmail(email) as any })

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
