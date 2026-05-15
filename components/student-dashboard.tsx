"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DriveForm } from "@/components/drive-form"
import { TasksPanel } from "@/components/tasks-panel"
import { useLanguage } from "@/components/language-provider"

export function StudentDashboard({
  name,
  driveEmbedUrl,
}: {
  name: string
  driveEmbedUrl: string | null
}) {
  const { t } = useLanguage()
  const greeting = t("dashboard.studentGreeting").replace("{name}", name)

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <h1 className="text-2xl font-semibold">{t("dashboard.studentPanel")}</h1>
        <p className="text-muted-foreground mt-1">{greeting}</p>

        <div className="mt-6 grid gap-6">
          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">{t("dashboard.presentationTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.presentationDesc")}</p>
            <div className="mt-4">
              <DriveForm initialUrl={driveEmbedUrl ?? ""} />
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">{t("dashboard.calendarTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.calendarDesc")}</p>
            <div className="mt-4">
              <TasksPanel canEdit />
            </div>
          </div>

          {driveEmbedUrl ? (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <h2 className="font-semibold">{t("dashboard.previewTitle")}</h2>
              </div>
              <iframe title="Drive preview" src={driveEmbedUrl} className="w-full h-[70vh]" allow="autoplay" />
            </div>
          ) : (
            <div className="rounded-xl border p-5 text-sm text-muted-foreground">{t("dashboard.noLinkYet")}</div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}

