import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"

export const runtime = "nodejs"

async function current() {
  const session = await getServerSession(authOptions)
  const id = (session?.user as any)?.id as string | undefined
  const role = (session?.user as any)?.role as string | undefined
  if (!id) return null
  const store = getLocalLabServerStore()
  // The fixture grant is keyed by the application's UUID, never by a client
  // supplied email or role.  It is deliberately isolated from production data.
  if (!store.getMembership(id)) { store.close(); return null }
  store.ensureInventoryFixtures()
  return { id, role, store }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Local Labs preview disabled" }, { status: 404 })
  const actor = await current()
  if (!actor) return NextResponse.json({ error: "Laboratory membership required" }, { status: 403 })
  try { return NextResponse.json({ loans: actor.store.listLoansFor({ userId: actor.id, role: actor.role }) }) }
  finally { actor.store.close() }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Local Labs preview disabled" }, { status: 404 })
  const actor = await current()
  if (!actor) return NextResponse.json({ error: "Laboratory membership required" }, { status: 403 })
  try {
    const body = await request.json().catch(() => null)
    const loan = actor.store.createLoan({
      id: crypto.randomUUID(), requesterId: actor.id,
      professorId: String(body?.professorId ?? ""),
      // Each request has an explicit positive integer quantity.  `itemIds` is
      // accepted only for old local-preview clients and maps to quantity one.
      items: Array.isArray(body?.items) ? body.items.map((item: any) => ({ inventoryItemId: String(item?.inventoryItemId ?? item?.id ?? ""), quantity: Number(item?.quantity) })) : undefined,
      itemIds: Array.isArray(body?.items) ? undefined : (Array.isArray(body?.itemIds) ? body.itemIds.map(String) : []),
      purposeDescription: String(body?.purposeDescription ?? ""),
      usageStart: String(body?.usageStart ?? ""), usageEnd: String(body?.usageEnd ?? ""),
      // This preview stores only an explicit simulated test acknowledgement.
      simulatedAcceptance: body?.simulatedAcceptance === true,
    })
    return NextResponse.json({ loan }, { status: 201 })
  } catch (error: any) {
    const message = String(error?.message ?? "loan-invalid-request")
    return NextResponse.json({ error: message }, { status: message.startsWith("inventory-") ? 409 : 400 })
  } finally { actor.store.close() }
}
