import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createDmMessage, getUserById, listDmMessages } from "@/lib/store"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  if (!user?.groupMember && user?.role !== "PROFESSOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit") ?? "120")
  try {
    const messages = await listDmMessages(id, userId, Number.isFinite(limit) ? limit : 120)
    return NextResponse.json({ messages })
  } catch (e: any) {
    const msg = (e?.message ?? "").toString()
    if (msg.toLowerCase().includes("forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: msg || "Error" }, { status: 400 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  if (!user?.groupMember && user?.role !== "PROFESSOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const message = (body?.message ?? "").toString()
  try {
    const created = await createDmMessage(id, userId, message)
    return NextResponse.json({ ok: true, message: created })
  } catch (e: any) {
    const msg = (e?.message ?? "").toString()
    if (msg.toLowerCase().includes("forbidden")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: msg || "Error" }, { status: 400 })
  }
}

