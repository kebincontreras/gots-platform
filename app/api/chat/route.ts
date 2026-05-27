import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createGroupMessage, getUserById, listGroupMessages } from "@/lib/store"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  if (!user?.groupMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit") ?? "80")
  const messages = await listGroupMessages(Number.isFinite(limit) ? limit : 80)
  return NextResponse.json({ messages })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  if (!user?.groupMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const message = (body?.message ?? "").toString()
  try {
    const created = await createGroupMessage(userId, message)
    return NextResponse.json({ ok: true, message: created })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "No se pudo enviar." }, { status: 400 })
  }
}

