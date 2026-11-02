"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, User } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GROUP_PROFESSORS, type GroupProfessor } from "@/lib/lab-group-professors"
import { getImagePath } from "@/lib/utils"

type InventoryItem = {
  id: string
  name: string
  reference?: string | null
  description?: string | null
  image_path?: string | null
  image_url?: string | null
  location?: string
  location_id?: string | null
  category?: string | null
  box_label?: string | null
  quantity_total: number
  quantity_available: number
  quantity_reserved: number
  kit_children_count?: number | string | null
}
type LocationInfo = { id: string; type?: string; number?: number; label: string; building?: string | null }
type InventoryDetail = InventoryItem & {
  location_detail?: { label?: string } | null
  kit_children?: InventoryItem[]
  history?: { experiment_id: string; status: string; returned_at?: string | null }[]
}

/** Postgres devuelve los conteos como texto ("0"), y "0" es verdadero en JS:
 * hay que convertir antes de decidir si un equipo es un kit. */
const kitPieces = (item: { kit_children_count?: number | string | null }) => Number(item.kit_children_count ?? 0) || 0

const hasImage = (item: InventoryItem) => Boolean(item.image_path || item.image_url)
const imageSrc = (item: InventoryItem) => `/api/labs/inventory/${encodeURIComponent(item.id)}/image`

/** Paso 1 (igual que en GOTS_LAB): elegir el profesor del grupo cuyo inventario
 * se quiere explorar. Paso 2: el catálogo de ese profesor. */
