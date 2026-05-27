import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { markNotificationRead } from "@/lib/store"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const notificationId = body?.notificationId != null ? String(body.notificationId) : null
  await markNotificationRead(userId, notificationId && notificationId.trim() ? notificationId : null)
  return NextResponse.json({ ok: true })
}

