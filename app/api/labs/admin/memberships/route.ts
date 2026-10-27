import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"
export const runtime="nodejs"
async function current(){const session=await getServerSession(authOptions);const id=(session?.user as any)?.id as string|undefined;if(!id)return null;const store=getLocalLabServerStore();return{id,store}}
export async function GET(){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404});const actor=await current();if(!actor)return NextResponse.json({error:"Laboratory admin required"},{status:403});try{return NextResponse.json(actor.store.listLabMemberships({actorId:actor.id}))}catch(error:any){return NextResponse.json({error:String(error.message)},{status:403})}finally{actor.store.close()}}
export async function PATCH(request:Request){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404});const actor=await current();if(!actor)return NextResponse.json({error:"Laboratory admin required"},{status:403});try{const body=await request.json();const membership=actor.store.setLabMembership({actorId:actor.id,userId:String(body.userId??""),scope:body.scope});return NextResponse.json({membership})}catch(error:any){return NextResponse.json({error:String(error.message)},{status:String(error.message).includes("admin")?403:400})}finally{actor.store.close()}}
