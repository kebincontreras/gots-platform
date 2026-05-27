import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import bcrypt from "bcryptjs"
import { authOptions } from "@/lib/auth"
import { getUserById, updateUserPasswordHash } from "@/lib/store"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const currentPassword = (body?.currentPassword ?? "").toString()
  const newPassword = (body?.newPassword ?? "").toString()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Faltan campos." }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 })
  }

  const user = await getUserById(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return NextResponse.json({ error: "Contraseña actual incorrecta." }, { status: 400 })

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await updateUserPasswordHash(userId, passwordHash)
  return NextResponse.json({ ok: true })
}

