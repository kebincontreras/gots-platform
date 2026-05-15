"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getImagePath, getPagePath } from "@/lib/utils"
import { CheckCircle, XCircle, Thermometer, Eye, ArrowLeft, Globe, AlertCircle, Check } from "lucide-react"

// Traducciones
const translations = {
  es: {
    backToHome: "Volver al inicio",
    title: "Time-Reverse Imaging",
    subtitle: "Reconstrucción de escenas pasadas utilizando trazas térmicas y modelos de lenguaje visual",
    interactiveExperience: "Experiencia Interactiva",
    interactiveDesc: "¿Puedes reconstruir el pasado? Elige la predicción correcta del estado anterior de la escena",
    canYouReconstruct: "¿Puedes reconstruir el pasado?",
    basedOnRGB: "Basándote únicamente en la información RGB, ¿cuál crees que era el estado anterior de la escena?",
    currentImage: "Imagen Actual (t + x segundos)",
    presentScene: "Esta es la escena que observamos en el presente",
    selectCorrect: "Selecciona la predicción correcta",
    whatWasPrevious: "¿Cuál era el estado anterior?",
    option: "Opción",
    incorrectAnswer: "¡Respuesta incorrecta!",
    dontWorryThermal: "No te preocupes, ¿y si además te doy la información térmica?",
    seeThermalInfo: "Ver información térmica",
    thermalInfo: "Información Térmica Adicional",
    withThermalInfo: "Ahora con la información térmica, ¿puedes identificar la predicción correcta?",
    thermalInfoTitle: "Información Térmica",
    heatTraces: "Trazas de calor que revelan el pasado",
    nowWithThermal: "Ahora con información térmica",
    canYouIdentify: "¿Puedes identificar la predicción correcta?",
    correctExcellent: "¡Correcto! Excelente trabajo",
    successfullyReconstructed: "Has logrado reconstruir exitosamente el estado pasado de la escena",
    correct: "¡Correcto!",
    tryAgain: "Intentar de nuevo",
    areYouSure: "¿Estás seguro de tu elección?",
    confirmChoice: "Has seleccionado la opción {option}. ¿Quieres confirmar tu respuesta o prefieres ver la información térmica para estar completamente seguro?",
    confirmAnswer: "Confirmar respuesta",
    seeThermalFirst: "Ver información térmica primero",
    selectedOption: "Opción seleccionada: {option}",
    conceptualFoundations: "Fundamentos Conceptuales",
    timeReversedIntro: "introduce una clase fundamentalmente nueva de problemas inversos. En lugar de recuperar variables ocultas de la escena actual",
    objective: "el objetivo es reconstruir un estado de escena pasado",
    fromObservations: "para Δt > 0, a partir de observaciones",
    presentTime: "en el tiempo presente",
    recentWork: "En trabajo reciente,",
    demonstratedViability: "demostramos la viabilidad de reconstruir estados pasados a partir de observaciones presentes. El framework combina",
    promptEngineering: "ingeniería de prompts",
    visualLanguageModels: "modelos de lenguaje visual (VLMs)",
    constrainedDiffusion: "proceso de difusión restringido",
    recoverConfigurations: "para recuperar configuraciones previas a partir de entradas RGB y térmicas.",
    thermalResults: "Los resultados térmicos codifican",
    heatFadingSignals: "señales de desvanecimiento de calor",
    temporalCodes: "que preservan códigos temporales, mientras que RGB ancla la",
    spatialStructure: "estructura espacial y el contexto",
    initialResults: "Los resultados iniciales en escenarios controlados muestran reconstrucciones plausibles del pasado",
    secondsBefore: "15 segundos antes",
    comparedGroundTruth: "comparadas contra ground truth (GT).",
    ablationStudy: "Un estudio de ablación muestra que incorporar una descripción de escena de alto nivel de un VLM proporciona un fuerte sesgo semántico previo, logrando los mejores resultados cuando se combina con entradas RGB y térmicas. Con",
    rgbAlone: "imágenes RGB solas, es imposible recuperar la posición de la persona 30 segundos antes",
    thermalInputs: "En contraste, las entradas térmicas permiten esta reconstrucción, confirmando que las trazas residuales contienen pistas suficientes para inferencia de horizonte temporal corto.",
    ablationStudyTitle: "Estudio de Ablación",
    comparisonMethods: "Comparación de métodos con diferentes modalidades de entrada",
    relatedPublications: "Publicaciones Relacionadas",
    scientificResearch: "Investigación científica que respalda esta línea de investigación",
    paperPresents: "Este paper presenta un enfoque novedoso para la reconstrucción de escenas invertida en el tiempo a partir de trazas térmicas utilizando modelos de lenguaje visual."
  },
  en: {
    backToHome: "Back to Home",
    title: "Time-Reverse Imaging",
    subtitle: "Past scene reconstruction using thermal traces and visual language models",
    interactiveExperience: "Interactive Experience",
    interactiveDesc: "What happened some seconds ago? Choose the correct prediction of the scene's previous state",
    canYouReconstruct: "What happened some seconds ago?",
    basedOnRGB: "Based solely on RGB information, what do you think was the previous state of the scene?",
    currentImage: "Current Image (t + x seconds)",
    presentScene: "This is the scene we observe in the present",
    selectCorrect: "Select the correct prediction",
    whatWasPrevious: "What was the previous state?",
    option: "Option",
    incorrectAnswer: "Incorrect answer!",
    dontWorryThermal: "Don't worry, what if I also give you thermal information?",
    seeThermalInfo: "See thermal information",
    thermalInfo: "Additional Thermal Information",
    withThermalInfo: "Now with thermal information, can you identify the correct prediction?",
    thermalInfoTitle: "Thermal Information",
    heatTraces: "Heat traces that reveal the past",
    nowWithThermal: "Now with thermal information",
    canYouIdentify: "Can you identify the correct prediction?",
    correctExcellent: "Correct! Excellent work",
    successfullyReconstructed: "You have successfully reconstructed the past state of the scene",
    correct: "Correct!",
    tryAgain: "Try again",
    areYouSure: "Are you sure about your choice?",
    confirmChoice: "You have selected option {option}. Do you want to confirm your answer or would you prefer to see the thermal information to be completely sure?",
    confirmAnswer: "Confirm answer",
    seeThermalFirst: "See thermal information first",
    selectedOption: "Selected option: {option}",
    conceptualFoundations: "Conceptual Foundations",
    timeReversedIntro: "introduces a fundamentally new class of inverse problems. Instead of recovering hidden variables from the current scene",
    objective: "the objective is to reconstruct a past scene state",
    fromObservations: "for Δt > 0, from observations",
    presentTime: "at present time",
    recentWork: "In recent work,",
    demonstratedViability: "we demonstrated the viability of reconstructing past states from present observations. The framework combines",
    promptEngineering: "prompt engineering",
    visualLanguageModels: "visual language models (VLMs)",
    constrainedDiffusion: "constrained diffusion process",
    recoverConfigurations: "to recover previous configurations from RGB and thermal inputs.",
    thermalResults: "Thermal results encode",
    heatFadingSignals: "heat fading signals",
    temporalCodes: "that preserve temporal codes, while RGB anchors the",
    spatialStructure: "spatial structure and context",
    initialResults: "Initial results in controlled scenarios show plausible reconstructions of the past",
    secondsBefore: "15 seconds before",
    comparedGroundTruth: "compared against ground truth (GT).",
    ablationStudy: "An ablation study shows that incorporating a high-level scene description from a VLM provides a strong semantic prior bias, achieving the best results when combined with RGB and thermal inputs. With",
    rgbAlone: "RGB images alone, it is impossible to recover the person's position 30 seconds before",
    thermalInputs: "In contrast, thermal inputs enable this reconstruction, confirming that residual traces contain sufficient clues for short-term temporal inference.",
    ablationStudyTitle: "Ablation Study",
    comparisonMethods: "Comparison of methods with different input modalities",
    relatedPublications: "Related Publications",
    scientificResearch: "Scientific research supporting this line of investigation",
    paperPresents: "This paper presents a novel approach to time-inverted scene reconstruction from thermal traces using visual language models."
  }
}

