import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"

export const runtime = "nodejs"
async function current() { const session=await getServerSession(authOptions); const id=(session?.user as any)?.id as string|undefined; const role=(session?.user as any)?.role as string|undefined; if(!id)return null; const store=getLocalLabServerStore(); if(!store.getMembership(id)){store.close();return null} store.ensureInventoryFixtures(); return {id,role,store} }
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404})
  const actor=await current(); if(!actor)return NextResponse.json({error:"Laboratory membership required"},{status:403})
  try { const body=await request.json().catch(()=>null); const {id}=await params; let loan
    if(body?.action==="decide") { if(actor.role!=="PROFESSOR" || !actor.store.isLoanResponsible(actor.id)) throw new Error("loan-decision-forbidden"); loan=actor.store.decideLoan({loanId:id,professorId:actor.id,decision:body?.decision,rejectionReason:body?.rejectionReason}) }
    else if(body?.action==="request-extension") loan=actor.store.requestLoanExtension({loanId:id,requesterId:actor.id,newUsageEnd:String(body?.newUsageEnd??"")})
    else if(body?.action==="resolve-extension") { if(actor.role!=="PROFESSOR" || !actor.store.isLoanResponsible(actor.id)) throw new Error("loan-decision-forbidden"); loan=actor.store.resolveLoanExtension({loanId:id,professorId:actor.id,approve:body?.approve===true}) }
    else if(body?.action==="return") loan=actor.store.returnLoan({loanId:id,actorId:actor.id,isResponsible:actor.role==="PROFESSOR"})
    else throw new Error("loan-invalid-action")
    return NextResponse.json({loan})
  } catch(error:any) { const message=String(error?.message??"loan-invalid-action"); const status=message.includes("forbidden")?403:message==="loan-not-found"?404:409; return NextResponse.json({error:message},{status}) }
  finally {actor.store.close()}
}
