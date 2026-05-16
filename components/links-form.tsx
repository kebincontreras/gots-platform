"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g)
  return matches ? Array.from(new Set(matches)) : []
}

function guessType(url: string): "ppt" | "doc" | "unknown" {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const path = u.pathname
    if (host.includes("docs.google.com") && path.includes("/presentation/")) return "ppt"
    if (host.includes("docs.google.com") && path.includes("/document/")) return "doc"
    if (host.includes("drive.google.com") && path.includes("/file/d/")) return "unknown"
    return "unknown"
  } catch {
    return "unknown"
  }
}

export function LinksForm({
  initialPptUrl,
  initialDocUrl,
}: {
  initialPptUrl: string
  initialDocUrl: string
}) {
  const { t } = useLanguage()
  const [pptUrl, setPptUrl] = useState(initialPptUrl)
  const [docUrl, setDocUrl] = useState(initialDocUrl)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const showDocField = useMemo(() => Boolean(pptUrl.trim()), [pptUrl])
  const canSave = useMemo(() => Boolean(pptUrl.trim()) && Boolean(docUrl.trim()) && status !== "saving", [pptUrl, docUrl, status])

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text")
    const urls = extractUrls(pasted)
    if (urls.length < 2) return

    const pptCandidate = urls.find((u) => guessType(u) === "ppt")
    const docCandidate = urls.find((u) => guessType(u) === "doc")
    if (pptCandidate && !pptUrl) setPptUrl(pptCandidate)
    if (docCandidate && !docUrl) setDocUrl(docCandidate)
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus("saving")
        setError(null)

        const tasks: Array<Promise<Response>> = []
        if (pptUrl.trim()) {
          tasks.push(
            fetch("/api/me/presentation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ driveEmbedUrl: pptUrl }),
            }),
          )
        }
        if (docUrl.trim()) {
          tasks.push(
            fetch("/api/me/document", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ docEmbedUrl: docUrl }),
            }),
          )
        }

        const results = await Promise.all(tasks)
        const firstBad = results.find((r) => !r.ok)
        if (firstBad) {
          const body = await firstBad.json().catch(() => ({}))
          setStatus("error")
          setError(body?.error ?? "No se pudo guardar.")
          return
        }

        setStatus("saved")
        setTimeout(() => setStatus("idle"), 1500)
      }}
    >
      <div className="grid gap-3">
        <div className="grid gap-1">
          <div className="text-sm font-medium">{t("links.pptLabel")}</div>
          <Input
            value={pptUrl}
            onChange={(e) => setPptUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder={t("links.pptPlaceholder")}
          />
        </div>
        {showDocField ? (
          <div className="grid gap-1">
            <div className="text-sm font-medium">{t("links.docLabel")}</div>
            <Input
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              onPaste={handlePaste}
              placeholder={t("links.docPlaceholder")}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Button type="submit" disabled={!canSave}>
          {status === "saving" ? t("links.saving") : t("links.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPptUrl(initialPptUrl)
            setDocUrl(initialDocUrl)
            setStatus("idle")
            setError(null)
          }}
          disabled={status === "saving"}
        >
          {t("links.reset")}
        </Button>
        <div className="text-sm text-muted-foreground sm:ml-auto">
          {status === "saved" ? t("links.saved") : status === "error" ? (error ?? "Error") : ""}
        </div>
      </div>
    </form>
  )
}
