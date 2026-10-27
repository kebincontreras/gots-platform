import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"
export const runtime="nodejs"
async function storeForMember(){const s=await getServerSession(authOptions);const id=(s?.user as any)?.id;if(!id)return null;const store=getLocalLabServerStore();if(store.getMembership(id)?.scope!=="approved"){store.close();return null}store.ensureInventoryFixtures();return store}
export async function GET(){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404});const store=await storeForMember();if(!store)return NextResponse.json({error:"Laboratory membership required"},{status:403});try{return NextResponse.json({items:store.listInventory()})}finally{store.close()}}
// Inventory is read-only here.  A reservation is created only by the pending
// loan-request transaction, with dates, responsible professor and the explicit
// simulated preview acknowledgement.
