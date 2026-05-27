"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessagesSquare, UserRound, X } from "lucide-react"

type Member = { id: string; name: string; displayName?: string | null; memberCategory?: string | null; role?: string | null }
type Message = { id: string; userId: string; userName: string; message: string; createdAt: string }

export function ChatDock() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const [open, setOpen] = useState(false)
  const [groupMember, setGroupMember] = useState(false)

  const [members, setMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [recipient, setRecipient] = useState<Member | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const enabled = Boolean(session?.user) && (role === "PROFESSOR" || groupMember)

  useEffect(() => {
    if (!session?.user) {
      setGroupMember(false)
      return
    }
    if (role === "PROFESSOR") {
      setGroupMember(true)
      return
    }
    ;(async () => {
      try {
        const res = await fetch("/api/membership/request")
        const body = await res.json().catch(() => ({}))
        if (res.ok) setGroupMember(Boolean(body?.groupMember))
      } catch {
        // ignore
      }
    })()
  }, [session?.user, role])

  const loadMembers = async () => {
    try {
      const res = await fetch("/api/team")
      const body = await res.json().catch(() => ({}))
      if (!res.ok) return
      setMembers(Array.isArray(body?.team) ? body.team : [])
    } catch {
      // ignore
    }
  }

  const loadMessages = async () => {
    setError(null)
    try {
      const res = await fetch("/api/chat?limit=120")
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? "No se pudo cargar el chat.")
        return
      }
      setMessages(body.messages ?? [])
    } catch {
      setError("No se pudo cargar el chat.")
    }
  }

  useEffect(() => {
    if (!enabled || !open) return
    loadMembers()
    loadMessages()
    const id = window.setInterval(() => {
      loadMembers()
      loadMessages()
    }, 5000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const sortedMembers = useMemo(() => {
    const list = [...members]
    list.sort((a, b) => {
      const ar = String(a.role || "").toUpperCase()
      const br = String(b.role || "").toUpperCase()
      if (ar === "PROFESSOR" && br !== "PROFESSOR") return -1
      if (ar !== "PROFESSOR" && br === "PROFESSOR") return 1
      const an = (a.displayName || a.name || "").toLowerCase()
      const bn = (b.displayName || b.name || "").toLowerCase()
      return an.localeCompare(bn)
    })
    return list
  }, [members])

  if (!enabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <Button onClick={() => setOpen(true)} className="shadow-lg" aria-label="Abrir chat">
          <MessagesSquare className="h-4 w-4 mr-2" />
          GOTS mensajes
        </Button>
      ) : (
        <div className="w-[360px] max-w-[92vw] h-[520px] rounded-xl border bg-background shadow-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="font-medium text-sm">GOTS mensajes (global)</div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-[1fr_140px] min-h-0">
            <div className="flex flex-col min-h-0">
              <div className="flex-1 p-2 overflow-auto">
                {error ? <div className="text-sm text-destructive">{error}</div> : null}
                {messages.length === 0 && !error ? <div className="text-sm text-muted-foreground">Sin mensajes.</div> : null}
                <div className="grid gap-2">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-md border px-2 py-2">
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">{m.userName}</span>
                        <span className="shrink-0">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-1 text-sm whitespace-pre-wrap">{m.message}</div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>

              {recipient ? (
                <div className="border-t px-2 py-1 text-xs flex items-center justify-between gap-2 bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">
                      Para: <span className="font-medium">{recipient.displayName || recipient.name}</span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Quitar destinatario"
                    onClick={() => setRecipient(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}

              <form
                className="border-t p-2 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const message = text.trim()
                  if (!message) return
                  const finalMessage = recipient ? `@${recipient.displayName || recipient.name}: ${message}` : message
                  setText("")
                  const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: finalMessage }),
                  })
                  if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    setError(body?.error ?? "No se pudo enviar.")
                    return
                  }
                  await loadMessages()
                }}
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={recipient ? `Escribe a ${recipient.displayName || recipient.name}...` : "Escribe..."}
                />
                <Button type="submit">Enviar</Button>
              </form>
              <div className="px-2 pb-2 text-[10px] text-muted-foreground">
                Nota: este chat se actualiza cada 5s. Para tiempo real (sin refresh) hay que integrar Ably/Pusher.
              </div>
            </div>

            <div className="border-l p-2 overflow-auto">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Integrantes</div>
              <div className="grid gap-1">
                {sortedMembers.map((m) => {
                  const isSelected = recipient?.id === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`text-left text-xs rounded-md border px-2 py-1 hover:bg-muted/40 ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setRecipient(m)}
                      aria-label={`Escribir a ${m.displayName || m.name}`}
                    >
                      <div className="font-medium truncate">{m.displayName || m.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {String(m.role || "").toUpperCase() === "PROFESSOR" ? "Profesor" : m.memberCategory || "Miembro"}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
