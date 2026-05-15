"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

export function DriveForm({ initialUrl }: { initialUrl: string }) {
  const { t } = useLanguage()
  const [driveEmbedUrl, setDriveEmbedUrl] = useState(initialUrl)
  const [editing, setEditing] = useState(!initialUrl)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const shortUrl = (() => {
    if (!driveEmbedUrl) return ""
    try {
      const u = new URL(driveEmbedUrl)
      return `${u.hostname}${u.pathname}`.replace(/\/+$/, "")
    } catch {
      return driveEmbedUrl
    }
  })()

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus("saving")
        setError(null)
        const res = await fetch("/api/me/presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driveEmbedUrl }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setStatus("error")
          setError(body?.error ?? "No se pudo guardar.")
          return
        }
        setStatus("saved")
        setEditing(false)
        setTimeout(() => setStatus("idle"), 1500)
      }}
    >
      {!editing && driveEmbedUrl ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-background p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{t("drive.savedLink")}</div>
            <div className="text-xs text-muted-foreground truncate">{shortUrl}</div>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              {t("drive.edit")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Input
            value={driveEmbedUrl}
            onChange={(e) => setDriveEmbedUrl(e.target.value)}
            placeholder={t("drive.placeholder")}
          />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button type="submit" disabled={status === "saving"}>
              {status === "saving" ? t("drive.saving") : t("drive.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDriveEmbedUrl(initialUrl)
                setEditing(false)
                setStatus("idle")
                setError(null)
              }}
              disabled={status === "saving"}
            >
              {t("drive.cancel")}
            </Button>
            <div className="text-sm text-muted-foreground sm:ml-auto">
              {status === "saved" ? t("drive.saved") : status === "error" ? (error ?? "Error") : ""}
            </div>
          </div>
        </>
      )}
    </form>
  )
}
