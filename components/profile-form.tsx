"use client"

import { useMemo, useState } from "react"
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
  directorId: string | null
}

export type ProfessorOption = { id: string; name: string; email: string }

const NONE_VALUE = "__none__"

const ACADEMIC_LEVELS = [
  { value: NONE_VALUE, label: "No especificar" },
  { value: "PREGRADO", label: "Pregrado" },
  { value: "MAESTRIA", label: "Maestría" },
  { value: "DOCTORADO", label: "Doctorado" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
]

const MEMBER_CATEGORIES = [
  { value: NONE_VALUE, label: "No especificar" },
  { value: "Estudiante de doctorado", label: "Estudiante de doctorado" },
  { value: "Estudiante de maestría", label: "Estudiante de maestría" },
  { value: "Estudiante de pregrado", label: "Estudiante de pregrado" },
  { value: "Estudiante de física", label: "Estudiante de física" },
  { value: "Profesional invitado", label: "Profesional invitado" },
  { value: "Administrativo", label: "Administrativo" },
]

export function ProfileForm({ initial, professors }: { initial: ProfileDraft; professors: ProfessorOption[] }) {
  const [draft, setDraft] = useState<ProfileDraft>(initial)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const professorOptions = useMemo(() => professors ?? [], [professors])

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
        <div className="text-sm font-medium">Foto (URL)</div>
        <Input
          value={draft.photoUrl ?? ""}
          onChange={(e) => set("photoUrl")(e.target.value)}
          placeholder="https://..."
        />
        <div className="text-xs text-muted-foreground">Si no tienes hosting, puedes usar una URL pública o dejarlo vacío.</div>
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
          <Select
            value={draft.memberCategory ?? NONE_VALUE}
            onValueChange={(v) => setDraft((d) => ({ ...d, memberCategory: v === NONE_VALUE ? null : v }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_CATEGORIES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-medium">Director</div>
        <Select
          value={draft.directorId ?? NONE_VALUE}
          onValueChange={(v) => setDraft((d) => ({ ...d, directorId: v === NONE_VALUE ? null : v }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona tu director" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>Sin director</SelectItem>
            {professorOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.email})
              </SelectItem>
            ))}
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
