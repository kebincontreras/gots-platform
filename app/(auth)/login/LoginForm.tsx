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
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{t("auth.loginTitle")}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t("auth.loginSubtitle")}</p>

      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setLoading(true)
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
          })
          setLoading(false)
          if (!res || res.error) {
            setError(t("auth.invalidCredentials"))
            return
          }
          router.push(res.url ?? callbackUrl)
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
