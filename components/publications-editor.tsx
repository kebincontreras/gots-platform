"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva publicación</CardTitle>
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
              <div className="text-sm font-medium">Imagen (ruta en /public o URL)</div>
              <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="/Explicit_Cartesian_oval.png" />
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
            <Button onClick={onCreate} disabled={!canSave || saving}>
              {saving ? "Guardando..." : "Crear publicación"}
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
          <CardTitle>Publicaciones ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : null}
          {!loading && items.length === 0 ? <div className="text-sm text-muted-foreground">Sin publicaciones.</div> : null}
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
              <Button variant="destructive" size="sm" onClick={() => onDelete(p.id)}>
                Eliminar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

