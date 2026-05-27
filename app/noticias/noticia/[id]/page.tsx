import { notFound } from "next/navigation"
import fs from "node:fs"
import path from "node:path"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getImagePath } from "@/lib/utils"
import { listNews } from "@/lib/store"

type NewsItem = {
  id: number
  title: string
  description: string
  summary: string
  date: string
  image: string
  featured: boolean
  category: string
  tags: string[]
  author: string
  readTime: string
  content?: string | null
}

function readStaticNewsFallback(): NewsItem[] {
  const filePath = path.join(process.cwd(), "public", "Noticias", "news.json")
  const raw = fs.readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed?.news) ? parsed.news : []
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return notFound()

  let items: NewsItem[] = []
  try {
    items = (await listNews()) as any
  } catch {
    items = readStaticNewsFallback()
  }
  if (!items.length) items = readStaticNewsFallback()

  const item = items.find((n) => Number(n.id) === numericId)
  if (!item) return notFound()

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-sm text-muted-foreground">
            {item.date} · {item.category} · {item.readTime}
          </div>
          <h1 className="mt-2 text-3xl font-semibold">{item.title}</h1>
          <div className="mt-2 text-sm text-muted-foreground">Por {item.author}</div>

          <div className="mt-6 rounded-xl overflow-hidden border bg-muted">
            <img
              src={getImagePath(item.image || "/placeholder.svg")}
              alt={item.title}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="mt-6 whitespace-pre-line text-base">
            {item.content?.trim() ? item.content : item.description}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

