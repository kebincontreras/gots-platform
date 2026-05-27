import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createMembershipRequest, createNotification, getPendingMembershipRequestForUser, getUserById, getUserIdsByEmails } from "@/lib/store"

function getAdminEmails(): string[] {
  const raw =
    process.env.GROUP_ADMIN_EMAILS ||
    // Default as requested
    "kebinandrescontreras@gmail.com,rafael.torres@saber.uis.edu.co"
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

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
    const user = await getUserById(userId)
    const adminIds = await getUserIdsByEmails(getAdminEmails())
    await Promise.all(
      adminIds.map((adminId) =>
        createNotification({
          userId: adminId,
          type: "MEMBERSHIP_REQUEST",
          title: "Nueva solicitud de ingreso",
          body: user ? `${user.name} (${user.email})` : `UserId: ${userId}`,
          url: "/profesor",
          meta: { requestId: created.id, userId },
        }),
      ),
    )
    return NextResponse.json({ ok: true, request: created })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "No se pudo crear la solicitud." }, { status: 400 })
  }
}
