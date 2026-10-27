import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { createLabModuleGateway, authorizeLabSection, LabModuleSection } from "./lab-module-contract.mjs"

export { LabModuleSection }

const disabledGateway = createLabModuleGateway()

export async function getLaboratoryContext(section: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect(`/login?callbackUrl=/laboratorio/${section}`)

  const expiresAt = new Date(session?.expires ?? 0).getTime()
  const identity = await disabledGateway.getIdentity(userId, expiresAt)
  return {
    identity,
    authorization: authorizeLabSection(identity, section),
  }
}
