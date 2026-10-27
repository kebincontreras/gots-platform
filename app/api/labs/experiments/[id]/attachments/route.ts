import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"
import { validateLocalExperimentUpload, writeLocalExperimentUpload } from "@/lib/lab-local-upload-storage.mjs"

export const runtime = "nodejs"

async function current() {
  const session = await getServerSession(authOptions)
  const id = (session?.user as any)?.id as string | undefined
  if (!id) return null
  const store = getLocalLabServerStore()
  if (store.getMembership(id)?.scope !== "approved") { store.close(); return null }
  return { id, store }
}

function unavailable() { return NextResponse.json({ error: "Local Labs preview disabled" }, { status: 404 }) }
function errorResponse(error: unknown) {
  const message = String((error as any)?.message ?? "attachment-invalid-request")
  const status = message.includes("approved-participant-required") ? 403 : message.includes("not-found") ? 404 : 400
  return NextResponse.json({ error: message }, { status })
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") return unavailable()
  const actor = await current()
  if (!actor) return NextResponse.json({ error: "Laboratory membership required" }, { status: 403 })
  try {
    const { id } = await params
    const attachments = actor.store.listSyntheticImages({ experimentId: id, actorId: actor.id }).map((attachment: any) => attachment.local_path.startsWith("local-upload:") ? { ...attachment, download_url: `/api/labs/experiments/${id}/attachments/${attachment.id}/content` } : attachment)
    return NextResponse.json({ attachments })
  } catch (error) { return errorResponse(error) } finally { actor.store.close() }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") return unavailable()
  const actor = await current()
  if (!actor) return NextResponse.json({ error: "Laboratory membership required" }, { status: 403 })
  try {
    const { id } = await params
    const attachmentId = crypto.randomUUID()
    const contentType = request.headers.get("content-type") ?? ""
    let attachment
    if (contentType.startsWith("multipart/form-data")) {
      const form = await request.formData(); const file = form.get("file")
      if (!(file instanceof File)) throw new Error("attachment-file-required")
      const bytes = Buffer.from(await file.arrayBuffer()); const safe = await validateLocalExperimentUpload(file, bytes)
      const storageKey = await writeLocalExperimentUpload(attachmentId, safe.extension, bytes)
      attachment = actor.store.addLocalUpload({ id:attachmentId,experimentId:id,actorId:actor.id,storageKey,mediaType:safe.mediaType,sizeBytes:safe.sizeBytes })
      attachment.download_url=`/api/labs/experiments/${id}/attachments/${attachmentId}/content`
    } else {
      const body = await request.json().catch(() => null)
      attachment = actor.store.addSyntheticImage({ id:attachmentId,experimentId:id,actorId:actor.id,localPath:String(body?.localPath??""),mediaType:String(body?.mediaType??"") })
    }
    return NextResponse.json({ attachment }, { status: 201 })
  } catch (error) { return errorResponse(error) } finally { actor.store.close() }
}
