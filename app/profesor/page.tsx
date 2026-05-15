import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { listStudents } from "@/lib/store"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export default async function ProfesorPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) redirect("/login?callbackUrl=/profesor")
  if (role !== "PROFESSOR") redirect("/dashboard")

  const students = await listStudents()

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">Panel del profesor</h1>
        <p className="text-muted-foreground mt-1">
          Lista de estudiantes y sus presentaciones. Haz clic en <span className="font-medium">Ver</span> para abrir el perfil del estudiante.
        </p>

        <div className="mt-6 rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b font-semibold">Estudiantes</div>
          <div className="divide-y">
            {students.map((s) => (
              <div key={s.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{s.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{s.driveEmbedUrl ? "Con link" : "Sin link"}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/profesor/estudiante/${s.id}`}>Ver</Link>
                  </Button>
                </div>
              </div>
            ))}
            {students.length === 0 && <div className="px-5 py-4 text-sm text-muted-foreground">Sin estudiantes.</div>}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
