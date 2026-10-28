/**
 * Contract-only helpers for a future shared GOTS / GOTS_LAB identity.
 *
 * This module intentionally does not contact Supabase, NextAuth, or any
 * external service.  It makes the authorization and redirect boundary
 * executable before an identity tenant is selected.
 */

export const DEFAULT_GOTS_LAB_URL = "https://goofycorleone.github.io/GOTS_LAB/"

export const LabAccessScope = Object.freeze({
  APPROVED_LAB_MEMBER: "approved_lab_member",
  EXTERNAL: "external",
  NONE: "none",
})

export function safeReturnPath(value, fallback = "/") {
  if (typeof value !== "string") return fallback
  const candidate = value.trim()
  let decoded
  try {
    decoded = decodeURIComponent(candidate)
  } catch {
    return fallback
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) return fallback
  if (/[\u0000-\u001f\u007f]/.test(decoded)) return fallback
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

export function authorizeGotsLab(identity, resource, now = Date.now()) {
  if (resource === "public") return { allowed: true, reason: "public" }
  if (!identity || typeof identity !== "object" || typeof identity.subject !== "string" || !identity.subject) {
    return { allowed: false, reason: "missing-identity-claim" }
  }
  if (!Number.isFinite(identity.sessionExpiresAt) || identity.sessionExpiresAt <= now) {
    return { allowed: false, reason: "expired-or-missing-session" }
  }
  // Labs is part of GOTS: a valid GOTS session is the only ordinary-access
  // gate.  The legacy scope is retained as metadata only; it must never turn
  // into an administrator or loan-approver grant.
  return { allowed: true, reason: "authenticated-gots-user" }
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
