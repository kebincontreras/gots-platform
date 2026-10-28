import { Header } from "@/components/header"
import { LabAccessPanel } from "@/components/laboratory/lab-access-panel"
import { getLaboratoryContext, LabModuleSection } from "@/lib/lab-module"

export const dynamic = "force-dynamic"

export default async function LaboratoryInventoryPage() {
  const { authorization, identity, role } = await getLaboratoryContext(LabModuleSection.INVENTORY)
  return <><Header /><LabAccessPanel active={LabModuleSection.INVENTORY} title="Inventario" description="Consulta equipos ópticos y su disponibilidad con tu sesión GOTS." allowed={authorization.allowed} identity={identity} role={role} /></>
}
