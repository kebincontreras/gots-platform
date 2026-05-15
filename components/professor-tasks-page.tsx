"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TasksPanel } from "@/components/tasks-panel"
import { useLanguage } from "@/components/language-provider"

export function ProfessorTasksPage() {
  const { t } = useLanguage()
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">{t("dashboard.calendarTitle")}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.calendarDesc")}</p>
        <div className="mt-6">
          <TasksPanel canEdit />
        </div>
      </div>
      <Footer />
    </main>
  )
}

