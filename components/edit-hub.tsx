"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewsEditor } from "@/components/news-editor"
import { PublicationsEditor } from "@/components/publications-editor"

export function EditHub() {
  return (
    <Tabs defaultValue="news" className="w-full">
      <TabsList>
        <TabsTrigger value="news">Noticias</TabsTrigger>
        <TabsTrigger value="publications">Publicaciones</TabsTrigger>
      </TabsList>

      <TabsContent value="news">
        <NewsEditor />
      </TabsContent>
      <TabsContent value="publications">
        <PublicationsEditor />
      </TabsContent>
    </Tabs>
  )
}

