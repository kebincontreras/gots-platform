"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Message = {
  id: string
  userId: string
  userName: string
  message: string
  createdAt: string
}

type GroupChatProps = {
  currentUserId: string
}

export function GroupChat({ currentUserId }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    setError(null)
    const res = await fetch("/api/chat?limit=120")
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? "No se pudo cargar el chat.")
      setLoading(false)
      return
    }
    setMessages(body.messages ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, 5000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border bg-background p-3 h-[360px] overflow-auto">
        {loading ? <div className="text-sm text-muted-foreground">Cargando...</div> : null}
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        {!loading && !error && messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin mensajes.</div>
        ) : null}
        <div className="grid gap-2">
          {messages.map((m) => {
            const isMine = m.userId === currentUserId

            return(
            <div key={m.id}
             className={`w-fit max-w-[70%] rounded-md border px-3 py-2 break-words
             ${ isMine ? "justify-self-end" : "justify-self-start" }`}
             >
              <div className="text-xs text-muted-foreground flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{m.userName}</span>
                <span>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-sm whitespace-pre-wrap">{m.message}</div>
            </div>
            )
            })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          const message = text.trim()
          if (!message) return
          setSending(true)
          setError(null)
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          })
          const body = await res.json().catch(() => ({}))
          setSending(false)
          if (!res.ok) {
            setError(body?.error ?? "No se pudo enviar.")
            return
          }
          setText("")
          await load()
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje..." />
        <Button type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </form>
    </div>
  )
}

