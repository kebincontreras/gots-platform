"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Item = {
  request: { id: string; userId: string; createdAt: string }
  user: { id: string; name: string; email: string }
}

type Member = {
  id: string
  name: string
  displayName: string | null
  publicEmail: string | null
  memberCategory: string | null
  role: string
}

export function MembershipRequestsPanel() {
  const [items, setItems] = useState<Item[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [reqRes, teamRes] = await Promise.all([fetch("/api/membership/requests"), fetch("/api/team")])
    const body = await reqRes.json().catch(() => ({}))
    setLoading(false)
    if (!reqRes.ok) {
      setError(body?.error ?? "No se pudieron cargar solicitudes.")
      return
    }
    setItems(body.requests ?? [])

    if (teamRes.ok) {
      const teamBody = await teamRes.json().catch(() => ({}))
      const team = Array.isArray(teamBody?.team) ? teamBody.team : []
      setMembers(team)
    } else {
      setMembers([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  const act = async (id: string, userId: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/membership/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? "No se pudo procesar.")
      return
    }
    await load()
  }

  const removeMember = async (userId: string) => {
    if (!confirm("¿Remover este usuario del grupo?")) return
    const res = await fetch(`/api/membership/members/${encodeURIComponent(userId)}`, { method: "DELETE" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? "No se pudo remover.")
      return
    }
    await load()
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="px-5 py-3 border-b font-semibold">Solicitudes de ingreso</div>
      <div className="p-5 grid gap-3">
        {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : null}
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        {!loading && !error && items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin solicitudes pendientes.</div>
        ) : null}
        {items.map((it) => (
          <div key={it.request.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{it.user.name}</div>
              <div className="text-sm text-muted-foreground truncate">{it.user.email}</div>
              <div className="text-xs text-muted-foreground">Enviada: {new Date(it.request.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => act(it.request.id, it.user.id, "approve")}>
                Aceptar
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(it.request.id, it.user.id, "reject")}>
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-b font-semibold">Administrar miembros</div>
      <div className="p-5 grid gap-3">
        {members.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin miembros aceptados aún.</div>
        ) : null}
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{m.displayName || m.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {m.publicEmail || ""} {m.memberCategory ? `· ${m.memberCategory}` : ""}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => removeMember(m.id)}>
              Remover
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
