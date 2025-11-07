"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera, Grid } from "@react-three/drei"
import { StairModule } from "@/components/StairModule"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Settings, Ruler, Palette, ShoppingCart, Download, Share2, Info, Wrench, Upload } from "lucide-react"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as THREE from "three"
import { GLTFLoader } from "three-stdlib"
import { getTextures, type TextureSet } from "@/lib/textures"
import { getAllCategories } from "@/lib/categories"
import {
  getAllModels,
  loadModelConfiguration,
  type ModelConfiguration,
  type ComponentArraySettings,
  type StairConfiguration,
  calculatePosition,
  getEffectiveCount,
  createDefaultComponentSettings,
  loadStairConfiguration,
  saveStairConfiguration,
} from "@/lib/models"

export default function Home() {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [modelConfig, setModelConfig] = useState<ModelConfiguration | null>(null)

  const [globalScale, setGlobalScale] = useState(0.01)
  const [globalArrayMultiplier, setGlobalArrayMultiplier] = useState(1.0)
  const [treadScale, setTreadScale] = useState(1.0)
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentArraySettings>>({})
  const [componentTextures, setComponentTextures] = useState<Record<string, string>>({})
  const [availableTextures, setAvailableTextures] = useState<ReturnType<typeof getTextures>>([])  
  const [selectedAngleType, setSelectedAngleType] = useState<string>("middle")
  const [selectedBottomAngle, setSelectedBottomAngle] = useState<"none" | "left" | "right">("none")
  const [selectedTopAngle, setSelectedTopAngle] = useState<"none" | "left" | "right">("none")

  const categories = getAllCategories()
  const allModels = getAllModels()

  useEffect(() => {
    
    const textures = getTextures()
    setAvailableTextures(textures)
  }, [])

  useEffect(() => {
    console.log("🚀 Initializing main page with unified configuration...")

    // Try to load unified configuration
    const savedConfig = loadStairConfiguration()
    if (savedConfig) {
      console.log("📂 Found unified configuration:", savedConfig)

      // Validate that the model exist8.9     const modelExists = allModels.some((m) => m.id === savedConfig.modelId)
      const modelExists = allModels.some((m) => m.id === savedConfig.modelId)
      if (modelExists) {
        setSelectedModelId(savedConfig.modelId)
        setGlobalScale(savedConfig.globalScale)
        setGlobalArrayMultiplier(savedConfig.globalArrayMultiplier)
        setComponentSettings(savedConfig.componentSettings)
        setComponentTextures(savedConfig.componentTextures)
        setSelectedAngleType(savedConfig.selectedAngleType || "middle")
        setSelectedBottomAngle(savedConfig.selectedBottomAngle || "none")
        setSelectedTopAngle(savedConfig.selectedTopAngle || "none")
        console.log("✅ Restored unified configuration")
      } else {
        console.warn(`⚠️ Saved model "${savedConfig.modelId}" not found, redirecting to product selection`)
        router.push("/products")
        return
      }
    } else {
      // No saved config, go to product selection first
      router.push("/products")
      return
    }

    console.log("✅ Main page ready")
    setIsInitialized(true)
  }, [])

  
  useEffect(() => {
    if (!selectedModelId || !isInitialized) return

    console.log(`🔍 Loading model: ${selectedModelId}`)
    const config = loadModelConfiguration(selectedModelId)

    if (config) {
      setModelConfig(config)

      
      if (Object.keys(componentSettings).length === 0) {
        setComponentSettings(createDefaultComponentSettings(config))
        const textures: Record<string, string> = {}
        if (config.componentTextures) {
          Object.entries(config.componentTextures).forEach(([key, value]) => {
            if (value) textures[key] = value
          })
        }
        setComponentTextures(textures)
        setGlobalScale(config.defaultSettings?.globalScale || 0.01)
      }

      console.log(`✅ Loaded model: ${config.name}`)
    } else {
      console.error(`❌ Failed to load model: ${selectedModelId}`)
    }
  }, [selectedModelId, isInitialized])

  useEffect(() => {
    if (!selectedModelId || !isInitialized || Object.keys(componentSettings).length === 0) return

    const configToSave: StairConfiguration = {
      modelId: selectedModelId,
      globalScale,
      globalArrayMultiplier,
      componentSettings,
      componentTextures,
      selectedAngleType,
      selectedBottomAngle,
      selectedTopAngle,
    }

    saveStairConfiguration(configToSave)
  }, [
    selectedModelId,
    globalScale,
    globalArrayMultiplier,
    componentSettings,
    componentTextures,
    selectedAngleType,
    selectedBottomAngle,
    selectedTopAngle,
    isInitialized,
  ])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "stair_unified_configuration") return
      const saved = loadStairConfiguration()
      if (!saved) return
      const modelExists = allModels.some((m) => m.id === saved.modelId)
      if (!modelExists) return

      setSelectedModelId(saved.modelId)
      setGlobalScale(saved.globalScale)
      setGlobalArrayMultiplier(saved.globalArrayMultiplier)
      setComponentSettings(saved.componentSettings)
      setComponentTextures(saved.componentTextures)
      if (saved.selectedAngleType) setSelectedAngleType(saved.selectedAngleType)
      if (typeof saved.selectedBottomAngle !== "undefined") setSelectedBottomAngle(saved.selectedBottomAngle)
      if (typeof saved.selectedTopAngle !== "undefined") setSelectedTopAngle(saved.selectedTopAngle)
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [allModels])

  const vectorsClose = (a: [number, number, number], b: [number, number, number], epsilon = 1e-4) => {
    return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon && Math.abs(a[2] - b[2]) < epsilon
  }

  useEffect(() => {
    if (!modelConfig) return

    const FUDGE = 1.0
    const HORIZONTAL_SHIFT = 0
    const defaultStepSpacing = modelConfig.defaultSettings.stepSpacing
    const defaultStepBase = modelConfig.defaultSettings.positions.step ?? [0, 0, 0]
    const BASE_LOCAL_OFFSET: [number, number, number] = [0, 0, 0]

    setComponentSettings((prev) => {
      const next = { ...prev }
      let changed = false

      
      const spacing: [number, number, number] = [
        defaultStepSpacing[0] * FUDGE,
        defaultStepSpacing[1] * FUDGE,
        defaultStepSpacing[2],
      ]

      
      const effectiveCount = Math.max(1, getEffectiveCount("step", next.step || ({} as any), globalArrayMultiplier))
      const totalSpanX = spacing[0] * (effectiveCount - 1)
      const baseAnchorX = (defaultStepBase[0] + HORIZONTAL_SHIFT) - totalSpanX / 2

      
      if (next.base) {
        const basePosition: [number, number, number] = [
          baseAnchorX,
          0,
          0,
        ]
        if (!vectorsClose(next.base.basePosition, basePosition)) {
          next.base = { ...next.base, basePosition }
          changed = true
        }
      }

      if (next.step) {
        const raiseY = selectedBottomAngle !== "none" ? 20.0 : 0
        const basePosition: [number, number, number] = [0, raiseY, 0]
        if (!vectorsClose(next.step.spacing, spacing) || !vectorsClose(next.step.basePosition, basePosition)) {
          next.step = { ...next.step, spacing, basePosition }
          changed = true
        }
      }

      if (next.step1 && next.step) {
        const spacingStep1: [number, number, number] = [spacing[0], spacing[1], 0]
        const raiseY = selectedBottomAngle !== "none" ? 20.0 : 0
        const basePosition: [number, number, number] = [0, raiseY, 0]
        if (!vectorsClose(next.step1.spacing, spacingStep1) || !vectorsClose(next.step1.basePosition, basePosition)) {
          next.step1 = { ...next.step1, spacing: spacingStep1, basePosition }
          changed = true
        }
      }

      return changed ? next : prev
    })
  }, [modelConfig, globalArrayMultiplier, componentSettings.step?.count, componentSettings.step1?.count, selectedBottomAngle])

  const calculatePrice = () => {
    if (!modelConfig) return 0
    const effectiveStepCount = getEffectiveCount("step", componentSettings, globalArrayMultiplier)
    return modelConfig.pricing.basePrice + modelConfig.pricing.pricePerStep * effectiveStepCount
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Initializing...</p>
      </div>
    )
  }

  if (!modelConfig || Object.keys(componentSettings).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Loading model configuration...</p>
          <p className="text-sm text-gray-400">Model ID: {selectedModelId || "none"}</p>
        </div>
      </div>
    )
  }

  const effectiveStepCount = getEffectiveCount("step", componentSettings, globalArrayMultiplier)
  const ANGLE_Z_OFFSET = 29.1
  const BOTTOM_Y_OFFSET = -21.4
  const BOTTOM_X_OFFSET = 13.0
  const BOTTOM_RIGHT_X_NUDGE = 47.0
  const BOTTOM_RIGHT_Z_NUDGE = -58.1
  const TOP_RIGHT_X_NUDGE = 18.0
  const TOP_RIGHT_Y_NUDGE = -8.0
  const TOP_RIGHT_Z_NUDGE = 18.9
  const TOP_LEFT_X_NUDGE = 18.0
  const TOP_LEFT_Y_NUDGE = -8.0
  const TOP_LEFT_Z_NUDGE = -29.3
  const TREAD_Y_NUDGE = 1.5
  const bottomBase = calculatePosition("step", -1, componentSettings, globalArrayMultiplier)
  const bottomAnglePosition: [number, number, number] = [
    bottomBase[0] + (selectedBottomAngle === "left" ? BOTTOM_X_OFFSET : 0) + (selectedBottomAngle === "right" ? BOTTOM_X_OFFSET + BOTTOM_RIGHT_X_NUDGE : 0),
    bottomBase[1] + BOTTOM_Y_OFFSET,
    bottomBase[2] + ANGLE_Z_OFFSET + (selectedBottomAngle === "right" ? BOTTOM_RIGHT_Z_NUDGE : 0),
  ]
  const topBase = calculatePosition("step", effectiveStepCount, componentSettings, globalArrayMultiplier)
  const topAnglePosition: [number, number, number] = [
    topBase[0] + (selectedTopAngle === "right" ? TOP_RIGHT_X_NUDGE : 0) + (selectedTopAngle === "left" ? TOP_LEFT_X_NUDGE : 0),
    topBase[1] + (selectedTopAngle === "right" ? TOP_RIGHT_Y_NUDGE : 0) + (selectedTopAngle === "left" ? TOP_LEFT_Y_NUDGE : 0),
    topBase[2] + ANGLE_Z_OFFSET + (selectedTopAngle === "right" ? TOP_RIGHT_Z_NUDGE : 0) + (selectedTopAngle === "left" ? TOP_LEFT_Z_NUDGE : 0),
  ]

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Ruler className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Scandinavian Stair Builder</h1>
              <p className="text-sm text-slate-600">Professional staircase configurator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/model-manager">
                <Upload className="w-4 h-4 mr-2" />
                Model Manager
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/texture-manager">
                <Palette className="w-4 h-4 mr-2" />
                Texture Manager
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/gltf-test">
                <Wrench className="w-4 h-4 mr-2" />
                GLTF Test
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 p-6">
          <div className="h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-xl overflow-hidden border border-slate-300">
            <Canvas shadows dpr={[1, 2]}>
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[50, 30, 50]} fov={50} />
                <OrbitControls enableDamping dampingFactor={0.05} minDistance={0.001} maxDistance={10000} />

                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
                <hemisphereLight intensity={0.4} groundColor="#b1b1b1" />

                <group scale={globalScale}>
                  {selectedBottomAngle !== "none" && (
                    <StairModule
                      key="angle-bottom"
                      url={
                        selectedBottomAngle === "left"
                          ? "/models/limon_central/angle_left_bottom_side.glb"
                          : "/models/limon_central/angle_right_bottom_side.glb"
                      }
                      textureId={componentTextures.step || modelConfig.components.step?.defaultTexture || "painted-metal"}
                      position={bottomAnglePosition}
                      rotation={[0, selectedBottomAngle === "left" ? Math.PI / 2 + Math.PI : Math.PI / 2, 0]}
                    />
                  )}
                  {selectedBottomAngle === "none" && modelConfig.components.base && componentSettings.base.enabled && (
                    <>
                      {Array.from(
                        { length: getEffectiveCount("base", componentSettings, globalArrayMultiplier) },
                        (_, i) => (
                          <StairModule
                            key={`base-${i}`}
                            url={modelConfig.components.base!.url}
                            textureId={
                              componentTextures.base || modelConfig.components.base!.defaultTexture || "painted-metal"
                            }
                            position={calculatePosition("base", i, componentSettings, globalArrayMultiplier)}
                          />
                        ),
                      )}
                    </>
                  )}
                  {selectedBottomAngle === "none" && modelConfig.components.base && !componentSettings.base.enabled && (
                    <StairModule
                      url={modelConfig.components.base!.url}
                      textureId={
                        componentTextures.base || modelConfig.components.base!.defaultTexture || "painted-metal"
                      }
                      position={calculatePosition("base", 0, componentSettings, globalArrayMultiplier)}
                    />
                  )}

                  {modelConfig.components.step && (
                    <>
                      {Array.from({ length: effectiveStepCount }, (_, i) => (
                        <StairModule
                          key={`step-${i}`}
                          url={modelConfig.components.step!.url}
                          textureId={
                            componentTextures.step || modelConfig.components.step!.defaultTexture || "painted-metal"
                          }
                          position={calculatePosition("step", i, componentSettings, globalArrayMultiplier)}
                        />
                      ))}
                    </>
                  )}

                  {modelConfig.components.step1 && (
                    <>
                      {Array.from(
                        { length: getEffectiveCount("step1", componentSettings, globalArrayMultiplier) },
                        (_, i) => (
                          <StairModule
                            key={`step1-${i}`}
                            url={modelConfig.components.step1!.url}
                            textureId={
                              componentTextures.step1 ||
                              modelConfig.components.step1!.defaultTexture ||
                              "dark-cherry-wood"
                            }
                            position={(
                              (p => [p[0], p[1] + TREAD_Y_NUDGE, p[2]] as [number, number, number])
                              (calculatePosition("step1", i, componentSettings, globalArrayMultiplier))
                            )}
                            scale={[treadScale, treadScale, treadScale]}
                          />
                        ),
                      )}
                    </>
                  )}

                  {modelConfig.components.top && componentSettings.top.enabled && (
                    <>
                      {Array.from(
                        { length: getEffectiveCount("top", componentSettings, globalArrayMultiplier) },
                        (_, i) => (
                          <StairModule
                            key={`top-${i}`}
                            url={modelConfig.components.top!.url}
                            textureId={
                              componentTextures.top || modelConfig.components.top!.defaultTexture || "painted-metal"
                            }
                            position={calculatePosition("top", i, componentSettings, globalArrayMultiplier)}
                          />
                        ),
                      )}
                    </>
                  )}
                  {selectedTopAngle === "none" && modelConfig.components.top && !componentSettings.top.enabled && (
                    <StairModule
                      url={modelConfig.components.top!.url}
                      textureId={componentTextures.top || modelConfig.components.top!.defaultTexture || "painted-metal"}
                      position={calculatePosition("top", 0, componentSettings, globalArrayMultiplier)}
                    />
                  )}

                  {selectedTopAngle !== "none" && (
                    <StairModule
                      key="angle-top"
                      url={
                        selectedTopAngle === "left"
                          ? "/models/limon_central/angle_left_top_side.glb"
                          : "/models/limon_central/angle_right_top_side.glb"
                      }
                      textureId={componentTextures.step || modelConfig.components.step?.defaultTexture || "painted-metal"}
                      position={topAnglePosition}
                      rotation={[0, selectedTopAngle === "left" ? Math.PI * 2 : 0, 0]}
                    />
                  )}
                </group>

                <Grid args={[100, 100]} cellSize={1} cellThickness={0.5} fadeDistance={100} />
                <Environment preset="apartment" />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto">
          <Tabs defaultValue="model" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-white z-10 border-b">
              <TabsTrigger value="model">
                <Settings className="w-4 h-4 mr-2" />
                Model
              </TabsTrigger>
              <TabsTrigger value="dimensions">
                <Ruler className="w-4 h-4 mr-2" />
                Size
              </TabsTrigger>
              <TabsTrigger value="materials">
                <Palette className="w-4 h-4 mr-2" />
                Materials
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="model" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Stair Model</CardTitle>
                    <CardDescription>Choose your staircase configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={modelConfig.category}
                        onValueChange={(categoryId) => {
                          const modelsInCategory = allModels.filter((m) => m.category === categoryId)
                          if (modelsInCategory.length > 0) {
                            setSelectedModelId(modelsInCategory[0].id)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select value={selectedModelId || ""} onValueChange={setSelectedModelId}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allModels
                            .filter((m) => m.category === modelConfig.category)
                            .map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex items-center gap-2">
                                  <span>{model.name}</span>
                                  {model.metadata.isCustom && (
                                    <Badge variant="secondary" className="text-xs">
                                      Custom
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-slate-600 mt-0.5" />
                        <p className="text-sm text-slate-600">{modelConfig.description}</p>
                      </div>
                    </div>

                    {componentSettings.angle && (
                      <div className="space-y-4 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="angle-toggle" className="font-medium">Enable Angle</Label>
                          <input
                            id="angle-toggle"
                            type="checkbox"
                            checked={componentSettings.angle?.enabled ?? false}
                            onChange={(e) => {
                              setComponentSettings(prev => ({
                                ...prev,
                                angle: {
                                  ...(prev.angle || { basePosition: [0, 0, 0], count: 1, spacing: [0, 0, 0], followSteps: false, positionAtEnd: false }),
                                  enabled: e.target.checked
                                }
                              }))
                            }}
                            className="w-4 h-4"
                          />
                        </div>
                        
                        {componentSettings.angle?.enabled && (
                          <>
                            <div className="space-y-2">
                              <Label>Angle Type</Label>
                              <Select value={selectedAngleType} onValueChange={setSelectedAngleType}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="middle">
                                    Angle in the Middle
                                  </SelectItem>
                                  <SelectItem value="leftBottom">
                                    Angle Left Bottom
                                  </SelectItem>
                                  <SelectItem value="leftTop">
                                    Angle Left Top
                                  </SelectItem>
                                  <SelectItem value="rightBottom">
                                    Angle Right Bottom
                                  </SelectItem>
                                  <SelectItem value="rightTop">
                                    Angle Right Top
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm">Position</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {["X", "Y", "Z"].map((axis, idx) => (
                                  <div key={axis}>
                                    <Label className="text-xs text-slate-600">{axis}</Label>
                                    <input
                                      type="number"
                                      value={componentSettings.angle?.basePosition?.[idx] ?? 0}
                                      onChange={(e) => {
                                        const newValue = parseFloat(e.target.value) || 0
                                        setComponentSettings(prev => {
                                          const currentPos = prev.angle?.basePosition || [0, 0, 0]
                                          const newPos = [...currentPos] as [number, number, number]
                                          newPos[idx] = newValue
                                          return {
                                            ...prev,
                                            angle: {
                                              ...(prev.angle || { enabled: true, count: 1, spacing: [0, 0, 0], followSteps: false, positionAtEnd: false }),
                                              basePosition: newPos
                                            }
                                          }
                                        })
                                      }}
                                      step={0.1}
                                      className="w-full px-2 py-1 text-xs border rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Model Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Components:</span>
                      <span className="font-medium">{Object.keys(modelConfig.components).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Version:</span>
                      <span className="font-medium">{modelConfig.metadata.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Type:</span>
                      <Badge variant={modelConfig.metadata.isCustom ? "secondary" : "default"}>
                        {modelConfig.metadata.isCustom ? "Custom" : "Built-in"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="model" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Angles</CardTitle>
                    <CardDescription>Select optional angles at bottom and top</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bottom Angle</Label>
                      <Select value={selectedBottomAngle} onValueChange={(v) => setSelectedBottomAngle(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Top Angle</Label>
                      <Select value={selectedTopAngle} onValueChange={(v) => setSelectedTopAngle(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dimensions" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Dimensions</CardTitle>
                    <CardDescription>Adjust staircase size and scale</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Number of Steps</Label>
                        <span className="text-sm font-medium text-slate-700">{effectiveStepCount}</span>
                      </div>
                      <Slider
                        value={[globalArrayMultiplier * 100]}
                        onValueChange={(v) => setGlobalArrayMultiplier(v[0] / 100)}
                        min={10}
                        max={300}
                        step={5}
                      />
                      <p className="text-xs text-slate-500">
                        Base count: {componentSettings.step?.count || 8} × {globalArrayMultiplier.toFixed(2)} ={" "}
                        {effectiveStepCount} steps
                      </p>
                      <p className="text-xs text-slate-500">
                        Total height: {(effectiveStepCount * 6.941 * globalScale * 100).toFixed(1)} cm
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Scale</Label>
                        <span className="text-sm font-medium text-slate-700">{(globalScale * 100).toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[globalScale * 1000]}
                        onValueChange={(v) => setGlobalScale(v[0] / 1000)}
                        min={5}
                        max={20}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Tread Scale</Label>
                        <span className="text-sm font-medium text-slate-700">{(treadScale * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[treadScale * 100]}
                        onValueChange={(v) => setTreadScale(v[0] / 100)}
                        min={50}
                        max={200}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Components</CardTitle>
                    <CardDescription>Toggle staircase components</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {componentSettings.angle && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="angle-toggle">Angle Component</Label>
                        <input
                          id="angle-toggle"
                          type="checkbox"
                          checked={componentSettings.angle?.enabled ?? false}
                          onChange={(e) => {
                            setComponentSettings(prev => ({
                              ...prev,
                              angle: {
                                ...prev.angle,
                                enabled: e.target.checked
                              }
                            }))
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                    {componentSettings.base && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="base-toggle">Base Component</Label>
                        <input
                          id="base-toggle"
                          type="checkbox"
                          checked={componentSettings.base?.enabled ?? false}
                          onChange={(e) => {
                            setComponentSettings(prev => ({
                              ...prev,
                              base: {
                                ...prev.base,
                                enabled: e.target.checked
                              }
                            }))
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                    {componentSettings.top && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="top-toggle">Top Component</Label>
                        <input
                          id="top-toggle"
                          type="checkbox"
                          checked={componentSettings.top?.enabled ?? false}
                          onChange={(e) => {
                            setComponentSettings(prev => ({
                              ...prev,
                              top: {
                                ...prev.top,
                                enabled: e.target.checked
                              }
                            }))
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Measurements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Step width:</span>
                      <span className="font-medium">{(10.133 * globalScale * 100).toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Step height:</span>
                      <span className="font-medium">{(6.941 * globalScale * 100).toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total length:</span>
                      <span className="font-medium">
                        {(effectiveStepCount * 10.133 * globalScale * 100).toFixed(1)} cm
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Materials & Finishes</CardTitle>
                    <CardDescription>Customize component textures</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(modelConfig.components).map(([componentId, component]) => {
                      if (!component) return null
                      return (
                        <div key={componentId} className="space-y-2">
                          <Label className="capitalize">{component.name}</Label>
                          <Select
                            value={componentTextures[componentId] || component.defaultTexture}
                            onValueChange={(value) =>
                              setComponentTextures((prev) => ({
                                ...prev,
                                [componentId]: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTextures.map((texture) => (
                                <SelectItem key={texture.id} value={texture.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{
                                        background: texture.category === "wood" ? "#8B4513" : "#708090",
                                      }}
                                    />
                                    <span>{texture.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Price Summary */}
            <div className="border-t bg-slate-50 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Base price:</span>
                  <span className="text-sm">
                    {modelConfig.pricing.basePrice} {modelConfig.pricing.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Steps ({effectiveStepCount}):</span>
                  <span className="text-sm">
                    {modelConfig.pricing.pricePerStep * effectiveStepCount} {modelConfig.pricing.currency}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {calculatePrice()} {modelConfig.pricing.currency}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <Button className="w-full mt-2" size="lg">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Request Quote
                  </Button>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
