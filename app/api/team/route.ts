import { NextResponse } from "next/server"
import { listTeamMembers } from "@/lib/store"

export async function GET() {
  try {
    const team = await listTeamMembers()
    return NextResponse.json({ team })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "No se pudo cargar el equipo." }, { status: 500 })
  }
}

