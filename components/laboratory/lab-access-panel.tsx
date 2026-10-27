import { LabNavigation } from "./lab-navigation"
import { LabFixtureWorkspace } from "./lab-fixture-workspace"
import { LabAttachmentWorkspace } from "./lab-attachment-workspace"
import { LabNotificationInbox } from "./lab-notification-inbox"
import { LabAdminWorkspace } from "./lab-admin-workspace"

export function LabAccessPanel({
  title,
  description,
  active,
  allowed,
  identity,
  role,
}: {
  title: string
  description: string
  active?: string
  allowed: boolean
  identity?: { subject: string; sessionExpiresAt: number; labAccessScope: string }
  role?: string
}) {
  return (
    <main className="container mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-28">
      <LabNavigation active={active} />
      <section className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">GOTS · Laboratorio</p>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        {allowed ? (
          <>
            <LabFixtureWorkspace section={active as "inventory" | "experiments" | "loans"} identity={identity!} role={role} />
            {active === "experiments" ? <LabAttachmentWorkspace /> : null}
            <LabNotificationInbox />
            <LabAdminWorkspace />
          </>
        ) : (
          <p className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            Tu sesión de GOTS está activa, pero no existe un permiso de laboratorio aprobado para esta cuenta. El acceso se mantiene bloqueado hasta conectar una fuente de permisos autorizada; el correo y el rol de GOTS no conceden acceso automáticamente.
          </p>
        )}
      </section>
    </main>
  )
}
