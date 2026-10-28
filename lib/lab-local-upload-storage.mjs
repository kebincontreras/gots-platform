import sharp from "sharp"

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = Object.freeze({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })
// Development fixtures must never cause Vercel's production function tracer to
// include a filesystem root. These bytes are intentionally process-local and
// are discarded on restart; fixture metadata itself remains in its separate
// development SQLite store.
const localUploads = new Map()

function hasSafeSignature(type, bytes) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
  if (type === "image/webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP"
  return false
}
export async function validateLocalExperimentUpload(file, bytes) {
  if (!file || !(file instanceof File) || !TYPES[file.type]) throw new Error("attachment-media-type-not-allowed")
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("attachment-size-not-allowed")
  if (!hasSafeSignature(file.type, bytes)) throw new Error("attachment-content-not-allowed")
  try { const metadata=await sharp(bytes,{failOn:"error"}).metadata();if(!metadata.width||!metadata.height)throw new Error("invalid") } catch { throw new Error("attachment-content-not-allowed") }
  return { mediaType: file.type, extension: TYPES[file.type], sizeBytes: bytes.length }
}
export async function writeLocalExperimentUpload(id, extension, bytes) {
  const key = `${id}.${extension}`
  if (localUploads.has(key)) throw new Error("attachment-key-exists")
  localUploads.set(key, Buffer.from(bytes))
  return key
}
export async function readLocalExperimentUpload(key) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) throw new Error("attachment-key-invalid")
  const bytes = localUploads.get(key)
  if (!bytes) throw new Error("attachment-not-found")
  return Buffer.from(bytes)
}
