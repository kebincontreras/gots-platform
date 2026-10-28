import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLabRuntime } from "@/lib/lab-runtime"
import { getLocalLabServerStore } from "@/lib/lab-local-server"

/**
 * The only route boundary for Labs identity.  The browser never supplies an
 * actor id: it always comes from the server-side NextAuth session. A valid
 * GOTS session is sufficient for ordinary Labs access. Fixtures are
 * development-only; every other environment either uses the reviewed
 * PostgreSQL adapter or fails closed. Ownership, collaboration, Labs-admin,
 * and loan-responsible checks remain in their individual operations.
 */
export async function getLabActor(_access: "approved" | "loan" = "approved") {
  const session = await getServerSession(authOptions)
  const id = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (!id) return null
  let runtime: ReturnType<typeof getLabRuntime>
  try { runtime = getLabRuntime() } catch { return { id, role, kind: "disabled" as const } }
  if (runtime.kind === "disabled") return { id, role, kind: "disabled" as const }
  if (runtime.kind === "fixture") {
    const store = getLocalLabServerStore()
    return { id, role, kind: "fixture" as const, store }
  }
  return { id, role, kind: "postgres" as const, store: runtime.store }
}

export function labsUnavailable() {
  return { error: "Labs backend is not configured" }
}

export function closeLabActor(actor: Awaited<ReturnType<typeof getLabActor>> | null) {
  if (actor?.kind === "fixture") actor.store.close()
}

export function labErrorStatus(error: unknown, fallback = 409) {
  const message = String((error as any)?.message ?? error)
  if (/forbidden|required|membership|admin|owner/.test(message)) return 403
  if (/not-found|not found/.test(message)) return 404
  if (/invalid|missing|uuid/.test(message)) return 400
  return fallback
}
