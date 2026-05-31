import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getPendingMembershipRequestForUser, getUserById, listProfessors } from "@/lib/store"
import { StudentDashboard } from "@/components/student-dashboard"
import fs from "node:fs/promises"
import path from "node:path"

async function getLegacyDirectorNames(): Promise<string[]> {
  try {
    const jsonPath = path.join(process.cwd(), "public", "equipo.json")
    const raw = await fs.readFile(jsonPath, "utf8")
    const parsed = JSON.parse(raw) as any
    const team = Array.isArray(parsed?.team) ? parsed.team : []
    return team
      .filter((p: any) => p?.activo !== false)
      .filter((p: any) => String(p?.nivelEscolar ?? "").toUpperCase() === "PROFESOR" || String(p?.cargo ?? "").toLowerCase() === "profesor")
      .map((p: any) => `${String(p?.nombre ?? "").trim()} ${String(p?.apellido ?? "").trim()}`.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login?callbackUrl=/dashboard")

  const user = await getUserById(userId)
  if (!user) redirect("/login")

  if (user.role === "PROFESSOR") redirect("/profesor")

  const pending = await getPendingMembershipRequestForUser(userId).catch(() => null)
  const professors = await listProfessors().catch(() => [])
  const legacyDirectorNames = await getLegacyDirectorNames()

  return (
    <StudentDashboard
      userId={userId}
      name={user.name}
      driveEmbedUrl={user.driveEmbedUrl}
      docEmbedUrl={user.docEmbedUrl}
      groupMember={user.groupMember}
      pendingMembershipRequest={pending ? { id: pending.id, createdAt: pending.createdAt } : null}
      initialProfile={{
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
      }}
      professors={professors}
      legacyDirectorNames={legacyDirectorNames}
    />
  )
}
