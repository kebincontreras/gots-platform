import Link from "next/link"
import { LabModuleSection } from "@/lib/lab-module"

const items = [
  { href: "/laboratorio", label: "Laboratorio", section: null },
  { href: "/laboratorio/inventario", label: "Inventario", section: LabModuleSection.INVENTORY },
  { href: "/laboratorio/experimentos", label: "Experimentos", section: LabModuleSection.EXPERIMENTS },
  { href: "/laboratorio/prestamos", label: "Préstamos", section: LabModuleSection.LOANS },
]

export function LabNavigation({ active }: { active?: string }) {
  return (
    <nav aria-label="Navegación del laboratorio" className="flex flex-wrap gap-2 border-b pb-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-md px-3 py-2 text-sm font-medium ${active === item.section ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
