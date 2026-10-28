import { Header } from "@/components/header"
import { LabAccessPanel } from "@/components/laboratory/lab-access-panel"
import { getLaboratoryContext, LabModuleSection } from "@/lib/lab-module"

export const dynamic = "force-dynamic"

export default async function LaboratoryLoansPage() {
  const { authorization, identity, role } = await getLaboratoryContext(LabModuleSection.LOANS)
  return <><Header /><LabAccessPanel active={LabModuleSection.LOANS} title="Préstamos" description="Solicita y sigue préstamos de equipos con permisos separados de las funciones internas del laboratorio." allowed={authorization.allowed} identity={identity} role={role} /></>
}
