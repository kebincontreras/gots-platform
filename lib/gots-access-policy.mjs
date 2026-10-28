/**
 * Narrow, server-side policy for the GOTS account owner. This is deliberately
 * not an environment-driven allowlist: membership requests have only the two
 * explicitly designated recipients and resolvers.
 */
export const GROUP_ADMIN_EMAILS = Object.freeze([
  "kebinandrescontreras@gmail.com",
  "rafael.torres@saber.uis.edu.co",
])

export function isGroupAdmin(email) {
  return typeof email === "string" && GROUP_ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/** Content ownership is independent from a GOTS role. */
export function canManageOwnedContent(actorId, ownerId) {
  return typeof actorId === "string" && actorId.length > 0 && actorId === ownerId
}
