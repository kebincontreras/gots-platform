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
    const requestedProfile = (body?.profile ?? "").toString().trim().toUpperCase()
    const memberCategoryRaw = (body?.memberCategory ?? "").toString().trim()

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

    const allowedStudentCategories = new Set([
      "Estudiante de doctorado",
      "Estudiante de maestría",
      "Estudiante de pregrado",
    ])

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado. Inicia sesión." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const emailRole = getRoleForEmail(email)
    let role: any = emailRole
    if (requestedProfile === "PROFESSIONAL" || requestedProfile === "PROFESIONAL") {
      role = "PROFESSIONAL"
    } else if (requestedProfile === "GUEST" || requestedProfile === "INVITADO") {
      role = "GUEST"
    } else if (requestedProfile === "EXTERNAL_RESEARCHER" || requestedProfile === "INVESTIGADOR_EXTERNO") {
      role = "EXTERNAL_RESEARCHER"
    } else if (requestedProfile === "PROFESSOR") {
      if (emailRole !== "PROFESSOR") {
        return NextResponse.json(
          { error: "No autorizado para perfil Profesor. Usa un correo autorizado o elige otro perfil." },
          { status: 403 },
        )
      }
      role = "PROFESSOR"
    } else if (requestedProfile === "STUDENT" || requestedProfile === "ESTUDIANTE" || requestedProfile === "") {
      role = "STUDENT"
    }

    // Safety: if email is in professor allowlist, always keep PROFESSOR.
    if (emailRole === "PROFESSOR") role = "PROFESSOR"

    const isStudent = role === "STUDENT"
    const memberCategory = isStudent ? memberCategoryRaw : ""

    if (isStudent) {
      if (!memberCategory || !allowedStudentCategories.has(memberCategory)) {
        return NextResponse.json(
          { error: "Selecciona tu categoría: doctorado, maestría o pregrado." },
          { status: 400 },
        )
      }
    }

    const academicLevel =
      memberCategory === "Estudiante de doctorado"
        ? "DOCTORADO"
        : memberCategory === "Estudiante de maestría"
          ? "MAESTRIA"
          : memberCategory === "Estudiante de pregrado"
            ? "PREGRADO"
            : null

    const user = await createUser({
      name,
      email,
      passwordHash,
      role,
      memberCategory: isStudent ? memberCategory : null,
      academicLevel: isStudent ? academicLevel : null,
    })

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
