import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deletePublication, getPublicationOwner } from "@/lib/store"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const owner = await getPublicationOwner(numericId)
  const canDelete = role === "PROFESSOR" || owner === userId
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await deletePublication(numericId)
  return NextResponse.json({ ok: true })
}

