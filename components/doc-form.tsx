"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

export function DocForm({ initialUrl }: { initialUrl: string }) {
  const { t } = useLanguage()
  const [docEmbedUrl, setDocEmbedUrl] = useState(initialUrl)
  const [editing, setEditing] = useState(!initialUrl)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const shortUrl = (() => {
    if (!docEmbedUrl) return ""
    try {
      const u = new URL(docEmbedUrl)
      return `${u.hostname}${u.pathname}`.replace(/\/+$/, "")
    } catch {
      return docEmbedUrl
    }
  })()

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus("saving")
        setError(null)
        const res = await fetch("/api/me/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docEmbedUrl }),
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
      {!editing && docEmbedUrl ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-background p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{t("doc.savedLink")}</div>
            <div className="text-xs text-muted-foreground truncate">{shortUrl}</div>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              {t("doc.edit")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Input value={docEmbedUrl} onChange={(e) => setDocEmbedUrl(e.target.value)} placeholder={t("doc.placeholder")} />
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button type="submit" disabled={status === "saving"}>
              {status === "saving" ? t("doc.saving") : t("doc.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDocEmbedUrl(initialUrl)
                setEditing(false)
                setStatus("idle")
                setError(null)
              }}
              disabled={status === "saving"}
            >
              {t("doc.cancel")}
            </Button>
            <div className="text-sm text-muted-foreground sm:ml-auto">
              {status === "saved" ? t("doc.saved") : status === "error" ? (error ?? "Error") : ""}
            </div>
          </div>
        </>
      )}
    </form>
  )
}

