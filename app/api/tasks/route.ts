import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createTask, listTasksByDate } from "@/lib/store"

function isValidDateYYYYMMDD(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = (searchParams.get("date") ?? "").trim()
    if (!isValidDateYYYYMMDD(date)) {
      return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 })
    }
    return NextResponse.json({ tasks: await listTasksByDate(date) })
  } catch {
    return NextResponse.json({ error: "Error cargando tareas." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => null)
    const date = (body?.date ?? "").toString().trim()
    const title = (body?.title ?? "").toString().trim()
    const description = (body?.description ?? "").toString().trim()

    if (!isValidDateYYYYMMDD(date) || !title) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 })
    }

    const task = await createTask({
      date,
      title,
      description: description ? description : null,
      createdBy: userId,
    })

    return NextResponse.json({ task })
  } catch {
    return NextResponse.json({ error: "Error creando tarea." }, { status: 500 })
  }
}
