import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { ProfessorTasksPage } from "@/components/professor-tasks-page"

export default async function ProfesorTareasPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) redirect("/login?callbackUrl=/profesor/tareas")
  if (role !== "PROFESSOR") redirect("/dashboard")

  return <ProfessorTasksPage />
}
