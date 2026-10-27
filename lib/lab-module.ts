import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getLocalFixtureGateway, authorizeLabSection, getLabSectionPath, LabModuleSection } from "./lab-module-contract.mjs"

export { LabModuleSection }

export async function getLaboratoryContext(section: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect(`/login?callbackUrl=${getLabSectionPath(section)}`)

  const expiresAt = new Date(session?.expires ?? 0).getTime()
  const identity = await getLocalFixtureGateway().getIdentity(userId, expiresAt)
  return {
    identity,
    role: (session?.user as any)?.role as string | undefined,
    authorization: authorizeLabSection(identity, section),
  }
}
