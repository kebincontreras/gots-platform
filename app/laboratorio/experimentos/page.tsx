import { Header } from "@/components/header"
import { LabAccessPanel } from "@/components/laboratory/lab-access-panel"
import { getLaboratoryContext, LabModuleSection } from "@/lib/lab-module"

export const dynamic = "force-dynamic"

export default async function LaboratoryExperimentsPage() {
  const { authorization, identity, role } = await getLaboratoryContext(LabModuleSection.EXPERIMENTS)
  return <><Header /><LabAccessPanel active={LabModuleSection.EXPERIMENTS} title="Experimentos" description="Registra trazabilidad, participantes y responsabilidad de equipos desde tu cuenta GOTS." allowed={authorization.allowed} identity={identity} role={role} /></>
}
