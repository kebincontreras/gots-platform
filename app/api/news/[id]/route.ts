import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteNews } from "@/lib/store"

function canEditNews(role?: string) {
  return role === "PROFESSOR" || role === "EDITOR_NOTICIAS"
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canEditNews(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  await deleteNews(numericId)
  return NextResponse.json({ ok: true })
}

