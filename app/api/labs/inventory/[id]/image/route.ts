import { NextResponse } from "next/server"
import { closeLabActor, getLabActor, labsUnavailable } from "@/lib/lab-route-runtime"

export const runtime="nodejs"

/** Inventory photographs never live in public/. A verified GOTS session is
 * required before the database blob is read or returned. */
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const actor=await getLabActor("approved")
  if(!actor)return NextResponse.json({error:"GOTS authentication required"},{status:403})
  if(actor.kind==="disabled")return NextResponse.json(labsUnavailable(),{status:503})
  try {
    const {id}=await params
    if(actor.kind==="fixture")return NextResponse.json({error:"inventory-image-not-found"},{status:404})
    const image=(await actor.store.getInventoryImage({inventoryItemId:id}))[0]
    if(!image)return NextResponse.json({error:"inventory-image-not-found"},{status:404})
    return new NextResponse(image.content,{headers:{"content-type":image.media_type,"content-disposition":`inline; filename="${id}.webp"`,"cache-control":"private, no-store","x-content-type-options":"nosniff"}})
  } catch(error) {
    const message=String((error as any)?.message??error)
    return NextResponse.json({error:message},{status:/invalid/.test(message)?400:404})
  } finally {closeLabActor(actor)}
}
