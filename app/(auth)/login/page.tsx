import { Suspense } from "react"
import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}

