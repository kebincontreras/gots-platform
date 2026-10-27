import { Header } from "@/components/header"
import { LabAccessPanel } from "@/components/laboratory/lab-access-panel"
import { getLaboratoryContext, LabModuleSection } from "@/lib/lab-module"

export default async function LaboratoryInventoryPage() {
  const { authorization } = await getLaboratoryContext(LabModuleSection.INVENTORY)
  return <><Header /><LabAccessPanel active={LabModuleSection.INVENTORY} title="Inventario" description="Consulta equipos ópticos y su disponibilidad cuando tu permiso individual de laboratorio esté aprobado." allowed={authorization.allowed} /></>
}
