import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createNotification, setUserGroupMember } from "@/lib/store"

function isGroupAdmin(email: string | undefined | null) {
  const normalized = (email ?? "").trim().toLowerCase()
  if (!normalized) return false
  const list = (process.env.GROUP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  // Fallback to the two admins requested if env is not set.
  if (list.length === 0) {
    return (
      normalized === "kebinandrescontreras@gmail.com" ||
      normalized === "rafael.torres@saber.uis.edu.co"
    )
  }
  return list.includes(normalized)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await getServerSession(authOptions)
  const email = (session?.user as any)?.email as string | undefined
  const resolverId = (session?.user as any)?.id as string | undefined
  if (!session?.user || !resolverId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isGroupAdmin(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!userId) return NextResponse.json({ error: "Invalid userId" }, { status: 400 })
  await setUserGroupMember(userId, false)
  await createNotification({
    userId,
    type: "MEMBERSHIP_REQUEST",
    title: "Salida del grupo",
    body: "Un administrador te removió del grupo.",
    url: "/dashboard",
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
