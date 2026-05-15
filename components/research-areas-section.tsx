"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPagePath } from "@/lib/utils"
import { ArrowRight, Zap, Eye, Brain } from "lucide-react"

const researchAreas = [
  {
    id: "time-reverse-imaging",
    title: "Time-Reverse Imaging",
    description: "Reconstrucción de escenas pasadas utilizando trazas térmicas y modelos de lenguaje visual para resolver problemas inversos temporales",
    icon: Eye,
    href: "/ramas/time-reverse-imaging",
    highlights: ["Visión Computacional", "Machine Learning", "Problemas Inversos"]
  },
  // Futuras ramas de investigación se pueden agregar aquí
]

// Se eliminó la sección de ramas de investigación a petición del usuario.