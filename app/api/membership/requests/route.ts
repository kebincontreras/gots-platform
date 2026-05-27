import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { listPendingMembershipRequests } from "@/lib/store"

function isGroupAdmin(email: string | undefined | null) {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!normalized) return false
  const list = (process.env.GROUP_ADMIN_EMAILS ?? process.env.PROFESSOR_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(normalized)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  const email = (session?.user as any)?.email as string | undefined
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (role !== "PROFESSOR" || !isGroupAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const items = await listPendingMembershipRequests()
  return NextResponse.json({ requests: items })
}

