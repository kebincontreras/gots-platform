import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { getUserById } from "@/lib/store"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TasksPanel } from "@/components/tasks-panel"

export default async function EstudiantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) redirect(`/login?callbackUrl=/profesor/estudiante/${id}`)
  if (role !== "PROFESSOR") redirect("/dashboard")

  const student = await getUserById(id)
  if (!student || (student.role !== "STUDENT" && student.role !== "EDITOR_NOTICIAS")) redirect("/profesor")

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{student.name}</h1>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
          <Link className="underline text-sm" href="/profesor">
            Volver
          </Link>
        </div>

        <div className="mt-6 grid gap-6">
          {student.driveEmbedUrl ? (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h2 className="font-semibold">Presentación (Drive)</h2>
                <p className="text-sm text-muted-foreground">
                  Última actualización: {new Date(student.updatedAt).toDateString()}
                </p>
              </div>
              <iframe title="Drive preview" src={student.driveEmbedUrl} className="w-full h-[75vh]" allow="autoplay" />
            </div>
          ) : (
            <div className="rounded-xl border p-5 text-sm text-muted-foreground">Este estudiante aún no tiene link.</div>
          )}

          {student.docEmbedUrl ? (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h2 className="font-semibold">Documento (Google Docs)</h2>
                <p className="text-sm text-muted-foreground">
                  Última actualización: {new Date(student.updatedAt).toDateString()}
                </p>
              </div>
              <iframe title="Document preview" src={student.docEmbedUrl} className="w-full h-[75vh]" />
            </div>
          ) : null}

          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">Calendario y tareas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tareas semanales del grupo (se muestran también aquí para revisar el avance de este estudiante).
            </p>
            <div className="mt-4">
              <TasksPanel canEdit />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
