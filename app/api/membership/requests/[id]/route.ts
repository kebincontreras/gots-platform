import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createNotification, getUserById, listNotifiableUserIds, resolveMembershipRequest, setUserGroupMember } from "@/lib/store"

function isGroupAdmin(email: string | undefined | null) {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!normalized) return false
  const list = (process.env.GROUP_ADMIN_EMAILS ?? process.env.PROFESSOR_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(normalized)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const email = (session?.user as any)?.email as string | undefined
  const resolverId = (session?.user as any)?.id as string | undefined
  if (!session?.user || !resolverId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isGroupAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const action = (body?.action ?? "").toString().trim().toLowerCase()
  const userId = (body?.userId ?? "").toString().trim()
  if (!id || !userId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
  }

  const status = action === "approve" ? "APPROVED" : "REJECTED"
  await resolveMembershipRequest({ requestId: id, status: status as any, resolvedBy: resolverId })
  if (status === "APPROVED") {
    await setUserGroupMember(userId, true)
    const joinedUser = await getUserById(userId).catch(() => null)
    const recipients = await listNotifiableUserIds().catch(() => [])
    await Promise.all(
      recipients
        .filter((rid) => rid !== userId)
        .map((rid) =>
          createNotification({
            userId: rid,
            type: "MEMBER_JOINED",
            title: "Nuevo integrante en el equipo",
            body: joinedUser ? `${joinedUser.displayName || joinedUser.name} ahora hace parte del grupo.` : "Un nuevo integrante fue aprobado.",
            url: "/equipo",
          }),
        ),
    ).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
