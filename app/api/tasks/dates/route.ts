import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { listTaskDatesInRange } from "@/lib/store"

function isValidDateYYYYMMDD(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = (searchParams.get("from") ?? "").trim()
  const to = (searchParams.get("to") ?? "").trim()
  if (!isValidDateYYYYMMDD(from) || !isValidDateYYYYMMDD(to)) {
    return NextResponse.json({ error: "Invalid range. Use from/to YYYY-MM-DD." }, { status: 400 })
  }

  return NextResponse.json({ dates: listTaskDatesInRange(from, to) })
}

