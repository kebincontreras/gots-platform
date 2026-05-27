"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="grid gap-3 max-w-md"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus("saving")
        setError(null)
        const res = await fetch("/api/me/security", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          setStatus("error")
          setError(body?.error ?? "No se pudo actualizar.")
          return
        }
        setStatus("saved")
        setCurrentPassword("")
        setNewPassword("")
      }}
    >
      <div className="grid gap-1">
        <div className="text-sm font-medium">Contraseña actual</div>
        <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" />
      </div>
      <div className="grid gap-1">
        <div className="text-sm font-medium">Nueva contraseña</div>
        <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
        <div className="text-xs text-muted-foreground">Mínimo 8 caracteres.</div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving" || !currentPassword || !newPassword}>
          {status === "saving" ? "Guardando..." : "Actualizar contraseña"}
        </Button>
        <div className="text-sm text-muted-foreground">
          {status === "saved" ? "Actualizado." : status === "error" ? error ?? "Error" : ""}
        </div>
      </div>
    </form>
  )
}

