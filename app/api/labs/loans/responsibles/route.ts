import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLocalLabServerStore } from "@/lib/lab-local-server"
export const runtime="nodejs"
export async function GET(){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Local Labs preview disabled"},{status:404});const session=await getServerSession(authOptions);const id=(session?.user as any)?.id;if(!id)return NextResponse.json({error:"Laboratory membership required"},{status:403});const store=getLocalLabServerStore();try{if(!store.getMembership(id))return NextResponse.json({error:"Laboratory membership required"},{status:403});return NextResponse.json({responsibles:store.listLoanResponsibles()})}finally{store.close()}}
