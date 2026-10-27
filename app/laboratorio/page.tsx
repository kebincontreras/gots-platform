import { Header } from "@/components/header"
import { LabAccessPanel } from "@/components/laboratory/lab-access-panel"
import { getLaboratoryContext } from "@/lib/lab-module"

export default async function LaboratoryPage() {
  const { authorization } = await getLaboratoryContext("public")
  return (
    <>
      <Header />
      <LabAccessPanel
        title="Laboratorio GOTS"
        description="El inventario, los experimentos y los préstamos viven dentro de GOTS y usan la misma sesión de tu cuenta principal."
        allowed={authorization.allowed}
      />
    </>
  )
}
