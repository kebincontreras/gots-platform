import { LabNavigation } from "./lab-navigation"
import { LabFixtureWorkspace } from "./lab-fixture-workspace"
import { LabAttachmentWorkspace } from "./lab-attachment-workspace"
import { LabNotificationInbox } from "./lab-notification-inbox"
import { LabAdminWorkspace } from "./lab-admin-workspace"
import { LabLoanCartWorkspace } from "./lab-loan-cart-workspace"
import { LabExperimentLifecycleWorkspace } from "./lab-experiment-lifecycle-workspace"
import { LabCatalogueWorkspace } from "./lab-catalogue-workspace"

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
            {active === "inventory" ? <LabCatalogueWorkspace /> : active === "loans" ? <LabLoanCartWorkspace role={role} /> : <LabFixtureWorkspace section="experiments" identity={identity!} role={role} />}
            {active === "experiments" ? <LabAttachmentWorkspace /> : null}
            {active === "experiments" ? <LabExperimentLifecycleWorkspace /> : null}
            <LabNotificationInbox />
            <LabAdminWorkspace />
          </>
        ) : (
          <p className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            Inicia sesión con tu cuenta GOTS para acceder a Labs.
          </p>
        )}
      </section>
    </main>
  )
}
