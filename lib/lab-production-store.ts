import { getGotsPostgresLabExecutor } from "./store"
import { createGotsPostgresLabWorkflowAdapter } from "./lab-production-postgres-adapter.mjs"

/** Single server-side selection point. No route uses this until the reviewed
 * empty schema is applied. A missing/other backend remains disabled. */
export function getConfiguredProductionLabStore() {
  if (process.env.GOTS_LABS_BACKEND !== "postgres") return null
  if (process.env.GOTS_LABS_SCHEMA_READY !== "1") throw new Error("labs-postgres-schema-not-ready")
  const executor = getGotsPostgresLabExecutor()
  return createGotsPostgresLabWorkflowAdapter(executor)
}
