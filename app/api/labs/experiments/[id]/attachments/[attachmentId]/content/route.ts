import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"
import { readLocalExperimentUpload } from "@/lib/lab-local-upload-storage.mjs"

export const runtime="nodejs"
export async function GET(_request:Request,{params}:{params:Promise<{id:string;attachmentId:string}>}) {
  if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404})
  const session=await getServerSession(authOptions);const userId=(session?.user as any)?.id as string|undefined
  if(!userId)return NextResponse.json({error:"Laboratory membership required"},{status:403})
  const store=getLocalLabServerStore();if(store.getMembership(userId)?.scope!=="approved"){store.close();return NextResponse.json({error:"Laboratory membership required"},{status:403})}
  try { const {id,attachmentId}=await params;const row=store.getLocalUpload({attachmentId,actorId:userId});if(row.experiment_id!==id)return NextResponse.json({error:"attachment-not-found"},{status:404});const bytes=await readLocalExperimentUpload(row.storage_key);return new NextResponse(bytes,{headers:{"content-type":row.media_type,"content-disposition":"inline","cache-control":"no-store","x-content-type-options":"nosniff"}}) }
  catch(error:any){const message=String(error?.message??"attachment-not-found");return NextResponse.json({error:message},{status:message.includes("required")?403:404})}finally{store.close()}
}