export function LabCatalogueWorkspace() {
  const [professor, setProfessor] = useState<GroupProfessor | null>(null)
  const [pending, setPending] = useState<GroupProfessor | null>(null)
  if (professor) return <LabCatalogueView professor={professor} onBack={() => setProfessor(null)} />
  return (
    <section className="mt-6 rounded-xl border bg-card p-6">
      <h2 className="text-xl font-semibold">Inventario de equipos ópticos</h2>
      <p className="mt-2 text-sm text-muted-foreground">Elige el profesor cuyo inventario quieres explorar.</p>
      {pending ? (
        <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
          <p className="text-lg font-medium">Inventario en construcción</p>
          <p className="mt-2 text-sm text-muted-foreground">Todavía no está disponible el inventario de {pending.fullName}.</p>
          <button type="button" className="mt-4 inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" onClick={() => setPending(null)}>
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Volver a la lista de profesores
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {GROUP_PROFESSORS.map((p) => (
            <button type="button" key={p.id} onClick={() => (p.hasInventory ? setProfessor(p) : setPending(p))} className="group flex flex-col items-center rounded-xl border bg-card p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
              <span className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted">
                {p.imageUrl ? <img src={getImagePath(p.imageUrl)} alt={p.fullName} className="h-full w-full object-cover" /> : <User aria-hidden className="h-8 w-8 text-muted-foreground" />}
              </span>
              <span className="text-sm font-medium group-hover:text-primary">{p.fullName}</span>
              {!p.hasInventory && <span className="mt-1 text-xs text-muted-foreground">Próximamente</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${tone ?? ""}`}>{value}</p>
    </div>
  )
}

/** Browse the real Labs catalogue. Requests always go through the server-side
 * GOTS session and availability is never decided by the browser. */
function LabCatalogueView({ professor, onBack }: { professor: GroupProfessor; onBack: () => void }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [locations, setLocations] = useState<LocationInfo[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [boxes, setBoxes] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [box, setBox] = useState("")
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [detail, setDetail] = useState<InventoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("Consulta el inventario disponible en Labs.")

  const textValues = (values: unknown, key: string) =>
    Array.isArray(values)
      ? values
          .map((value) => (typeof value === "string" ? value : value && typeof value === "object" ? (value as Record<string, unknown>)[key] : null))
          .filter((value): value is string => typeof value === "string")
      : []

  const load = async (next: Record<string, string> = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query, ...(location ? { location } : {}), ...(category ? { category } : {}), ...(box ? { box } : {}), ...next })
      const response = await fetch(`/api/labs/inventory?${params}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setItems(body.items)
      setLocations(body.locations)
      setCategories(textValues(body.categories, "category"))
      setBoxes(textValues(body.boxes, "box_label"))
      setMessage(`${body.items.length} equipo(s) encontrados.`)
    } catch (error: any) {
      setMessage(`Operación rechazada: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const chooseCategory = async (value: string) => {
    setCategory(value)
    setBox("")
    setSelected(null)
    setDetail(null)
    setLoading(true)
    try {
      const response = await fetch(`/api/labs/inventory?${new URLSearchParams({ ...(value ? { category: value } : {}) })}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setItems(body.items)
      setLocations(body.locations)
      setCategories(textValues(body.categories, "category"))
      setBoxes(textValues(body.boxes, "box_label"))
      setMessage(`${body.items.length} equipo(s) encontrados.`)
    } catch (error: any) {
      setMessage(`Operación rechazada: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const open = async (item: InventoryItem) => {
    setSelected(item)
    setDetail(null)
    try {
      const response = await fetch(`/api/labs/inventory?itemId=${encodeURIComponent(item.id)}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setDetail(body.item)
    } catch (error: any) {
      setMessage(`Operación rechazada: ${error.message}`)
    }
  }
  const close = () => {
    setSelected(null)
    setDetail(null)
  }

  const buildingOf = (item: InventoryItem) => locations.find((l) => l.id === item.location_id)?.building ?? null
  // El detalle trae el kit, la ubicación y el historial. Pero para un kit sus propias
  // cantidades son las del padre (1), no la suma de sus piezas: los números de
  // disponibilidad que se muestran son los de la lista, así que esos mandan.
  const current: InventoryDetail | null = selected ? { ...(detail ?? {}), ...selected } : null

  return (
    <section className="mt-6 rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Cambiar de profesor
          </button>
          <h2 className="text-xl font-semibold">Inventario a cargo de {professor.fullName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Las reservas pendientes y de experimentos se reflejan en la disponibilidad. Las fotografías, cuando existen, son privadas para usuarios autenticados de GOTS.</p>
        </div>
        <a className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/laboratorio/prestamos">Solicitar préstamo</a>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Para pedir equipos, abre <b>Solicitar préstamo</b>, selecciona piezas o equipos, ajusta cantidades, fechas y propósito; la reserva solo ocurre al enviar la solicitud.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input className="rounded border bg-background p-2 text-sm" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Buscar nombre o referencia" />
        <select className="rounded border bg-background p-2 text-sm" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">Todas las ubicaciones</option>
          {locations.map((x) => <option key={x.id} value={x.id}>{x.label}{x.building ? ` · ${x.building}` : ""}</option>)}
        </select>
        <select className="rounded border bg-background p-2 text-sm" value={category} onChange={(e) => chooseCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select className="rounded border bg-background p-2 text-sm" value={box} onChange={(e) => setBox(e.target.value)} disabled={!category}>
          <option value="">Todas las cajas</option>
          {boxes.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <button className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => load()}>Aplicar filtros</button>

      <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p>

      {loading ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex min-h-44 animate-pulse items-center gap-6 rounded-xl border p-6">
              <div className="h-32 w-32 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
          <p className="text-lg text-muted-foreground">No se encontraron elementos</p>
          <p className="mt-2 text-sm text-muted-foreground">Intenta seleccionar otra ubicación o refina tu búsqueda.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <button type="button" key={item.id} className="flex min-h-44 items-center rounded-xl border p-6 text-left transition-colors hover:bg-muted" onClick={() => open(item)}>
              <div className="flex w-full items-center gap-5">
                {hasImage(item) && <img className="h-32 w-32 shrink-0 rounded-lg bg-white object-cover" src={imageSrc(item)} alt="" loading="lazy" decoding="async" />}
                <div className="min-w-0">
                  <div className="text-xl font-medium leading-snug">{item.name}</div>
                  <div className="mt-2 text-base text-muted-foreground">{item.reference || "Sin referencia"} · {item.location} · {item.category || "Sin categoría"}</div>
                  <div className="mt-3 text-base sm:text-lg">
                    {item.quantity_available}/{item.quantity_total} disponibles · {item.quantity_reserved} reservadas{kitPieces(item) > 0 ? ` · kit con ${kitPieces(item)} piezas` : ""}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(current)} onOpenChange={(isOpen) => { if (!isOpen) close() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          {current && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8 leading-snug">{current.name}</DialogTitle>
                <DialogDescription>{current.reference ? `Referencia: ${current.reference}` : "Sin referencia"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {hasImage(current) ? (
                  <img src={imageSrc(current)} alt={current.name} className="h-48 w-full rounded-lg border bg-white object-contain" />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">Sin imagen disponible</div>
                )}
                {current.category && (
                  <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Categoría</p><p className="text-sm">{current.category}</p></div>
                )}
                {current.box_label && (
                  <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Caja</p><p className="text-sm">{current.box_label}</p></div>
                )}
                {current.description && (
                  <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Descripción</p><p className="text-sm">{current.description}</p></div>
                )}
                {(current.kit_children?.length ?? 0) > 0 && (
                  <div className="border-t pt-2">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Piezas de este kit ({current.kit_children!.length})</p>
                    <p className="mb-2 text-xs text-muted-foreground">Este kit se reserva pieza por pieza, no como bloque. Para reservar una, agrégala desde la solicitud de préstamo o el experimento.</p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {current.kit_children!.map((child) => (
                        <div key={child.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1.5 text-sm">
                          <span>{child.name}{child.reference && <span className="text-muted-foreground"> · {child.reference}</span>}</span>
                          <span className={child.quantity_available ? "text-xs font-medium text-green-600 dark:text-green-400" : "text-xs font-medium text-red-600 dark:text-red-400"}>{child.quantity_available ? "Disponible" : "Reservada"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Inventario a cargo de</p><p className="text-sm">{professor.fullName}</p></div>
                {current.location && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Ubicación</p>
                    <p className="text-sm">{current.location_detail?.label || current.location}{buildingOf(current) ? ` · ${buildingOf(current)}` : ""}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <Stat label="Cantidad total" value={current.quantity_total} />
                  <Stat label="Disponible" value={current.quantity_available} tone="text-green-600 dark:text-green-400" />
                  <Stat label="Reservado" value={current.quantity_reserved} tone="text-amber-600 dark:text-amber-400" />
                  <Stat label="Porcentaje disponible" value={`${current.quantity_total ? Math.round((current.quantity_available / current.quantity_total) * 100) : 0}%`} />
                </div>
                {current.quantity_available === 0 && (
                  <div className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">No hay inventario disponible en este momento</div>
                )}
                {current.quantity_reserved > 0 && (
                  <div className="rounded-lg bg-amber-100 p-3 text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {current.quantity_reserved} unidad{current.quantity_reserved !== 1 ? "es" : ""} reservada{current.quantity_reserved !== 1 ? "s" : ""} por solicitudes o experimentos activos
                  </div>
                )}
                <div className="border-t pt-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Historial de reservas</p>
                  {current.history?.length ? current.history.map((h, i) => (
                    <p key={i} className="mt-1">Experimento {h.experiment_id}: {h.status}{h.returned_at ? ` · devuelto ${new Date(h.returned_at).toLocaleString()}` : ""}</p>
                  )) : <p className="text-muted-foreground">Sin reservas registradas.</p>}
                </div>
                <a className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href={`/laboratorio/prestamos?itemId=${encodeURIComponent(current.id)}`}>Seleccionar para préstamo</a>
                <p className="text-xs text-muted-foreground">Luego ajusta la cantidad y agrégalo a la solicitud; esto todavía no reserva el equipo.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
