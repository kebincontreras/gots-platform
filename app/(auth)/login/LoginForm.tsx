"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

export function LoginForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard?tab=inicio"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const showQuick = process.env.NODE_ENV !== "production"

  const doLogin = async (e: string, p: string) => {
    setError(null)
    setLoading(true)
    const res = await signIn("credentials", {
      email: e,
      password: p,
      redirect: false,
      callbackUrl,
    })
    setLoading(false)
    if (!res || res.error) {
      setError(t("auth.invalidCredentials"))
      return
    }
    router.push(res.url ?? callbackUrl)
  }

  return (
    <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{t("auth.loginTitle")}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t("auth.loginSubtitle")}</p>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          await doLogin(email, password)
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("auth.email")}</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("auth.password")}</label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? t("auth.entering") : t("auth.signIn")}
        </Button>

        {showQuick ? (
          <div className="grid gap-2">
            <div className="text-xs text-muted-foreground">Accesos rápidos (solo local/dev)</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  const seedRes = await fetch("/api/dev/seed-admins", { method: "POST" }).catch(() => null)
                  if (!seedRes || !seedRes.ok) {
                    const body = seedRes ? await seedRes.json().catch(() => ({})) : {}
                    setError(body?.error ?? "No se pudo inicializar el usuario profesor en local.")
                    return
                  }
                  const e = "kebinandrescontreras@gmail.com"
                  const p = "kebinandrescontreras"
                  setEmail(e)
                  setPassword(p)
                  await doLogin(e, p)
                }}
              >
                Entrar profesor
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  const e = "demo@gots.local"
                  const p = "GotsLocal2026!"
                  setEmail(e)
                  setPassword(p)
                  await doLogin(e, p)
                }}
              >
                Entrar estudiante
              </Button>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <a className="underline" href="/register">
            {t("auth.createAccount")}
          </a>
        </p>
      </form>
    </div>
  )
}
