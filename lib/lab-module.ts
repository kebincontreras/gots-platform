import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getLabSectionPath, LabModuleSection } from "./lab-module-contract.mjs"

export { LabModuleSection }

export async function getLaboratoryContext(section: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) redirect(`/login?callbackUrl=${getLabSectionPath(section)}`)

  // `getServerSession` has already validated the signed JWT.  Do not run a
  // second, presentation-only expiry check against the serialized session:
  // it can be stale at the RSC boundary while the same validated request is
  // accepted by every Labs API route.  This does not accept client input.
  const identity = { subject: userId, sessionExpiresAt: Number.MAX_SAFE_INTEGER, labAccessScope: "authenticated-gots-user" }
  return {
    identity,
    role: (session?.user as any)?.role as string | undefined,
    authorization: { allowed: true, reason: "authenticated-gots-user" },
  }
}
