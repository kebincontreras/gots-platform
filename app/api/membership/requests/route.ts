import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { listPendingMembershipRequests } from "@/lib/store"
import { isGroupAdmin } from "@/lib/gots-access-policy.mjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = (session?.user as any)?.email as string | undefined
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isGroupAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const items = await listPendingMembershipRequests()
  return NextResponse.json({ requests: items })
}

