import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NewsEditor } from "@/components/news-editor"

export default async function NoticiasEditorPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  if (!session?.user) redirect("/login?callbackUrl=/noticias/editor")
  if (role !== "PROFESSOR" && role !== "EDITOR_NOTICIAS") redirect("/dashboard")

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">Editor de noticias</h1>
        <p className="text-muted-foreground mt-1">Crea y elimina noticias. Se verán en la página de Noticias y en la portada.</p>
        <div className="mt-6">
          <NewsEditor />
        </div>
      </div>
      <Footer />
    </main>
  )
}

