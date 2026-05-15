import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateUserDriveEmbedUrl } from "@/lib/store"

function normalizeGoogleEmbedUrl(raw: string): string | null {
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

  // Google Drive: /file/d/<id>/(view|edit|preview) -> preview
  if (host.includes("drive.google.com")) {
    const m = path.match(/\/file\/d\/([^/]+)\//)
    if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`

    // drive.google.com/open?id=<id>
    const openId = url.searchParams.get("id")
    if (openId) return `https://drive.google.com/file/d/${openId}/preview`

    return trimmed
  }

  // Google Slides: docs.google.com/presentation/d/<id>/... -> embed
  if (host.includes("docs.google.com")) {
    const slidesMatch = path.match(/\/presentation\/d\/([^/]+)\//)
    if (slidesMatch?.[1]) {
      const id = slidesMatch[1]
      return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`
    }
  }

  return null
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const driveEmbedUrl = normalizeGoogleEmbedUrl((body?.driveEmbedUrl ?? "").toString())
  if (!driveEmbedUrl) {
    return NextResponse.json(
      {
        error:
          "URL inválida. Pega un link de Drive (drive.google.com) o de Slides (docs.google.com/presentation).",
      },
      { status: 400 },
    )
  }

  updateUserDriveEmbedUrl(userId, driveEmbedUrl)

  return NextResponse.json({ ok: true })
}
