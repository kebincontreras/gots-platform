import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PublicationsEditor } from "@/components/publications-editor"

export default async function PublicacionesEditorPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login?callbackUrl=/publicaciones/editor")

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">Editor de publicaciones</h1>
        <p className="text-muted-foreground mt-1">Agrega tus artículos y enlaces (PDF/externo). Eliminar solo tus propias publicaciones (el profesor puede eliminar todas).</p>
        <div className="mt-6">
          <PublicationsEditor />
        </div>
      </div>
      <Footer />
    </main>
  )
}

