import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createMembershipRequest, getPendingMembershipRequestForUser, getUserById } from "@/lib/store"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  const pending = await getPendingMembershipRequestForUser(userId)
  return NextResponse.json({
    groupMember: Boolean(user?.groupMember),
    pendingRequest: pending ? { id: pending.id, createdAt: pending.createdAt } : null,
  })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const created = await createMembershipRequest(userId)
    return NextResponse.json({ ok: true, request: created })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "No se pudo crear la solicitud." }, { status: 400 })
  }
}