export default function TimeReverseImaging() {
    const [gameState, setGameState] = useState<'initial' | 'wrong' | 'thermal' | 'correct' | 'firstCorrect' | 'revealed'>('initial')
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [language, setLanguage] = useState<'es' | 'en'>('es')
  const correctAnswer = 3 // La predicción correcta es la #3
  
  const t = translations[language]

  // Persistir idioma en sessionStorage
  useEffect(() => {
    const savedLanguage = sessionStorage.getItem('timeReverseLanguage') as 'es' | 'en'
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === 'es' ? 'en' : 'es'
    setLanguage(newLanguage)
    sessionStorage.setItem('timeReverseLanguage', newLanguage)
  }

  const handlePredictionSelect = (predictionIndex: number) => {
    setSelectedPrediction(predictionIndex)
    setSelectedOption(predictionIndex)
    
    if (predictionIndex === correctAnswer) {
      setGameState('firstCorrect')
    } else {
      setGameState('wrong')
    }
  }

  const showThermalInfo = () => {
    setGameState('thermal')
    setSelectedPrediction(null)
  }

  const handleThermalPredictionSelect = (predictionIndex: number) => {
    setSelectedPrediction(predictionIndex)
    
    if (predictionIndex === correctAnswer) {
      setGameState('correct')
    } else {
      // Si es incorrecto, mostrar feedback temporal y resetear después
      setTimeout(() => {
        setSelectedPrediction(null)
      }, 1000) // Esperar 1 segundo antes de permitir otro intento
    }
  }

  const resetGame = () => {
    setGameState('initial')
    setSelectedPrediction(null)
    setSelectedOption(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className=" pb-16">


        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-16 pt-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
                {t.title}
              </h1>
              <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                {t.subtitle}
              </p>
              
              {/* Language Toggle - Solo aquí */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {language === 'es' ? '🇺🇸 English' : '🇪🇸 Español'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
                {t.interactiveExperience}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t.interactiveDesc}
              </p>
            </div>

            <div className="max-w-7xl mx-auto">
              {/* Game Logic */}
              {gameState === 'initial' && (
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle>{t.canYouReconstruct}</CardTitle>
                    <CardDescription>
                      {t.basedOnRGB}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Imagen Presente - Lado Izquierdo */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2 mb-2">
                            <Eye className="h-5 w-5" />
                            {t.currentImage}
                          </h3>
                          <p className="text-sm text-muted-foreground">{t.presentScene}</p>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-40">
                            <img 
                              src={getImagePath("/time-reverse-imaging/present-fame.png")} 
                              alt="Imagen presente de la escena" 
                              className="w-full h-auto rounded-lg border shadow-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Predicciones - Lado Derecho */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{t.selectCorrect}</h3>
                          <p className="text-sm text-muted-foreground">{t.whatWasPrevious}</p>
                        </div>
                        <div className="flex justify-center flex-wrap gap-4">
                          {[1, 2, 3].map((index) => (
                            <button
                              key={index}
                              onClick={() => handlePredictionSelect(index)}
                              className="group relative overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card w-40"
                            >
                              <img 
                                src={getImagePath(`/time-reverse-imaging/prediction-${index}.png`)} 
                                alt={`Predicción ${index} del estado pasado`} 
                                className="w-full h-auto rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                <div className="bg-background/90 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="font-semibold text-foreground text-sm">{t.option} {index}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {gameState === 'wrong' && (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                      <XCircle className="h-6 w-6" />
                      {t.incorrectAnswer}
                    </CardTitle>
                    <CardDescription>
                      {t.dontWorryThermal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      onClick={showThermalInfo}
                      variant="destructive"
                    >
                      <Thermometer className="mr-2 h-4 w-4" />
                      {t.seeThermalInfo}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {gameState === 'thermal' && (
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Thermometer className="h-6 w-6" />
                      {t.thermalInfo}
                    </CardTitle>
                    <CardDescription>
                      {t.withThermalInfo}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Imagen Térmica - Lado Izquierdo */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2 mb-2">
                            <Thermometer className="h-5 w-5" />
                            {t.thermalInfoTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground">{t.heatTraces}</p>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-40">
                            <img 
                              src={getImagePath("/time-reverse-imaging/thermal-info.png")} 
                              alt="Información térmica de la escena" 
                              className="w-full h-auto rounded-lg border shadow-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Predicciones con contexto térmico - Lado Derecho */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-foreground mb-2">{t.nowWithThermal}</h3>
                          <p className="text-sm text-muted-foreground">{t.canYouIdentify}</p>
                        </div>
                        <div className="flex justify-center flex-wrap gap-4">
                          {[1, 2, 3].map((index) => (
                            <button
                              key={index}
                              onClick={() => handleThermalPredictionSelect(index)}
                              className={`group relative overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card w-40 ${
                                selectedPrediction === index && index !== correctAnswer ? 'border-red-300 bg-red-50' : ''
                              }`}
                            >
                              <img 
                                src={getImagePath(`/time-reverse-imaging/prediction-${index}.png`)} 
                                alt={`Predicción ${index} del estado pasado`} 
                                className="w-full h-auto rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                <div className="bg-background/90 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="font-semibold text-foreground text-sm">{t.option} {index}</span>
                                </div>
                              </div>
                              {selectedPrediction === index && index !== correctAnswer && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                  ✗
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {gameState === 'firstCorrect' && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-yellow-600">
                      <AlertCircle className="h-6 w-6" />
                      {t.areYouSure}
                    </CardTitle>
                    <CardDescription>
                      {t.confirmChoice.replace('{option}', (selectedOption ?? 1).toString())}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mostrar la opción seleccionada */}
                    <div className="flex justify-center">
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                          {t.selectedOption.replace('{option}', (selectedOption ?? 1).toString())}
                        </p>
                        <div className="flex justify-center">
                          <div className="w-32 relative">
                            <img 
                              src={getImagePath(`/time-reverse-imaging/prediction-${selectedOption}.png`)} 
                              alt={`Predicción ${selectedOption} seleccionada`} 
                              className="w-full h-auto rounded-lg border-2 border-yellow-400"
                            />
                            <div className="absolute top-1 right-1 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              {selectedOption ?? 1}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={() => setGameState('correct')}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {t.confirmAnswer}
                      </Button>
                      <Button
                        onClick={() => setGameState('thermal')}
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Thermometer className="mr-2 h-4 w-4" />
                        {t.seeThermalFirst}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {gameState === 'correct' && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-6 w-6" />
                      {t.correctExcellent}
                    </CardTitle>
                    <CardDescription>
                      {t.successfullyReconstructed}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="w-40 relative">
                        <img 
                          src={getImagePath("/time-reverse-imaging/prediction-3.png")} 
                          alt="Predicción correcta del estado pasado" 
                          className="w-full h-auto rounded-lg border-2 border-green-300"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {t.correct}
                        </div>
                      </div>
                    </div>
                    <Button onClick={resetGame} variant="outline">
                      {t.tryAgain}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Conceptual Context Section - 2 Columns */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-12 text-center">
                {t.conceptualFoundations}
              </h2>
              
              {/* Text in 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-12">
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-foreground">
                    <strong>Time-reversed imaging</strong> {t.timeReversedIntro} <em>x<sub>t</sub></em>, {t.objective} <em>x<sub>t-Δt</sub></em> {t.fromObservations} <em>y<sub>t</sub></em> {t.presentTime} <em>t</em>.
                  </p>
                  
                  <p className="text-lg leading-relaxed text-foreground">
                    {t.recentWork} <strong>
                      <a 
                        href={getPagePath("/publicaciones/1")}
                        className="text-yellow-600 hover:text-yellow-500 transition-colors"
                      >
                        [1]
                      </a>
                    </strong> {t.demonstratedViability} 
                    <strong>{t.promptEngineering}</strong>, <strong>{t.visualLanguageModels}</strong>, {t.constrainedDiffusion} {t.recoverConfigurations}
                  </p>
                </div>

                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-foreground">
                    {t.thermalResults} <em>{t.heatFadingSignals}</em> {t.temporalCodes} <em>{t.spatialStructure}</em>. {t.initialResults} <strong>{t.secondsBefore}</strong>, {t.comparedGroundTruth}
                  </p>
                  
                  <p className="text-lg leading-relaxed text-foreground">
                    {t.ablationStudy} <em>{t.rgbAlone}</em>. {t.thermalInputs}
                  </p>
                </div>
              </div>

              {/* Large image below */}
              <div className="text-center">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-4">{t.ablationStudyTitle}</h3>
                <p className="text-lg text-muted-foreground mb-8">
                  {t.comparisonMethods}
                </p>
                <div className="max-w-xl mx-auto">
                  <img 
                    src={getImagePath("/time-reverse-imaging/Ablation_study.png")} 
                    alt="Estudio de ablación - Time Reverse Imaging" 
                    className="w-full h-auto rounded-lg border shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Publications Section */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                  {t.relatedPublications}
                </h2>
                <p className="text-base text-muted-foreground max-w-xl mx-auto">
                  {t.scientificResearch}
                </p>
              </div>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4 flex-shrink-0">
                      <img 
                        src={getImagePath("/references_scenes.png")} 
                        alt="Time-Reversed Scene Reconstruction" 
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                    <div className="md:w-3/4">
                      <div className="mb-3">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          ArXiv • 2025
                        </span>
                      </div>
                      <a 
                        href={getPagePath("/publicaciones/1")}
                        className="block group"
                      >
                        <h3 className="text-xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                          See the past: Time-Reversed Scene Reconstruction from Thermal Traces Using Visual Language Models
                        </h3>
                      </a>
                      <p className="text-muted-foreground mb-3">
                        Kebin Contreras, Luis Toscano-Palomino, Mauro Dalla, Jorge Bacca
                      </p>
                      <p className="text-foreground leading-relaxed mb-4 text-sm">
                        {t.paperPresents}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">computer vision</span>
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">thermal imaging</span>
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">scene reconstruction</span>
                        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">visual language models</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}