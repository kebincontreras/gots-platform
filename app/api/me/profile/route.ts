import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserById, updateUserProfile } from "@/lib/store"

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return trimmed
  } catch {
    return null
  }
}

function normalizePhoto(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("data:image/")) {
    // guardrail: keep it reasonably small (~1.2MB of text)
    if (trimmed.length > 1_200_000) return null
    return trimmed
  }
  return normalizeUrl(trimmed)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUserById(userId)
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    profile: {
      displayName: user.displayName,
      publicEmail: user.publicEmail,
      linkedinUrl: user.linkedinUrl,
      researchgateUrl: user.researchgateUrl,
      scholarUrl: user.scholarUrl,
      photoUrl: user.photoUrl,
      academicLevel: user.academicLevel,
      memberCategory: user.memberCategory,
      specialty: user.specialty,
      directorId: user.directorId,
      directorName: user.directorName,
      groupMember: user.groupMember,
    },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const displayName = body?.displayName != null ? String(body.displayName).trim() : undefined
  const publicEmail = body?.publicEmail != null ? String(body.publicEmail).trim() : undefined
  const linkedinUrlRaw = body?.linkedinUrl != null ? String(body.linkedinUrl) : undefined
  const researchgateUrlRaw = body?.researchgateUrl != null ? String(body.researchgateUrl) : undefined
  const scholarUrlRaw = body?.scholarUrl != null ? String(body.scholarUrl) : undefined
  const photoUrlRaw = body?.photoUrl != null ? String(body.photoUrl) : undefined
  const academicLevel = body?.academicLevel != null ? String(body.academicLevel).trim() : undefined
  const memberCategory = body?.memberCategory != null ? String(body.memberCategory).trim() : undefined
  const specialty = body?.specialty != null ? String(body.specialty).trim() : undefined
  const directorId = body?.directorId != null ? String(body.directorId).trim() : undefined
  const directorName = body?.directorName != null ? String(body.directorName).trim() : undefined

  await updateUserProfile(userId, {
    displayName: displayName === "" ? null : displayName,
    publicEmail: publicEmail === "" ? null : publicEmail,
    linkedinUrl: linkedinUrlRaw === undefined ? undefined : normalizeUrl(linkedinUrlRaw),
    researchgateUrl: researchgateUrlRaw === undefined ? undefined : normalizeUrl(researchgateUrlRaw),
    scholarUrl: scholarUrlRaw === undefined ? undefined : normalizeUrl(scholarUrlRaw),
    photoUrl: photoUrlRaw === undefined ? undefined : normalizePhoto(photoUrlRaw),
    academicLevel: academicLevel === "" ? null : academicLevel,
    memberCategory: memberCategory === "" ? null : memberCategory,
    specialty: specialty === "" ? null : specialty,
    directorId: directorId === "" ? null : directorId,
    directorName: directorName === "" ? null : directorName,
  })

  return NextResponse.json({ ok: true })
}
