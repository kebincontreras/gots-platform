import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getUserById } from "@/lib/store"
import { StudentDashboard } from "@/components/student-dashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect("/login?callbackUrl=/dashboard")

  const user = getUserById(userId)
  if (!user) redirect("/login")

  if (user.role === "PROFESSOR") redirect("/profesor")

  return <StudentDashboard name={user.name} driveEmbedUrl={user.driveEmbedUrl} />
}
