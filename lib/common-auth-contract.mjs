/**
 * Contract-only helpers for a future shared GOTS / GOTS_LAB identity.
 *
 * This module intentionally does not contact Supabase, NextAuth, or any
 * external service.  It makes the authorization and redirect boundary
 * executable before an identity tenant is selected.
 */

export const DEFAULT_GOTS_LAB_URL = "https://goofycorleone.github.io/GOTS_LAB/"

export const LabAccessScope = Object.freeze({
  UIS: "uis",
  EXTERNAL: "external",
  NONE: "none",
})

export function safeReturnPath(value, fallback = "/") {
  if (typeof value !== "string") return fallback
  const candidate = value.trim()
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return fallback
  return candidate
}

export function resolveGotsLabUrl(value) {
  const configured = typeof value === "string" && value.trim() ? value.trim() : DEFAULT_GOTS_LAB_URL
  try {
    const url = new URL(configured)
    if (url.protocol !== "https:") return DEFAULT_GOTS_LAB_URL
    url.username = ""
    url.password = ""
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return DEFAULT_GOTS_LAB_URL
  }
}

/**
 * Adds only a relative return path. It deliberately carries no token, email,
 * role, or user identifier across origins.
 */
export function buildGotsLabHref({ baseUrl, returnPath }) {
  const url = new URL(resolveGotsLabUrl(baseUrl))
  url.searchParams.set("returnTo", safeReturnPath(returnPath, "/"))
  return url.toString()
}

export function authorizeGotsLab(scope, resource) {
  if (resource === "public") return { allowed: true, reason: "public" }
  if (resource === "loan-request") {
    const allowed = scope === LabAccessScope.UIS || scope === LabAccessScope.EXTERNAL
    return { allowed, reason: allowed ? "loan-request" : "lab-access-required" }
  }
  const allowed = scope === LabAccessScope.UIS
  return { allowed, reason: allowed ? "uis-lab-member" : "uis-lab-membership-required" }
}

/**
 * Mock-only adapter for contract tests and local UI work. It never creates,
 * links, or migrates an account. Production configuration must replace it.
 */
export function createCommonAuthAdapter({ mode = "disabled", mockIdentity = null } = {}) {
  if (mode === "mock") {
    return {
      mode,
      getIdentity: () => mockIdentity,
      signOut: ({ returnTo } = {}) => ({
        cleared: ["gots-local-mock-session"],
        returnTo: safeReturnPath(returnTo, "/"),
        sharedProviderSignOut: false,
      }),
    }
  }
  return {
    mode: "disabled",
    getIdentity: () => null,
    signOut: ({ returnTo } = {}) => ({
      cleared: [],
      returnTo: safeReturnPath(returnTo, "/"),
      sharedProviderSignOut: false,
    }),
  }
}
