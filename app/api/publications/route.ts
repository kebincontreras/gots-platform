import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPublication, listPublications } from "@/lib/store"
import fs from "node:fs"
import path from "node:path"

function readStaticPublicationsFallback() {
  const filePath = path.join(process.cwd(), "public", "publications.json")
  const raw = fs.readFileSync(filePath, "utf8")
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed?.publications) ? parsed.publications : []
}

export async function GET() {
  try {
    const items = await listPublications()
    return NextResponse.json({ publications: items })
  } catch {
    const items = readStaticPublicationsFallback()
    return NextResponse.json({ publications: items })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const title = (body?.title ?? "").toString().trim()
  const authors = (body?.authors ?? "").toString().trim()
  const journal = (body?.journal ?? "").toString().trim()
  const conference = (body?.conference ?? "").toString().trim() || null
  const year = Number(body?.year)
  const image = (body?.image ?? "").toString().trim() || null
  const pdfUrl = (body?.pdfUrl ?? "").toString().trim()
  const externalUrl = (body?.externalUrl ?? "").toString().trim()
  const supplementaryMaterial = (body?.supplementaryMaterial ?? "").toString().trim() || null
  const starred = Boolean(body?.starred)
  const abstract = (body?.abstract ?? "").toString().trim()
  const keywords = Array.isArray(body?.keywords) ? body.keywords.map((k: any) => String(k).trim()).filter(Boolean) : []

  if (!title || !authors || !journal || !Number.isFinite(year) || !pdfUrl || !externalUrl || !abstract) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const created = await createPublication(userId, {
      title,
      authors,
      journal,
      conference,
      year,
      image,
      pdfUrl,
      externalUrl,
      supplementaryMaterial,
      starred,
      abstract,
      keywords,
    })
    return NextResponse.json({ ok: true, publication: created })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "No se pudo guardar. Configura la base de datos para editar publicaciones." },
      { status: 500 },
    )
  }
}

