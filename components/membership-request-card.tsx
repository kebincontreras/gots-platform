"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function MembershipRequestCard({
  groupMember,
  pending,
}: {
  groupMember: boolean
  pending: { id: string; createdAt: string } | null
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  if (groupMember) {
    return (
      <div className="rounded-xl border p-5">
        <div className="font-semibold">Estado del grupo</div>
        <div className="mt-1 text-sm text-muted-foreground">Ya eres parte del grupo.</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-5">
      <div className="font-semibold">Estado del grupo</div>
      {pending ? (
        <div className="mt-1 text-sm text-muted-foreground">
          Solicitud enviada el {new Date(pending.createdAt).toLocaleString()}.
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">
          Para aparecer en “Equipo” y usar el chat del grupo, primero debes solicitar el ingreso.
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button
          disabled={Boolean(pending) || status === "sending"}
          onClick={async () => {
            setStatus("sending")
            setError(null)
            const res = await fetch("/api/membership/request", { method: "POST" })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) {
              setStatus("error")
              setError(body?.error ?? "No se pudo enviar la solicitud.")
              return
            }
            setStatus("sent")
            window.location.reload()
          }}
        >
          {pending ? "Solicitud pendiente" : status === "sending" ? "Enviando..." : "Solicitar hacer parte del grupo"}
        </Button>
        {status === "error" && error ? <div className="text-sm text-destructive">{error}</div> : null}
      </div>
    </div>
  )
}

