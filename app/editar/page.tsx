import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EditHub } from "@/components/edit-hub"

export default async function EditPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login?callbackUrl=/editar")

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">Editar</h1>
        <p className="text-muted-foreground mt-1">Crea noticias y agrega publicaciones.</p>
        <div className="mt-6">
          <EditHub />
        </div>
      </div>
      <Footer />
    </main>
  )
}

