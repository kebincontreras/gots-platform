import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"
export const runtime="nodejs"
async function current(){const session=await getServerSession(authOptions);const id=(session?.user as any)?.id as string|undefined;if(!id)return null;const store=getLocalLabServerStore();if(!store.getMembership(id)){store.close();return null}return{id,store}}
export async function GET(){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404});const actor=await current();if(!actor)return NextResponse.json({error:"Laboratory membership required"},{status:403});try{return NextResponse.json({notifications:actor.store.listInternalNotifications(actor.id)})}finally{actor.store.close()}}
export async function PATCH(request:Request){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404});const actor=await current();if(!actor)return NextResponse.json({error:"Laboratory membership required"},{status:403});try{const body=await request.json().catch(()=>null);return NextResponse.json({notification:actor.store.markInternalNotificationRead({id:String(body?.id??""),userId:actor.id})})}catch(error:any){return NextResponse.json({error:String(error?.message??"notification-not-found")},{status:404})}finally{actor.store.close()}}
