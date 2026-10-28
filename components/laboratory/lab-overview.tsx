import Link from "next/link"
import { FlaskConical, PackageSearch, ShieldCheck, Handshake } from "lucide-react"
import { getPagePath } from "@/lib/utils"
import { LabNavigation } from "./lab-navigation"

const sections = [
  {
    href: "/laboratorio/inventario",
    title: "Inventario",
    description: "Equipos, ubicaciones, disponibilidad y reservas para el trabajo del grupo.",
    note: "Disponible para cuentas autenticadas de GOTS",
    icon: PackageSearch,
  },
  {
    href: "/laboratorio/experimentos",
    title: "Experimentos",
    description: "Trazabilidad, participantes, sesiones y equipos asociados a cada práctica.",
    note: "Disponible para cuentas autenticadas de GOTS",
    icon: FlaskConical,
  },
  {
    href: "/laboratorio/prestamos",
    title: "Préstamos",
    description: "Solicitudes, responsables y seguimiento de equipos fuera del laboratorio.",
    note: "Solicitud para cuentas GOTS; decisión por responsable autorizado",
    icon: Handshake,
  },
]

export function LabOverview({ authenticated }: { authenticated: boolean }) {
  return (
    <main className="container mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-28">
      <LabNavigation />
      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-10">
        <p className="text-sm font-medium text-muted-foreground">GOTS · Plataforma principal</p>
        <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Labs</h1>
            <p className="mt-3 text-muted-foreground">
              Una organización única para el laboratorio dentro de GOTS. La cuenta GOTS será la entrada única; los permisos de cada sección se mantendrán separados y explícitos.
            </p>
          </div>
          <Link className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href={getPagePath(authenticated ? "/laboratorio/inventario" : "/login?callbackUrl=/laboratorio/inventario")}>
            {authenticated ? "Abrir inventario" : "Acceder con cuenta GOTS"}
          </Link>
        </div>
      </section>

      <section aria-label="Secciones del laboratorio" className="mt-6 grid gap-4 md:grid-cols-3">
        {sections.map(({ href, title, description, note, icon: Icon }) => (
          <Link key={href} href={getPagePath(href)} className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/40">
            <Icon aria-hidden className="h-6 w-6 text-primary" />
            <h2 className="mt-5 text-xl font-semibold group-hover:text-primary">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <p className="mt-5 text-xs font-medium text-amber-700 dark:text-amber-300">{note}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 flex gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 p-5 text-sm text-muted-foreground">
        <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 dark:text-sky-300" />
        <p>
          Esta vista no muestra datos ni concede privilegios. Labs requiere una sesión GOTS; los experimentos conservan controles de propietario y colaboración, y los préstamos responsables explícitos.
        </p>
      </section>
    </main>
  )
}
