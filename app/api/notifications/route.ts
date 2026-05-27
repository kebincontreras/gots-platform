import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { countUnreadNotifications, listNotificationsForUser } from "@/lib/store"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit") ?? "20")
  const safeLimit = Number.isFinite(limit) ? limit : 20

  const [items, unread] = await Promise.all([
    listNotificationsForUser(userId, safeLimit),
    countUnreadNotifications(userId),
  ])

  return NextResponse.json({ notifications: items, unread })
}

