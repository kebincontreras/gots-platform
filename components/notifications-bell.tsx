"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  url: string | null
  createdAt: string
  readAt: string | null
}

export function NotificationsBell({ solid }: { solid: boolean }) {
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    const res = await fetch("/api/notifications?limit=15")
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? "Error")
      return
    }
    setItems(body.notifications ?? [])
    setUnread(Number(body.unread ?? 0))
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, 15000)
    return () => window.clearInterval(id)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: null }),
    })
    await load()
  }

  const onOpenChange = async (open: boolean) => {
    if (open) await load()
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={solid ? "" : "text-white hover:text-white hover:bg-white/10"}
          aria-label="Notificaciones"
        >
          <span className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center px-1">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-[360px] max-w-[92vw]" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            Marcar todo como leído
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error ? (
          <div className="px-2 py-2 text-sm text-destructive">{error}</div>
        ) : null}
        {items.length === 0 && !error ? (
          <div className="px-2 py-6 text-sm text-muted-foreground text-center">Sin notificaciones.</div>
        ) : null}
        {items.map((n) => (
          <DropdownMenuItem key={n.id} className="items-start gap-2" asChild>
            {n.url ? (
              <Link href={n.url}>
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm font-medium">
                    {n.title} {n.readAt ? null : <span className="text-xs text-red-600">•</span>}
                  </div>
                  {n.body ? <div className="text-xs text-muted-foreground">{n.body}</div> : null}
                  <div className="text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-medium">
                  {n.title} {n.readAt ? null : <span className="text-xs text-red-600">•</span>}
                </div>
                {n.body ? <div className="text-xs text-muted-foreground">{n.body}</div> : null}
                <div className="text-[11px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

