import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deletePublication, getPublicationOwner, updatePublication } from "@/lib/store"

function normalizeDriveDownloadUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return trimmed
  }

  const host = url.hostname.toLowerCase()
  const pathname = url.pathname

  if (host.includes("drive.google.com")) {
    const m = pathname.match(/\/file\/d\/([^/]+)\//)
    const id = m?.[1] ?? url.searchParams.get("id")
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`
  }

  return trimmed
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const owner = await getPublicationOwner(numericId)
  const canEdit = role === "PROFESSOR" || owner === userId
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const patch = {
    title: body?.title != null ? String(body.title) : undefined,
    authors: body?.authors != null ? String(body.authors) : undefined,
    journal: body?.journal != null ? String(body.journal) : undefined,
    conference: body?.conference != null ? String(body.conference) : undefined,
    year: body?.year != null && Number.isFinite(Number(body.year)) ? Number(body.year) : undefined,
    image: body?.image != null ? String(body.image) : undefined,
    pdfUrl: body?.pdfUrl != null ? normalizeDriveDownloadUrl(String(body.pdfUrl)) : undefined,
    externalUrl: body?.externalUrl != null ? String(body.externalUrl) : undefined,
    supplementaryMaterial: body?.supplementaryMaterial != null ? String(body.supplementaryMaterial) : undefined,
    starred: typeof body?.starred === "boolean" ? body.starred : undefined,
    abstract: body?.abstract != null ? String(body.abstract) : undefined,
    keywords: Array.isArray(body?.keywords) ? body.keywords.map((k: any) => String(k)).filter(Boolean) : undefined,
  }

  try {
    const updated = await updatePublication(numericId, patch)
    return NextResponse.json({ ok: true, publication: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "No se pudo actualizar." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

  const owner = await getPublicationOwner(numericId)
  const canDelete = role === "PROFESSOR" || owner === userId
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await deletePublication(numericId)
  return NextResponse.json({ ok: true })
}
