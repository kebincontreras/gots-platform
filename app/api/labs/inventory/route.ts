import { NextResponse } from "next/server"
import { closeLabActor, getLabActor, labsUnavailable } from "@/lib/lab-route-runtime"
export const runtime="nodejs"
export async function GET(request:Request){
  const actor=await getLabActor("approved")
  if(!actor)return NextResponse.json({error:"GOTS authentication required"},{status:403})
  if(actor.kind==="disabled")return NextResponse.json(labsUnavailable(),{status:503})
  try { const url=new URL(request.url);const itemId=url.searchParams.get("itemId")
    if(actor.kind==="fixture"){actor.store.ensureInventoryFixtures();if(itemId){const item=actor.store.getInventoryItem(itemId);return item?NextResponse.json({item}):NextResponse.json({error:"inventory-item-not-found"},{status:404})};const box=url.searchParams.get("box");return NextResponse.json({items:actor.store.listInventory({query:url.searchParams.get("q")??"",locationId:url.searchParams.get("location")??undefined,category:url.searchParams.get("category")??undefined,boxLabel:box===null?undefined:box||undefined} as any),locations:actor.store.listLocations(),categories:actor.store.listCategories(),boxes:url.searchParams.get("category")?actor.store.listBoxLabels(url.searchParams.get("category")):[]})}
    if(itemId){const rows=await actor.store.inventory();const item=rows.find((x:any)=>x.id===itemId);return item?NextResponse.json({item}):NextResponse.json({error:"inventory-item-not-found"},{status:404})}
    const [items,locations,categories]=await Promise.all([actor.store.inventory(),actor.store.locations(),actor.store.categories()]);return NextResponse.json({items,locations,categories,boxes:[]})
  } finally {closeLabActor(actor)}
}
