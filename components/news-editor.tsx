"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getImagePath } from "@/lib/utils"

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
  const [editingId, setEditingId] = useState<number | null>(null)

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

  const canSave = useMemo(() => saving === false, [saving])

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

  const onPickImage = async (file: File | null) => {
    if (!file) return
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setError("La imagen es muy grande (máx 2MB).")
      return
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
      reader.readAsDataURL(file)
    })
    setImage(dataUrl)
  }

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

  const onUpdate = async () => {
    if (!editingId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/news/${editingId}`, {
        method: "PUT",
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
      if (!res.ok) throw new Error(body?.error ?? "No se pudo actualizar.")
      setEditingId(null)
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
      setError(e?.message ?? "No se pudo actualizar.")
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

  const startEdit = (n: NewsItem) => {
    setEditingId(n.id)
    setTitle(n.title ?? "")
    setSummary(n.summary ?? "")
    setDescription(n.description ?? "")
    setDate(n.date ?? "")
    setImage(n.image ?? "/Noticias/")
    setFeatured(Boolean(n.featured))
    setCategory(n.category ?? "")
    setTags((n.tags || []).join(", "))
    setAuthor(n.author ?? "GOTS UIS")
    setReadTime(n.readTime ?? "1 min")
    setContent((n.content ?? "") as any)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setTitle("")
    setSummary("")
    setDescription("")
    setDate("")
    setImage("/Noticias/")
    setFeatured(false)
    setCategory("")
    setTags("")
    setAuthor("GOTS UIS")
    setReadTime("3 min")
    setContent("")
    setError(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? `Editar noticia #${editingId}` : "Nueva noticia"}</CardTitle>
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
          <div className="grid gap-2">
            <div className="text-sm font-medium">Subir imagen</div>
            <Input type="file" accept="image/*" onChange={(e) => onPickImage(e.target.files?.[0] ?? null)} />
            {image ? (
              <div className="rounded-lg border overflow-hidden max-w-xl">
                <img src={getImagePath(image)} alt="Preview" className="w-full h-auto" />
              </div>
            ) : null}
            <div className="text-xs text-muted-foreground">
              Recomendado: usar ruta en <code>/public/Noticias</code>. Si subes aquí, se guarda como imagen embebida (puede ser más pesado).
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
            <div className="text-sm font-medium">Contenido</div>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Texto largo..." />
          </div>

          <div className="flex items-center gap-3">
            {editingId ? (
              <>
                <Button onClick={onUpdate} disabled={!canSave || saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={onCreate} disabled={!canSave || saving}>
                {saving ? "Guardando..." : "Crear noticia"}
              </Button>
            )}
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(n)} disabled={saving}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(n.id)} disabled={saving}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
