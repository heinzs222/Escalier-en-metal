"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera, Grid } from "@react-three/drei"
import { StairModule } from "@/components/StairModule"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useEffect, useState, Suspense } from "react"
import { getTextures } from "@/lib/textures"
import {
  getModels,
  type ModelConfiguration,
  type ComponentArraySettings,
  type StairConfiguration,
  loadModelConfiguration,
  calculatePosition,
  calculateAutoPosition,
  getEffectiveCount,
  createDefaultComponentSettings,
  saveStairConfiguration,
  loadStairConfiguration,
  clearStairConfiguration,
} from "@/lib/models"
import { Save, RotateCcw, Home, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const DEFAULT_GLOBAL_SCALE = 0.01

const vectorsClose = (a: [number, number, number], b: [number, number, number], epsilon = 1e-4) => {
  return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon && Math.abs(a[2] - b[2]) < epsilon
}

export default function GLTFTestPage() {
  const [models, setModels] = useState<ModelConfiguration[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>("")
  const [modelConfig, setModelConfig] = useState<ModelConfiguration | null>(null)
  const [globalScale, setGlobalScale] = useState(DEFAULT_GLOBAL_SCALE)
  const [globalArrayMultiplier, setGlobalArrayMultiplier] = useState(1.0)

  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentArraySettings>>({})

  const [componentTextures, setComponentTextures] = useState<Record<string, string>>({
    base: "painted-metal",
    step: "painted-metal",
    step1: "dark-cherry-wood",
    top: "painted-metal",
  })

  const availableTextures = getTextures()

  useEffect(() => {
    console.log("🔧 Initializing GLTF test page...")
    const loadedModels = getModels()
    setModels(loadedModels)

    const savedConfig = loadStairConfiguration()
    if (savedConfig) {
      console.log("📂 Loaded saved unified configuration")
      setSelectedModelId(savedConfig.modelId)
      setGlobalScale(savedConfig.globalScale)
      setGlobalArrayMultiplier(savedConfig.globalArrayMultiplier)
      const norm = { ...savedConfig.componentSettings }
      setComponentSettings(norm)
      setComponentTextures(savedConfig.componentTextures)
    } else if (loadedModels.length > 0 && !selectedModelId) {
      const defaultModelId = "limon-central-droit-droit"
      console.log(`📦 Setting default model: ${defaultModelId}`)
      setSelectedModelId(defaultModelId)
    }
  }, [])

  useEffect(() => {
    if (selectedModelId) {
      console.log(`🔍 Loading model configuration: ${selectedModelId}`)
      const loaded = loadModelConfiguration(selectedModelId)
      if (loaded) {
        console.log("✅ Model loaded successfully:", loaded.name)
        setModelConfig(loaded)

        // Only set defaults if we don't have saved settings
        if (Object.keys(componentSettings).length === 0) {
          setGlobalScale(loaded.defaultSettings?.globalScale || DEFAULT_GLOBAL_SCALE)
          setComponentSettings(createDefaultComponentSettings(loaded))
          const textures: Record<string, string> = {}
          if (loaded.componentTextures) {
            Object.entries(loaded.componentTextures).forEach(([key, value]) => {
              if (value) textures[key] = value
            })
          }
          setComponentTextures(Object.keys(textures).length ? textures : componentTextures)
        }

        console.log("🎨 Applied configuration from GLTF test")
      } else {
        console.error("❌ Failed to load model")
      }
    }
  }, [selectedModelId])

  // Center arrays while keeping base at world origin (mirror main view)
  useEffect(() => {
    if (!modelConfig) return

    setComponentSettings((prev) => {
      const next = { ...prev }
      let changed = false

      const spacing: [number, number, number] = next.step?.spacing || modelConfig.defaultSettings.stepSpacing
      const effectiveCount = Math.max(1, getEffectiveCount("step", next.step || ({} as any), globalArrayMultiplier))
      const defaultStepBase = modelConfig.defaultSettings.positions.step ?? [0, 0, 0]
      const centeredX = defaultStepBase[0] - spacing[0] * ((effectiveCount - 1) / 2)
      const centeredBasePos: [number, number, number] = [centeredX, defaultStepBase[1] || 0, defaultStepBase[2] || 0]

      
      if (next.base && !vectorsClose(next.base.basePosition, [centeredX, 0, 0])) {
        next.base = { ...next.base, basePosition: [centeredX, 0, 0] }
        changed = true
      }
      if (next.step && !vectorsClose(next.step.basePosition, [0, 0, 0])) {
        next.step = { ...next.step, basePosition: [0, 0, 0] }
        changed = true
      }
      if (next.step1 && !vectorsClose(next.step1.basePosition, [0, 0, 0])) {
        next.step1 = { ...next.step1, basePosition: [0, 0, 0] }
        changed = true
      }

      return changed ? next : prev
    })
  }, [modelConfig, globalArrayMultiplier, componentSettings.step?.count, componentSettings.step?.spacing])

  const updateComponentSetting = (componentId: string, field: keyof ComponentArraySettings, value: any) => {
    setComponentSettings((prev) => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        [field]: value,
      },
    }))
  }

  const updateComponentPosition = (componentId: string, axis: number, value: number) => {
    setComponentSettings((prev) => {
      const newPosition: [number, number, number] = [...prev[componentId].basePosition]
      newPosition[axis] = value
      return {
        ...prev,
        [componentId]: {
          ...prev[componentId],
          basePosition: newPosition,
        },
      }
    })
  }

  const updateComponentSpacing = (componentId: string, axis: number, value: number) => {
    setComponentSettings((prev) => {
      const newSpacing: [number, number, number] = [...prev[componentId].spacing]
      newSpacing[axis] = value
      return {
        ...prev,
        [componentId]: {
          ...prev[componentId],
          spacing: newSpacing,
        },
      }
    })
  }

  const handleSaveConfiguration = () => {
    if (!modelConfig) return

    const config: StairConfiguration = {
      modelId: selectedModelId,
      globalScale,
      globalArrayMultiplier,
      componentSettings,
      componentTextures,
    }

    const success = saveStairConfiguration(config)

    if (success) {
      toast.success("Configuration saved successfully!")
    } else {
      toast.error("Failed to save configuration")
    }
  }

  const handleClearConfiguration = () => {
    if (!selectedModelId) return

    const success = clearStairConfiguration()
    if (success) {
      toast.success("Configuration cleared!")
      handleResetToDefaults()
    } else {
      toast.error("Failed to clear configuration")
    }
  }

  const handleResetToDefaults = () => {
    if (!modelConfig) return

    setGlobalScale(modelConfig.defaultSettings?.globalScale || DEFAULT_GLOBAL_SCALE)
    setGlobalArrayMultiplier(1.0)
    setComponentSettings(createDefaultComponentSettings(modelConfig))
    const textures: Record<string, string> = {}
    if (modelConfig.componentTextures) {
      Object.entries(modelConfig.componentTextures).forEach(([key, value]) => {
        if (value) textures[key] = value
      })
    }
    setComponentTextures(Object.keys(textures).length ? textures : componentTextures)

    toast.info("Reset to default values")
  }

  if (!modelConfig?.components?.step) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Loading GLTF test page...</p>
          <p className="text-sm text-gray-400">Model ID: {selectedModelId || "none"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex gap-6 p-6">
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <Canvas shadows>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[50, 30, 50]} fov={50} />
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={0.001}
              maxDistance={10000}
              maxPolarAngle={Math.PI / 2}
            />

            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
            <hemisphereLight intensity={0.4} groundColor="#b1b1b1" />

            <group scale={globalScale}>
              {modelConfig.components.base && componentSettings.base.enabled && (
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
              {modelConfig.components.base && !componentSettings.base.enabled && (
                <StairModule
                  url={modelConfig.components.base!.url}
                  textureId={componentTextures.base || modelConfig.components.base!.defaultTexture || "painted-metal"}
                  position={calculatePosition("base", 0, componentSettings, globalArrayMultiplier)}
                />
              )}

              {modelConfig.components.step && (
                <>
                  {Array.from(
                    { length: getEffectiveCount("step", componentSettings, globalArrayMultiplier) },
                    (_, i) => (
                      <StairModule
                        key={`step-${i}`}
                        url={modelConfig.components.step!.url}
                        textureId={
                          componentTextures.step || modelConfig.components.step!.defaultTexture || "painted-metal"
                        }
                        position={calculatePosition("step", i, componentSettings, globalArrayMultiplier)}
                      />
                    ),
                  )}
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
                          componentTextures.step1 || modelConfig.components.step1!.defaultTexture || "dark-cherry-wood"
                        }
                        position={calculatePosition("step1", i, componentSettings, globalArrayMultiplier)}
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
              {modelConfig.components.top && !componentSettings.top.enabled && (
                <StairModule
                  url={modelConfig.components.top!.url}
                  textureId={componentTextures.top || modelConfig.components.top!.defaultTexture || "painted-metal"}
                  position={calculatePosition("top", 0, componentSettings, globalArrayMultiplier)}
                />
              )}
            </group>

            <Grid args={[100, 100]} cellSize={1} cellThickness={0.5} fadeDistance={100} />
            <Environment preset="apartment" />
          </Suspense>
        </Canvas>
      </div>

      <div className="w-96 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Model Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Global Scale</Label>
                <span className="text-sm font-medium">{globalScale.toFixed(4)}</span>
              </div>
              <Slider
                value={[globalScale * 10000]}
                onValueChange={(v) => setGlobalScale(v[0] / 10000)}
                min={1}
                max={1000}
                step={1}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0001</span>
                <span>0.1000</span>
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Manual Scale Input</Label>
              <Input
                type="number"
                value={globalScale}
                onChange={(e) => setGlobalScale(Number.parseFloat(e.target.value) || 0.01)}
                step={0.001}
                min={0.0001}
                max={1}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label>Global Array Multiplier</Label>
                <span className="text-sm font-medium">{globalArrayMultiplier.toFixed(2)}x</span>
              </div>
              <Slider
                value={[globalArrayMultiplier * 100]}
                onValueChange={(v) => setGlobalArrayMultiplier(v[0] / 100)}
                min={10}
                max={300}
                step={5}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1x</span>
                <span>3.0x</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Affects all array components (steps, treads). Current step count:{" "}
                {getEffectiveCount("step", componentSettings, globalArrayMultiplier)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Component Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="step" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="base">Base</TabsTrigger>
                <TabsTrigger value="step">Step</TabsTrigger>
                <TabsTrigger value="step1">Tread</TabsTrigger>
                <TabsTrigger value="top">Top</TabsTrigger>
              </TabsList>

              {Object.entries(modelConfig.components).map(([componentId, component]) => {
                if (!component) return null
                const settings = componentSettings[componentId]
                const autoPosition = calculateAutoPosition(componentId, componentSettings)
                const displayPosition = settings.followSteps && !settings.enabled ? autoPosition : settings.basePosition
                const effectiveCount = getEffectiveCount(componentId, componentSettings, globalArrayMultiplier)

                return (
                  <TabsContent key={componentId} value={componentId} className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">{component.name}</Label>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Array</Label>
                          <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => updateComponentSetting(componentId, "enabled", e.target.checked)}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>

                      {!settings.enabled && (componentId === "step1" || componentId === "top") && (
                        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Follow Step Array</Label>
                            <input
                              type="checkbox"
                              checked={settings.followSteps}
                              onChange={(e) => updateComponentSetting(componentId, "followSteps", e.target.checked)}
                              className="w-4 h-4"
                            />
                          </div>
                          {settings.followSteps && (
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Position at End (+1)</Label>
                              <input
                                type="checkbox"
                                checked={settings.positionAtEnd}
                                onChange={(e) => updateComponentSetting(componentId, "positionAtEnd", e.target.checked)}
                                className="w-4 h-4"
                              />
                            </div>
                          )}
                          {settings.followSteps && (
                            <p className="text-xs text-blue-600">
                              {settings.positionAtEnd
                                ? `Position: Step count (${effectiveCount})`
                                : `Position: Last step (${effectiveCount - 1})`}
                            </p>
                          )}
                        </div>
                      )}

                      {settings.enabled && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Base Array Count</Label>
                            <span className="text-sm font-medium">{settings.count}</span>
                          </div>
                          <Slider
                            value={[settings.count]}
                            onValueChange={(v) => updateComponentSetting(componentId, "count", v[0])}
                            min={1}
                            max={50}
                            step={1}
                          />
                          {(componentId === "step" || componentId === "step1") && (
                            <p className="text-xs text-gray-600 mt-1">
                              Effective count with multiplier: {effectiveCount}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>
                          {settings.followSteps && !settings.enabled ? "Position (Auto-calculated)" : "Base Position"}
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {["X", "Y", "Z"].map((axis, idx) => (
                            <div key={axis}>
                              <Label className="text-xs">{axis}</Label>
                              <Input
                                type="number"
                                value={displayPosition[idx].toFixed(3)}
                                onChange={(e) =>
                                  updateComponentPosition(componentId, idx, Number.parseFloat(e.target.value) || 0)
                                }
                                step={0.1}
                                className="text-xs"
                                disabled={settings.followSteps && !settings.enabled}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {settings.enabled && (
                        <div className="space-y-2">
                          <Label>Array Spacing</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {["X", "Y", "Z"].map((axis, idx) => (
                              <div key={axis}>
                                <Label className="text-xs">{axis}</Label>
                                <Input
                                  type="number"
                                  value={settings.spacing[idx].toFixed(3)}
                                  onChange={(e) =>
                                    updateComponentSpacing(componentId, idx, Number.parseFloat(e.target.value) || 0)
                                  }
                                  step={0.1}
                                  className="text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm mb-1 block">Texture</Label>
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
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleSaveConfiguration} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Test Config
          </Button>
          <Button onClick={handleResetToDefaults} variant="outline" className="flex-1 bg-transparent">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <Button
          onClick={handleClearConfiguration}
          variant="outline"
          className="w-full bg-transparent text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Saved Config
        </Button>

        <Button asChild variant="outline" className="w-full bg-transparent">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Main View
          </Link>
        </Button>
      </div>
    </div>
  )
}
