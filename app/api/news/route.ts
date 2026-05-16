import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createNews, listNews } from "@/lib/store"
import fs from "node:fs"
import path from "node:path"

function canEditNews(role?: string) {
  return role === "PROFESSOR" || role === "EDITOR_NOTICIAS"
}

function readStaticNewsFallback() {
  const filePath = path.join(process.cwd(), "public", "Noticias", "news.json")
  const raw = fs.readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed?.news) ? parsed.news : []
}

export async function GET() {
  try {
    const items = await listNews()
    return NextResponse.json({ news: items })
  } catch {
    // No DB configured: fall back to bundled JSON
    const items = readStaticNewsFallback()
    return NextResponse.json({ news: items })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canEditNews(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const title = (body?.title ?? "").toString().trim()
  const description = (body?.description ?? "").toString().trim()
  const summary = (body?.summary ?? "").toString().trim()
  const date = (body?.date ?? "").toString().trim()
  const image = (body?.image ?? "").toString().trim()
  const featured = Boolean(body?.featured)
  const category = (body?.category ?? "").toString().trim()
  const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : []
  const author = (body?.author ?? "").toString().trim()
  const readTime = (body?.readTime ?? "").toString().trim()
  const content = (body?.content ?? "").toString()
  const normalizedContent = content.trim() ? content : null

  if (!title || !description || !summary || !date || !image || !category || !author || !readTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const created = await createNews({
      title,
      description,
      summary,
      date,
      image,
      featured,
      category,
      tags,
      author,
      readTime,
      content: normalizedContent,
    })
    return NextResponse.json({ ok: true, news: created })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "No se pudo guardar. Configura la base de datos para editar noticias." },
      { status: 500 },
    )
  }
}

