import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateUserRoleByEmail, type Role } from "@/lib/store"

function isRole(value: unknown): value is Role {
  return (
    value === "PROFESSIONAL" ||
    value === "GUEST" ||
    value === "STUDENT" ||
    value === "EXTERNAL_RESEARCHER" ||
    value === "PROFESSOR" ||
    value === "EDITOR_NOTICIAS"
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (role !== "PROFESSOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const email = (body?.email ?? "").toString().trim().toLowerCase()
  const targetRole = body?.role
  if (!email || !isRole(targetRole)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
  }

  await updateUserRoleByEmail(email, targetRole)
  return NextResponse.json({ ok: true })
}
