import { getConfiguredProductionLabStore } from "./lab-production-store"

/** The sole production selection point. Development fixtures never leak into
 * production; production needs backend, enabled and schema-ready flags. */
export function getLabRuntime() {
  if (process.env.NODE_ENV === "development") return { kind: "fixture" as const, store: null }
  const store = getConfiguredProductionLabStore()
  if (!store) return { kind: "disabled" as const, store: null }
  return { kind: "postgres" as const, store }
}
