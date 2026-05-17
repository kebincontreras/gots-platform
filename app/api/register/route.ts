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
  try {
    const body = await req.json().catch(() => null)
    const name = (body?.name ?? "").toString().trim()
    const email = (body?.email ?? "").toString().trim().toLowerCase()
    const emailConfirm = (body?.emailConfirm ?? "").toString().trim().toLowerCase()
    const password = (body?.password ?? "").toString()
    const passwordConfirm = (body?.passwordConfirm ?? "").toString()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos." }, { status: 400 })
    }
    if (emailConfirm && emailConfirm !== email) {
      return NextResponse.json({ error: "Los correos no coinciden." }, { status: 400 })
    }
    if (passwordConfirm && passwordConfirm !== password) {
      return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado. Inicia sesión." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({ name, email, passwordHash, role: getRoleForEmail(email) as any })

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (err: any) {
    const msg = (err?.message ?? "").toString()
    const isMissingDb =
      msg.toLowerCase().includes("database not configured") ||
      msg.toLowerCase().includes("missing database_url") ||
      msg.toLowerCase().includes("missing postgres_url")
    return NextResponse.json(
      {
        error: isMissingDb
          ? "Base de datos no conectada en Vercel. Crea y conecta Postgres (Neon) en Storage y redeploy."
          : "Error interno al crear la cuenta.",
      },
      { status: 500 },
    )
  }
}
