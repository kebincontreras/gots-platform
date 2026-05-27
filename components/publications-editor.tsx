"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getImagePath } from "@/lib/utils"

type Publication = {
  id: number
  title: string
  authors: string
  journal: string
  conference?: string | null
  year: number
  image?: string | null
  pdfUrl: string
  externalUrl: string
  supplementaryMaterial?: string | null
  starred: boolean
  abstract: string
  keywords: string[]
}

function parseKeywords(text: string) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
}

export function PublicationsEditor() {
  const [items, setItems] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState("")
  const [authors, setAuthors] = useState("")
  const [journal, setJournal] = useState("")
  const [conference, setConference] = useState("")
  const [year, setYear] = useState("")
  const [image, setImage] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [supplementaryMaterial, setSupplementaryMaterial] = useState("")
  const [starred, setStarred] = useState(false)
  const [abstract, setAbstract] = useState("")
  const [keywords, setKeywords] = useState("")

  const canSave = useMemo(() => {
    return Boolean(title.trim() && authors.trim() && journal.trim() && year.trim() && pdfUrl.trim() && externalUrl.trim() && abstract.trim())
  }, [title, authors, journal, year, pdfUrl, externalUrl, abstract])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/publications")
      const body = await res.json()
      setItems(Array.isArray(body?.publications) ? body.publications : [])
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
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen.")
      return
    }
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

    const resized = await new Promise<string>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const max = 1024
        const ratio = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * ratio))
        const h = Math.max(1, Math.round(img.height * ratio))
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(dataUrl)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })

    setImage(resized)
  }

  const onCreate = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          authors,
          journal,
          conference,
          year: Number(year),
          image: image.trim() || null,
          pdfUrl,
          externalUrl,
          supplementaryMaterial: supplementaryMaterial.trim() || null,
          starred,
          abstract,
          keywords: parseKeywords(keywords),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? "No se pudo guardar.")

      setTitle("")
      setAuthors("")
      setJournal("")
      setConference("")
      setYear("")
      setImage("")
      setPdfUrl("")
      setExternalUrl("")
      setSupplementaryMaterial("")
      setStarred(false)
      setAbstract("")
      setKeywords("")
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
      const res = await fetch(`/api/publications/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          authors,
          journal,
          conference,
          year: Number(year),
          image: image.trim() || null,
          pdfUrl,
          externalUrl,
          supplementaryMaterial: supplementaryMaterial.trim() || null,
          starred,
          abstract,
          keywords: parseKeywords(keywords),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? "No se pudo actualizar.")

      setEditingId(null)
      setTitle("")
      setAuthors("")
      setJournal("")
      setConference("")
      setYear("")
      setImage("")
      setPdfUrl("")
      setExternalUrl("")
      setSupplementaryMaterial("")
      setStarred(false)
      setAbstract("")
      setKeywords("")
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? "No se pudo actualizar.")
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta publicación?")) return
    setError(null)
    try {
      const res = await fetch(`/api/publications/${id}`, { method: "DELETE" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? "No se pudo eliminar.")
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? "No se pudo eliminar.")
    }
  }

  const startEdit = (p: Publication) => {
    setEditingId(p.id)
    setTitle(p.title ?? "")
    setAuthors(p.authors ?? "")
    setJournal(p.journal ?? "")
    setConference((p.conference ?? "") as any)
    setYear(String(p.year ?? ""))
    setImage((p.image ?? "") as any)
    setPdfUrl(p.pdfUrl ?? "")
    setExternalUrl(p.externalUrl ?? "")
    setSupplementaryMaterial((p.supplementaryMaterial ?? "") as any)
    setStarred(Boolean(p.starred))
    setAbstract(p.abstract ?? "")
    setKeywords((p.keywords || []).join(", "))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setTitle("")
    setAuthors("")
    setJournal("")
    setConference("")
    setYear("")
    setImage("")
    setPdfUrl("")
    setExternalUrl("")
    setSupplementaryMaterial("")
    setStarred(false)
    setAbstract("")
    setKeywords("")
    setError(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? `Editar artículo #${editingId}` : "Nuevo artículo"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <div className="text-sm font-medium">Título</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Autores</div>
            <Input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Nombre 1, Nombre 2" />
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Revista</div>
              <Input value={journal} onChange={(e) => setJournal(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Conferencia (opcional)</div>
              <Input value={conference} onChange={(e) => setConference(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Año</div>
              <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Imagen</div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className="w-full max-w-[220px] aspect-square rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center overflow-hidden"
                onClick={() => imageInputRef.current?.click()}
              >
                {image ? (
                  <img src={getImagePath(image)} alt="Imagen artículo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center px-4">
                    <div className="text-sm font-medium">Dar click para subir</div>
                    <div className="text-xs text-muted-foreground mt-1">Desde tu PC</div>
                  </div>
                )}
              </button>
              <div className="text-xs text-muted-foreground">
                También puedes pegar una ruta en <code>/public</code> o una URL.
              </div>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/Explicit_Cartesian_oval.png o https://..."
              />
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-1">
              <div className="text-sm font-medium">PDF URL</div>
              <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid gap-1">
              <div className="text-sm font-medium">Enlace externo</div>
              <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Abstract</div>
            <Input value={abstract} onChange={(e) => setAbstract(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Keywords (coma)</div>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="optica, imagen" />
          </div>
          <div className="grid gap-1">
            <div className="text-sm font-medium">Material suplementario (opcional)</div>
            <Input value={supplementaryMaterial} onChange={(e) => setSupplementaryMaterial(e.target.value)} placeholder="https://..." />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} />
            Destacada
          </label>

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
                {saving ? "Guardando..." : "Crear artículo"}
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
          <CardTitle>Artículos ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : null}
          {!loading && items.length === 0 ? <div className="text-sm text-muted-foreground">Sin artículos.</div> : null}
          {items.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {p.year} · {p.journal}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {p.starred ? <Badge>Destacada</Badge> : null}
                  {(p.keywords || []).slice(0, 6).map((k) => (
                    <Badge key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(p)} disabled={saving}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(p.id)} disabled={saving}>
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
