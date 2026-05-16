"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LinksForm } from "@/components/links-form"
import { TasksPanel } from "@/components/tasks-panel"
import { useLanguage } from "@/components/language-provider"

export function StudentDashboard({
  name,
  driveEmbedUrl,
  docEmbedUrl,
}: {
  name: string
  driveEmbedUrl: string | null
  docEmbedUrl: string | null
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
            <h2 className="font-semibold">{t("dashboard.linksTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.linksDesc")}</p>
            <div className="mt-4">
              <LinksForm initialPptUrl={driveEmbedUrl ?? ""} initialDocUrl={docEmbedUrl ?? ""} />
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="font-semibold">{t("dashboard.calendarTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.calendarDesc")}</p>
            <div className="mt-4">
              <TasksPanel canEdit />
            </div>
          </div>

          {driveEmbedUrl || docEmbedUrl ? (
            <>
              {driveEmbedUrl ? (
                <div className="rounded-xl border overflow-hidden">
                  <div className="px-5 py-3 border-b">
                    <h2 className="font-semibold">{t("dashboard.previewTitle")}</h2>
                  </div>
                  <iframe title="Drive preview" src={driveEmbedUrl} className="w-full h-[70vh]" allow="autoplay" />
                </div>
              ) : null}
              {docEmbedUrl ? (
                <div className="rounded-xl border overflow-hidden">
                  <div className="px-5 py-3 border-b">
                    <h2 className="font-semibold">{t("dashboard.docPreviewTitle")}</h2>
                  </div>
                  <iframe title="Document preview" src={docEmbedUrl} className="w-full h-[70vh]" />
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border p-5 text-sm text-muted-foreground">{t("dashboard.noLinkYet")}</div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
