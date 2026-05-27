import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getPendingMembershipRequestForUser, getUserById, listProfessors } from "@/lib/store"
import { StudentDashboard } from "@/components/student-dashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login?callbackUrl=/dashboard")

  const user = await getUserById(userId)
  if (!user) redirect("/login")

  if (user.role === "PROFESSOR") redirect("/profesor")

  const pending = await getPendingMembershipRequestForUser(userId).catch(() => null)
  const professors = await listProfessors().catch(() => [])

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
        directorId: user.directorId,
      }}
      professors={professors}
    />
  )
}
