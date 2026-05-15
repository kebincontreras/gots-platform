"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

type Task = {
  id: string
  date: string
  title: string
  description: string | null
  createdAt: string
}

function toYYYYMMDD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function TasksPanel({ canEdit }: { canEdit: boolean }) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState<Date>(new Date())
  const selectedKey = useMemo(() => toYYYYMMDD(selected), [selected])
  const [taskDates, setTaskDates] = useState<Set<string>>(new Set())

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())

  async function refreshMonthDots(month: Date) {
    const fromDate = new Date(month.getFullYear(), month.getMonth(), 1)
    const toDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const from = toYYYYMMDD(fromDate)
    const to = toYYYYMMDD(toDate)

    const res = await fetch(`/api/tasks/dates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return
    setTaskDates(new Set((body.dates ?? []) as string[]))
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/tasks?date=${encodeURIComponent(selectedKey)}`)
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(body?.error ?? "No se pudieron cargar tareas.")
      return
    }
    setTasks(body.tasks ?? [])
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  useEffect(() => {
    refreshMonthDots(calendarMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth])

  return (
    <div className="grid gap-6 md:grid-cols-[340px,1fr]">
      <div>
        <div className="font-semibold">{t("tasks.calendar")}</div>
        <div className="mt-3">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => d && setSelected(d)}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            modifiers={{
              hasTasks: (date) => taskDates.has(toYYYYMMDD(date)),
            }}
          />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {t("tasks.selectedDate")}: <span className="font-medium text-foreground">{selectedKey}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">{t("tasks.tasksFor").replace("{date}", selectedKey)}</div>
            <div className="text-sm text-muted-foreground">{t("tasks.weeklyDesc")}</div>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            {loading ? t("tasks.loading") : t("tasks.refresh")}
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[380px,1fr]">
          {canEdit ? (
            <form
              className="grid gap-3 rounded-lg border bg-background p-4 h-fit"
              onSubmit={async (e) => {
                e.preventDefault()
                setSaving(true)
                setError(null)
                const res = await fetch("/api/tasks", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: selectedKey, title, description }),
                })
                const body = await res.json().catch(() => ({}))
                setSaving(false)
                if (!res.ok) {
                  setError(body?.error ?? "No se pudo crear la tarea.")
                  return
                }
                setTitle("")
                setDescription("")
                refresh()
                refreshMonthDots(calendarMonth)
              }}
            >
              <div className="text-sm font-semibold">{t("tasks.addTask")}</div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("tasks.title")}</div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Subir ppt v1" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("tasks.descriptionOptional")}</div>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: incluir objetivo, método, resultados preliminares"
                />
              </div>
              <Button className="w-full" type="submit" disabled={saving || !title.trim()}>
                {saving ? t("tasks.saving") : t("tasks.add")}
              </Button>
              {error && <div className="text-sm text-destructive">{error}</div>}
            </form>
          ) : null}

          <div className="grid gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-4">
                <div className="font-medium">{task.title}</div>
                {task.description ? <div className="mt-1 text-sm text-muted-foreground">{task.description}</div> : null}
                <div className="mt-2 text-xs text-muted-foreground">
                  {t("tasks.dueDate")}: {task.date}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("tasks.createdAt")}: {new Date(task.createdAt).toLocaleString()}
                </div>
              </div>
            ))}

            {!loading && tasks.length === 0 && (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">{t("tasks.noTasks")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
