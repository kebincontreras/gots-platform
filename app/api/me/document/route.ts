import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateUserDocEmbedUrl } from "@/lib/store"

function normalizeGoogleDocEmbedUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  const host = url.hostname.toLowerCase()
  const path = url.pathname

  // Google Drive file: /file/d/<id>/... -> preview
  if (host.includes("drive.google.com")) {
    const m = path.match(/\/file\/d\/([^/]+)\//)
    if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`

    const openId = url.searchParams.get("id")
    if (openId) return `https://drive.google.com/file/d/${openId}/preview`

    return trimmed
  }

  // Google Docs: docs.google.com/document/d/<id>/... -> preview
  if (host.includes("docs.google.com")) {
    const docMatch = path.match(/\/document\/d\/([^/]+)\//)
    if (docMatch?.[1]) {
      const id = docMatch[1]
      return `https://docs.google.com/document/d/${id}/preview`
    }
  }

  return null
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const docEmbedUrl = normalizeGoogleDocEmbedUrl((body?.docEmbedUrl ?? "").toString())
  if (!docEmbedUrl) {
    return NextResponse.json(
      {
        error:
          "URL inválida. Pega un link de Drive (drive.google.com) o de Google Docs (docs.google.com/document).",
      },
      { status: 400 },
    )
  }

  await updateUserDocEmbedUrl(userId, docEmbedUrl)

  return NextResponse.json({ ok: true })
}

