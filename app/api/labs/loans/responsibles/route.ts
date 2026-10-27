import { NextResponse } from "next/server"
import { closeLabActor, getLabActor, labsUnavailable } from "@/lib/lab-route-runtime"
export const runtime="nodejs"
export async function GET(){const actor=await getLabActor("loan");if(!actor)return NextResponse.json({error:"Laboratory membership required"},{status:403});if(actor.kind==="disabled")return NextResponse.json(labsUnavailable(),{status:503});try{return NextResponse.json({responsibles:actor.kind==="fixture"?actor.store.listLoanResponsibles():await actor.store.listLoanResponsibles()})}finally{closeLabActor(actor)}}
