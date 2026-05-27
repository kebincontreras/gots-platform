import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createNews, createNotification, listNews, listNewsByUser, listNotifiableUserIds } from "@/lib/store"
import fs from "node:fs"
import path from "node:path"

function canEditNews(isLoggedIn: boolean) {
  return isLoggedIn
}

function readStaticNewsFallback() {
  const filePath = path.join(process.cwd(), "public", "Noticias", "news.json")
  const raw = fs.readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed?.news) ? parsed.news : []
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const url = new URL(req.url)
  const mineRequested = url.searchParams.get("mine") === "1"
  const userId = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (mineRequested && (!session?.user || !userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const items =
      mineRequested && userId && role !== "PROFESSOR" ? await listNewsByUser(userId) : await listNews()
    if (!mineRequested && Array.isArray(items) && items.length === 0) {
      return NextResponse.json({ news: readStaticNewsFallback() })
    }
    return NextResponse.json({ news: items })
  } catch {
    // No DB configured: fall back to bundled JSON
    const items = mineRequested ? [] : readStaticNewsFallback()
    return NextResponse.json({ news: items })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canEditNews(true)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const titleRaw = (body?.title ?? "").toString().trim()
  const descriptionRaw = (body?.description ?? "").toString().trim()
  const summaryRaw = (body?.summary ?? "").toString().trim()
  const dateRaw = (body?.date ?? "").toString().trim()
  const imageRaw = (body?.image ?? "").toString().trim()
  const featured = Boolean(body?.featured)
  const categoryRaw = (body?.category ?? "").toString().trim()
  const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : []
  const authorRaw = (body?.author ?? "").toString().trim()
  const readTimeRaw = (body?.readTime ?? "").toString().trim()
  const content = (body?.content ?? "").toString()
  const normalizedContent = content.trim() ? content : null

  const today = new Date().toISOString().slice(0, 10)
  const title = titleRaw || "Sin título"
  const description = descriptionRaw || ""
  const summary = summaryRaw || ""
  const date = dateRaw || today
  const image = imageRaw || "/placeholder.svg"
  const category = categoryRaw || "General"
  const author = authorRaw || (session.user as any)?.name || (session.user as any)?.email || "GOTS UIS"
  const readTime = readTimeRaw || "1 min"

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
    }, userId)

    // Notify group members + professors about new news
    const recipients = await listNotifiableUserIds().catch(() => [])
    await Promise.all(
      recipients.map((rid) =>
        createNotification({
          userId: rid,
          type: "NEWS_PUBLISHED",
          title: "Nueva noticia publicada",
          body: created.title || "Noticia",
          url: "/noticias",
        }),
      ),
    )
    return NextResponse.json({ ok: true, news: created })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "No se pudo guardar. Configura la base de datos para editar noticias." },
      { status: 500 },
    )
  }
}
