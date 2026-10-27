import { LabAccessScope, authorizeGotsLab } from "./common-auth-contract.mjs"

export const LabModuleSection = Object.freeze({
  INVENTORY: "inventory",
  EXPERIMENTS: "experiments",
  LOANS: "loans",
})

export const LabSectionPath = Object.freeze({
  [LabModuleSection.INVENTORY]: "/laboratorio/inventario",
  [LabModuleSection.EXPERIMENTS]: "/laboratorio/experimentos",
  [LabModuleSection.LOANS]: "/laboratorio/prestamos",
})

export function getLabSectionPath(section) {
  return LabSectionPath[section] ?? "/laboratorio"
}

/**
 * A data/access boundary for the embedded laboratory module.
 *
 * Disabled is deliberately the production default until an approved mapping
 * is implemented. `mock` exists only for local contract tests; it never reads
 * Supabase or grants access based on a user's email address or GOTS role.
 *
 * `external` mirrors the legacy GOTS_LAB loan-request scope only. This module
 * does not create external accounts, infer that scope, or make it available
 * through GOTS registration.
 */
export function createLabModuleGateway({ mode = "disabled", grants = {} } = {}) {
  return {
    mode: mode === "mock" ? "mock" : "disabled",
    async getIdentity(subject, sessionExpiresAt) {
      if (mode !== "mock") return { subject, sessionExpiresAt, labAccessScope: LabAccessScope.NONE }
      const grant = grants[subject]
      return {
        subject,
        sessionExpiresAt,
        labAccessScope: grant?.labAccessScope ?? LabAccessScope.NONE,
      }
    },
    async listInventory() {
      return []
    },
    async listExperiments() {
      return []
    },
    async listLoans() {
      return []
    },
  }
}

/** Development-only explicit fixture grants.  Values are user IDs, never
 * emails or roles: `GOTS_LAB_LOCAL_FIXTURE_GRANTS={"user-id":"approved"}`.
 * Nothing is enabled unless the variable is deliberately supplied. */
export function getLocalFixtureGateway(env = process.env) {
  if (env.NODE_ENV !== "development" || !env.GOTS_LAB_LOCAL_FIXTURE_GRANTS) return createLabModuleGateway()
  try {
    const raw = JSON.parse(env.GOTS_LAB_LOCAL_FIXTURE_GRANTS)
    const grants = Object.fromEntries(Object.entries(raw).flatMap(([subject, scope]) => {
      if (scope === "approved") return [[subject, { labAccessScope: LabAccessScope.APPROVED_LAB_MEMBER }]]
      if (scope === "external") return [[subject, { labAccessScope: LabAccessScope.EXTERNAL }]]
      return []
    }))
    return createLabModuleGateway({ mode: "mock", grants })
  } catch { return createLabModuleGateway() }
}

export function authorizeLabSection(identity, section, now = Date.now()) {
  const resource = section === LabModuleSection.LOANS ? "loan-request" : "laboratory"
  return authorizeGotsLab(identity, resource, now)
}
