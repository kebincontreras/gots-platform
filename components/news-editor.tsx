"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type NewsItem = {
  id: number
  title: string
  summary: string
  description: string
  date: string
  image: string
  featured: boolean
  category: string
  tags: string[]
  author: string
  readTime: string
  content?: string | null
}

function parseTags(text: string) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

export function NewsEditor() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [image, setImage] = useState("/Noticias/")
  const [featured, setFeatured] = useState(false)
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [author, setAuthor] = useState("GOTS UIS")
  const [readTime, setReadTime] = useState("3 min")
  const [content, setContent] = useState("")

  const canSave = useMemo(() => {
    return Boolean(title.trim() && summary.trim() && description.trim() && date.trim() && image.trim() && category.trim() && author.trim() && readTime.trim())
  }, [title, summary, description, date, image, category, author, readTime])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/news")
      const body = await res.json()
      setItems(Array.isArray(body?.news) ? body.news : [])
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const onCreate = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          description,
          date,
          image,
          featured,
          category,
          tags: parseTags(tags),
          author,
          readTime,
          content,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? "No se pudo guardar.")
      setTitle("")
      setSummary("")
      setDescription("")
      setDate("")
      setImage("/Noticias/")
      setFeatured(false)
      setCategory("")
      setTags("")
      setReadTime("3 min")
      setContent("")
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? "No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta noticia?")) return
    setError(null)
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? "No se pudo eliminar.")
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? "No se pudo eliminar.")
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva noticia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <div className="text-sm font-medium">Título</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Resumen</div>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Descripción</div>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Fecha (YYYY-MM-DD)</div>
              <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-05-16" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Categoría</div>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Seminario" />
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Imagen (ruta en /public)</div>
              <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/Noticias/a1.jpeg" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Autor</div>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Tags (separados por coma)</div>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="seminario, optica" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Tiempo de lectura</div>
              <Input value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="3 min" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Destacada
          </label>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Contenido (opcional)</div>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto largo..." />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={onCreate} disabled={!canSave || saving}>
              {saving ? "Guardando..." : "Crear noticia"}
            </Button>
            <Button variant="outline" onClick={refresh} disabled={loading || saving}>
              Actualizar
            </Button>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Noticias ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : null}
          {!loading && items.length === 0 ? <div className="text-sm text-muted-foreground">Sin noticias.</div> : null}
          {items.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{n.title}</div>
                <div className="text-xs text-muted-foreground">
                  {n.date} · {n.category} · {n.author}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {n.featured ? <Badge>Destacada</Badge> : null}
                  {(n.tags || []).slice(0, 6).map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => onDelete(n.id)}>
                Eliminar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

