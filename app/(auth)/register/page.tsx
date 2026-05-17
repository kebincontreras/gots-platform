"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/language-provider"

export default function RegisterPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [emailConfirm, setEmailConfirm] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t("auth.registerTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.registerSubtitle")}</p>

        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)

            if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
              setError(t("auth.mismatchEmail"))
              return
            }
            if (password !== passwordConfirm) {
              setError(t("auth.mismatchPassword"))
              return
            }

            setLoading(true)

            const res = await fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, emailConfirm, password, passwordConfirm }),
            })
            if (!res.ok) {
              const body = await res.json().catch(() => ({}))
              setLoading(false)
              setError(body?.error ?? "No se pudo crear la cuenta.")
              return
            }

            const signInRes = await signIn("credentials", {
              email,
              password,
              redirect: false,
              callbackUrl: "/dashboard",
            })
            setLoading(false)
            if (!signInRes || signInRes.error) {
              router.push("/login")
              return
            }
            router.push(signInRes.url ?? "/dashboard")
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("auth.name")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("auth.email")}</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              type="email"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("auth.confirmEmail")}</label>
            <Input
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              type="email"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("auth.passwordMin")}</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("auth.confirmPassword")}</label>
            <Input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              type="password"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? t("auth.creating") : t("auth.createAccount")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <a className="underline" href="/login">
              {t("auth.signIn")}
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
