import { Header } from "@/components/header"
import { LabOverview } from "@/components/laboratory/lab-overview"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// The NextAuth cookie is request-specific. Do not cache this landing page as
// an anonymous render after a visitor has already signed in to GOTS.
export const dynamic = "force-dynamic"

export default async function LaboratoryPage() {
  const session = await getServerSession(authOptions)
  return (
    <>
      <Header />
      <LabOverview authenticated={Boolean((session?.user as any)?.id)} />
    </>
  )
}
