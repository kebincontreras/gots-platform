"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type ProfileDraft = {
  displayName: string | null
  publicEmail: string | null
  linkedinUrl: string | null
  researchgateUrl: string | null
  scholarUrl: string | null
  photoUrl: string | null
  academicLevel: string | null
  memberCategory: string | null
  specialty: string | null
  directorId: string | null
  directorName: string | null
}

export type ProfessorOption = { id: string; name: string; email: string }

const NONE_VALUE = "__none__"
const DIRECTOR_ID_PREFIX = "id:"
const DIRECTOR_NAME_PREFIX = "name:"

const ACADEMIC_LEVELS = [
  { value: NONE_VALUE, label: "No especificar" },
  { value: "PREGRADO", label: "Pregrado" },
  { value: "MAESTRIA", label: "Maestría" },
  { value: "DOCTORADO", label: "Doctorado" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
]

const MEMBER_CATEGORY_SUGGESTIONS = [
  "Estudiante de doctorado",
  "Estudiante de maestría",
  "Estudiante de pregrado",
  "Estudiante de electrónica",
  "Estudiante de física",
  "Profesional invitado",
  "Administrativo",
]

export function ProfileForm({
  initial,
  professors,
  legacyDirectorNames,
}: {
  initial: ProfileDraft
  professors: ProfessorOption[]
  legacyDirectorNames: string[]
}) {
  const [draft, setDraft] = useState<ProfileDraft>(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const professorOptions = useMemo(() => professors ?? [], [professors])

  const directorValue = useMemo(() => {
    if (draft.directorId) return `${DIRECTOR_ID_PREFIX}${draft.directorId}`
    if (draft.directorName) return `${DIRECTOR_NAME_PREFIX}${draft.directorName}`
    return NONE_VALUE
  }, [draft.directorId, draft.directorName])

  const onDirectorValueChange = (v: string) => {
    if (v === NONE_VALUE) {
      setDraft((d) => ({ ...d, directorId: null, directorName: null }))
      return
    }
    if (v.startsWith(DIRECTOR_ID_PREFIX)) {
      setDraft((d) => ({ ...d, directorId: v.slice(DIRECTOR_ID_PREFIX.length), directorName: null }))
      return
    }
    if (v.startsWith(DIRECTOR_NAME_PREFIX)) {
      setDraft((d) => ({ ...d, directorId: null, directorName: v.slice(DIRECTOR_NAME_PREFIX.length) }))
      return
    }
    setDraft((d) => ({ ...d, directorId: null, directorName: null }))
  }

  const legacyDirectors = useMemo(() => {
    const names = legacyDirectorNames ?? []
    if (!names.length) return []
    const normalizedExisting = new Set(professorOptions.map((p) => `${p.name}`.trim().toLowerCase()))
    return names
      .map((n) => String(n).trim())
      .filter(Boolean)
      .filter((n) => !normalizedExisting.has(n.toLowerCase()))
  }, [legacyDirectorNames, professorOptions])

  const setPhotoFromFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("error")
      setError("Selecciona una imagen.")
      return
    }
    if (file.size > 2_000_000) {
      setStatus("error")
      setError("La imagen es muy grande (máx 2MB).")
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."))
      reader.readAsDataURL(file)
    })

    // Resize (max 512px) to keep DB small
    const resized = await new Promise<string>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const max = 512
        const ratio = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * ratio))
        const h = Math.max(1, Math.round(img.height * ratio))
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(dataUrl)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", 0.82))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })

    setDraft((d) => ({ ...d, photoUrl: resized }))
    setStatus("idle")
    setError(null)
  }

  const set = (key: keyof ProfileDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value === "" ? null : value }))
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        setStatus("idle")
        setError(null)
        const res = await fetch("/api/me/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        })
        const body = await res.json().catch(() => ({}))
        setSaving(false)
        if (!res.ok) {
          setStatus("error")
          setError(body?.error ?? "No se pudo guardar.")
          return
        }
        setStatus("saved")
      }}
    >
      <div className="grid gap-1">
        <div className="text-sm font-medium">Nombre para mostrar</div>
        <Input value={draft.displayName ?? ""} onChange={(e) => set("displayName")(e.target.value)} placeholder="Ej: Juan Pérez" />
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-medium">Correo de contacto (público)</div>
        <Input
          value={draft.publicEmail ?? ""}
          onChange={(e) => set("publicEmail")(e.target.value)}
          placeholder="Ej: nombre@uis.edu.co"
          type="email"
        />
      </div>

      <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-1">
          <div className="text-sm font-medium">ResearchGate (URL)</div>
          <Input
            value={draft.researchgateUrl ?? ""}
            onChange={(e) => set("researchgateUrl")(e.target.value)}
            placeholder="https://www.researchgate.net/profile/..."
          />
        </div>
        <div className="grid gap-1">
          <div className="text-sm font-medium">Google Scholar (URL)</div>
          <Input
            value={draft.scholarUrl ?? ""}
            onChange={(e) => set("scholarUrl")(e.target.value)}
            placeholder="https://scholar.google.com/citations?user=..."
          />
        </div>
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-medium">LinkedIn (URL) (opcional)</div>
        <Input
          value={draft.linkedinUrl ?? ""}
          onChange={(e) => set("linkedinUrl")(e.target.value)}
          placeholder="https://www.linkedin.com/in/..."
        />
        <div className="text-xs text-muted-foreground">Nota: el sitio puede ocultar el icono de LinkedIn según la configuración.</div>
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-medium">Foto</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void setPhotoFromFile(f)
          }}
        />
        <button
          type="button"
          className="w-full max-w-[220px] aspect-square rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Dar click para subir foto"
        >
          {draft.photoUrl ? (
            <img src={draft.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center px-4">
              <div className="text-sm font-medium">Dar click para subir</div>
              <div className="text-xs text-muted-foreground mt-1">Desde tu PC</div>
            </div>
          )}
        </button>
        {draft.photoUrl ? (
          <div>
            <Button type="button" variant="outline" onClick={() => setDraft((d) => ({ ...d, photoUrl: null }))}>
              Quitar foto
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-1">
          <div className="text-sm font-medium">Nivel</div>
          <Select
            value={draft.academicLevel ?? NONE_VALUE}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, academicLevel: v === NONE_VALUE ? null : v }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_LEVELS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <div className="text-sm font-medium">Categoría (para Equipo)</div>
          <Input
            value={draft.memberCategory ?? ""}
            onChange={(e) => set("memberCategory")(e.target.value)}
            placeholder="Ej: Estudiante de pregrado"
            list="member-category-suggestions"
          />
          <datalist id="member-category-suggestions">
            {MEMBER_CATEGORY_SUGGESTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-medium">ESP (skills / especialidad)</div>
        <Input
          value={draft.specialty ?? ""}
          onChange={(e) => set("specialty")(e.target.value)}
          placeholder="Ej: Fotónica, Microfabricación, Python"
        />
        <div className="text-xs text-muted-foreground">Se mostrará en tu tarjeta del Equipo para evitar repetir “Estudiante de ...”.</div>
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-medium">Director</div>
        <Select
          value={directorValue}
          onValueChange={onDirectorValueChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona tu director" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>Sin director</SelectItem>
            {professorOptions.map((p) => (
              <SelectItem key={p.id} value={`${DIRECTOR_ID_PREFIX}${p.id}`}>
                {p.name} ({p.email})
              </SelectItem>
            ))}
            {legacyDirectors.length ? (
              <>
                {legacyDirectors.map((n) => (
                  <SelectItem key={n} value={`${DIRECTOR_NAME_PREFIX}${n}`}>
                    {n}
                  </SelectItem>
                ))}
              </>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar perfil"}
        </Button>
        <div className="text-sm text-muted-foreground">
          {status === "saved" ? "Guardado." : status === "error" ? error ?? "Error" : ""}
        </div>
      </div>
    </form>
  )
}
