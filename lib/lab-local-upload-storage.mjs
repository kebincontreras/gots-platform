import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import sharp from "sharp"

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = Object.freeze({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })

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
function root() { return process.env.GOTS_LAB_LOCAL_UPLOAD_DIR || path.join(os.tmpdir(), "gots-labs-preview-uploads") }
export async function writeLocalExperimentUpload(id, extension, bytes) {
  const key = `${id}.${extension}`
  const directory = root(); await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, key), bytes, { flag: "wx" })
  return key
}
export async function readLocalExperimentUpload(key) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) throw new Error("attachment-key-invalid")
  return fs.readFile(path.join(root(), key))
}
