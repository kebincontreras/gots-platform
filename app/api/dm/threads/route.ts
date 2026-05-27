import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createOrGetDmThread, getUserById } from "@/lib/store"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  if (!user?.groupMember && user?.role !== "PROFESSOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const otherUserId = (body?.otherUserId ?? "").toString().trim()
  if (!otherUserId) return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 })

  const other = await getUserById(otherUserId)
  if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!other.groupMember && other.role !== "PROFESSOR") return NextResponse.json({ error: "User not in group" }, { status: 400 })

  const thread = await createOrGetDmThread(userId, otherUserId)
  return NextResponse.json({ thread })
}

