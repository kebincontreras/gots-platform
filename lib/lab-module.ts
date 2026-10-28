import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { authorizeLabSection, getLabSectionPath, LabModuleSection } from "./lab-module-contract.mjs"

export { LabModuleSection }

export async function getLaboratoryContext(section: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect(`/login?callbackUrl=${getLabSectionPath(section)}`)

  const expiresAt = new Date(session?.expires ?? 0).getTime()
  // Labs belongs to the existing GOTS session. The fixture gateway correctly
  // has no production grants, but using it here made a signed-in user appear
  // anonymous before any Labs route was reached.
  const identity = { subject: userId, sessionExpiresAt: expiresAt, labAccessScope: "authenticated-gots-user" }
  return {
    identity,
    role: (session?.user as any)?.role as string | undefined,
    authorization: authorizeLabSection(identity, section),
  }
}
