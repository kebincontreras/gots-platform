import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteNews, updateNews } from "@/lib/store"

function canEditNews(isLoggedIn: boolean) {
  return isLoggedIn
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canEditNews(true)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const body = await req.json().catch(() => null)
  const patch = {
    title: body?.title != null ? String(body.title) : undefined,
    description: body?.description != null ? String(body.description) : undefined,
    summary: body?.summary != null ? String(body.summary) : undefined,
    date: body?.date != null ? String(body.date) : undefined,
    image: body?.image != null ? String(body.image) : undefined,
    featured: typeof body?.featured === "boolean" ? body.featured : undefined,
    category: body?.category != null ? String(body.category) : undefined,
    tags: Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t)).filter(Boolean) : undefined,
    author: body?.author != null ? String(body.author) : undefined,
    readTime: body?.readTime != null ? String(body.readTime) : undefined,
    content: body?.content != null ? String(body.content) : undefined,
  }

  try {
    const updated = await updateNews(numericId, patch)
    return NextResponse.json({ ok: true, news: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "No se pudo actualizar." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canEditNews(true)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  await deleteNews(numericId)
  return NextResponse.json({ ok: true })
}
