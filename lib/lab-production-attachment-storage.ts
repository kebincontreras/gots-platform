/** Database-backed attachment storage is deliberately opt-in. It is suitable
 * only for small, private images; it never silently falls back to disk. */
export const LAB_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024
export const LAB_EXPERIMENT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024
export function isDatabaseLabAttachmentStorageEnabled() {
  return process.env.GOTS_LABS_ATTACHMENT_STORAGE === "database" && process.env.GOTS_LABS_ATTACHMENT_STORAGE_READY === "1"
}
