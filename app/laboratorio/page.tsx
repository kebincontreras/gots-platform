import { Header } from "@/components/header"
import { LabOverview } from "@/components/laboratory/lab-overview"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function LaboratoryPage() {
  const session = await getServerSession(authOptions)
  return (
    <>
      <Header />
      <LabOverview authenticated={Boolean((session?.user as any)?.id)} />
    </>
  )
}
