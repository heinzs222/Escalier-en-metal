export interface ComponentConfig {
  id: string
  name: string
  url: string
  defaultTexture?: string
  position?: [number, number, number]
}

export interface ComponentPositionParams {
  index: number
  arraySize: number
  stepSpacing: [number, number, number]
  step1Spacing: [number, number, number]
  globalScale: number
  basePosition: [number, number, number]
}

export type PositionFunction = (params: ComponentPositionParams) => [number, number, number]

export interface ModelConfiguration {
  id: string
  name: string
  description: string
  category: string
  components: {
    base?: ComponentConfig
    step?: ComponentConfig
    step1?: ComponentConfig
    top?: ComponentConfig
    [key: string]: ComponentConfig | undefined
  }
  componentTextures: {
    base?: string
    step?: string
    step1?: string
    top?: string
    [key: string]: string | undefined
  }
  positioningLogic: {
    base?: PositionFunction
    step?: PositionFunction
    step1?: PositionFunction
    top?: PositionFunction
    [key: string]: PositionFunction | undefined
  }
  defaultSettings: {
    arraySize: number
    scale: [number, number, number]
    globalScale: number
    positions: {
      base: [number, number, number]
      step: [number, number, number]
      step1: [number, number, number]
      top: [number, number, number]
    }
    stepSpacing: [number, number, number]
    step1Spacing: [number, number, number]
  }
  pricing: {
    basePrice: number
    pricePerStep: number
    currency: string
  }
  metadata: {
    version: string
    author: string
    dateCreated: string
    isCustom: boolean
    createdAt: Date
    updatedAt: Date
  }
}

// Default positioning functions
const defaultBasePosition: PositionFunction = ({ basePosition }) => basePosition

const defaultStepPosition: PositionFunction = ({ index, stepSpacing, basePosition }) => {
  return [
    basePosition[0] + stepSpacing[0] * index,
    basePosition[1] + stepSpacing[1] * index,
    basePosition[2] + stepSpacing[2] * index,
  ]
}

const defaultStep1Position: PositionFunction = ({ index, step1Spacing, basePosition }) => {
  return [
    basePosition[0] + step1Spacing[0] * index,
    basePosition[1] + step1Spacing[1] * index,
    basePosition[2] + step1Spacing[2] * index,
  ]
}

const defaultTopPosition: PositionFunction = ({ arraySize, stepSpacing, basePosition }) => {
  return [
    basePosition[0] + stepSpacing[0] * arraySize,
    basePosition[1] + stepSpacing[1] * arraySize,
    basePosition[2] + stepSpacing[2] * arraySize,
  ]
}

const BUILT_IN_MODELS: ModelConfiguration[] = [
  {
    id: "limon-central-droit-droit",
    name: "Limon Central Droit/Droit",
    description: "Central stringer staircase with straight/straight configuration",
    category: "central-stringer",
    components: {
      base: {
        id: "base",
        name: "Base",
        url: "/models/limon_central/limon_central_droit_droit_base.glb",
        defaultTexture: "painted-metal",
        position: [0, 0, 0],
      },
      step: {
        id: "step",
        name: "Support Step",
        url: "/models/limon_central/limon_central_droit_droit_step.glb",
        defaultTexture: "painted-metal",
        position: [0, 0, 0],
      },
      step1: {
        id: "step1",
        name: "Tread",
        url: "/models/limon_central/limon_central_droit_droit_step1.glb",
        defaultTexture: "dark-cherry-wood",
        position: [0, 0, 0],
      },
      top: {
        id: "top",
        name: "Top",
        url: "/models/limon_central/limon_central_droit_droit_top.glb",
        defaultTexture: "painted-metal",
        position: [0, 0, 0],
      },
    },
    componentTextures: {
      base: "painted-metal",
      step: "painted-metal",
      step1: "dark-cherry-wood",
      top: "painted-metal",
    },
    positioningLogic: {
      base: defaultBasePosition,
      step: defaultStepPosition,
      step1: defaultStep1Position,
      top: defaultTopPosition,
    },
    defaultSettings: {
      arraySize: 8,
      scale: [0.01, 0.01, 0.01],
      globalScale: 0.01,
      positions: {
        base: [0, 0, 0],
        step: [0, 0, 0],
        step1: [0, 0, 0],
        top: [0, 0, 0],
      },
      stepSpacing: [-10.133, 6.941, 0.0],
      step1Spacing: [-10.133, 6.941, 0.3],
    },
    pricing: {
      basePrice: 2500,
      pricePerStep: 150,
      currency: "EUR",
    },
    metadata: {
      version: "1.0.0",
      author: "System",
      dateCreated: new Date().toISOString(),
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
]

const STORAGE_KEY = "custom_models"
const TEST_CONFIG_KEY = "test_configurations"
const CONFIG_STORAGE_KEY = "stair_unified_configuration"

function serializeModel(model: ModelConfiguration): any {
  return {
    ...model,
    positioningLogic: Object.entries(model.positioningLogic).reduce(
      (acc, [key, func]) => {
        if (func) {
          acc[key] = func.toString()
        }
        return acc
      },
      {} as Record<string, string>,
    ),
  }
}

function deserializeModel(stored: any): ModelConfiguration {
  const positioningLogic: Record<string, PositionFunction> = {}

  if (stored.positioningLogic) {
    Object.entries(stored.positioningLogic).forEach(([key, funcString]) => {
      if (typeof funcString === "string") {
        try {
          positioningLogic[key] = eval(`(${funcString})`) as PositionFunction
        } catch (error) {
          console.error(`Failed to deserialize positioning function for ${key}:`, error)
          if (key === "base") positioningLogic[key] = defaultBasePosition
          else if (key === "step") positioningLogic[key] = defaultStepPosition
          else if (key === "step1") positioningLogic[key] = defaultStep1Position
          else if (key === "top") positioningLogic[key] = defaultTopPosition
        }
      }
    })
  }

  return {
    ...stored,
    positioningLogic,
    metadata: {
      ...stored.metadata,
      createdAt: new Date(stored.metadata.createdAt),
      updatedAt: new Date(stored.metadata.updatedAt),
    },
  }
}

function getCustomModels(): ModelConfiguration[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const models = JSON.parse(stored)
    return Array.isArray(models) ? models.map(deserializeModel) : []
  } catch (error) {
    console.error("Failed to load custom models:", error)
    return []
  }
}

function saveCustomModels(models: ModelConfiguration[]): void {
  if (typeof window === "undefined") return

  try {
    const serialized = models.map(serializeModel)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
  } catch (error) {
    console.error("Failed to save custom models:", error)
  }
}

// Test configuration functions
export function saveTestConfiguration(
  modelId: string,
  config: Partial<Pick<ModelConfiguration, "defaultSettings" | "componentTextures">>,
): boolean {
  if (typeof window === "undefined") return false

  try {
    const stored = localStorage.getItem(TEST_CONFIG_KEY)
    const configs = stored ? JSON.parse(stored) : {}

    configs[modelId] = {
      ...config,
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(TEST_CONFIG_KEY, JSON.stringify(configs))
    console.log(`✅ Saved test configuration for ${modelId}`)
    return true
  } catch (error) {
    console.error("Failed to save test configuration:", error)
    return false
  }
}

export function loadTestConfiguration(
  modelId: string,
): Partial<Pick<ModelConfiguration, "defaultSettings" | "componentTextures">> | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(TEST_CONFIG_KEY)
    if (!stored) return null

    const configs = JSON.parse(stored)
    return configs[modelId] || null
  } catch (error) {
    console.error("Failed to load test configuration:", error)
    return null
  }
}

export function clearTestConfiguration(modelId: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const stored = localStorage.getItem(TEST_CONFIG_KEY)
    if (!stored) return true

    const configs = JSON.parse(stored)
    delete configs[modelId]

    localStorage.setItem(TEST_CONFIG_KEY, JSON.stringify(configs))
    console.log(`🧹 Cleared test configuration for ${modelId}`)
    return true
  } catch (error) {
    console.error("Failed to clear test configuration:", error)
    return false
  }
}

export function getAllModels(): ModelConfiguration[] {
  return [...BUILT_IN_MODELS, ...getCustomModels()]
}

export function getModels(): ModelConfiguration[] {
  return getAllModels()
}

export function getModelById(id: string): ModelConfiguration | undefined {
  return getAllModels().find((model) => model.id === id)
}

export function generateModelId(name: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const timestamp = Date.now()
  return `${cleanName}-${timestamp}`
}

export function addCustomModel(model: Omit<ModelConfiguration, "metadata">): ModelConfiguration {
  const newModel: ModelConfiguration = {
    ...model,
    metadata: {
      version: "1.0.0",
      author: "User",
      dateCreated: new Date().toISOString(),
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }

  const customModels = getCustomModels()
  customModels.push(newModel)
  saveCustomModels(customModels)

  return newModel
}

export function addModel(model: ModelConfiguration): void {
  const customModels = getCustomModels()
  customModels.push({
    ...model,
    metadata: {
      ...model.metadata,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  saveCustomModels(customModels)
}

export function updateModel(model: ModelConfiguration): void {
  const customModels = getCustomModels()
  const index = customModels.findIndex((m) => m.id === model.id)

  if (index === -1) {
    console.error(`Model not found: ${model.id}`)
    return
  }

  customModels[index] = {
    ...model,
    metadata: {
      ...model.metadata,
      updatedAt: new Date(),
    },
  }

  saveCustomModels(customModels)
}

export function updateCustomModel(id: string, updates: Partial<ModelConfiguration>): boolean {
  const customModels = getCustomModels()
  const index = customModels.findIndex((model) => model.id === id)

  if (index === -1) return false

  customModels[index] = {
    ...customModels[index],
    ...updates,
    metadata: {
      ...customModels[index].metadata,
      ...updates.metadata,
      version: updates.metadata?.version || customModels[index].metadata.version,
      updatedAt: new Date(),
    },
  }

  saveCustomModels(customModels)
  return true
}

export function deleteCustomModel(id: string): boolean {
  const customModels = getCustomModels()
  const filtered = customModels.filter((model) => model.id !== id)

  if (filtered.length === customModels.length) return false

  saveCustomModels(filtered)
  return true
}

export function deleteModel(id: string): void {
  const model = getModelById(id)

  if (!model) {
    throw new Error(`Model not found: ${id}`)
  }

  if (!model.metadata.isCustom) {
    throw new Error("Cannot delete built-in models")
  }

  deleteCustomModel(id)
}

export function saveCustomModel(model: ModelConfiguration): void {
  if (modelExists(model.id)) {
    updateModel(model)
  } else {
    addModel(model)
  }
}

export function modelExists(id: string): boolean {
  return getModelById(id) !== undefined
}

export function getBuiltInModels(): ModelConfiguration[] {
  return BUILT_IN_MODELS
}

export function loadModelConfiguration(modelId: string): ModelConfiguration | null {
  const model = getModelById(modelId)
  if (!model) {
    console.error(`❌ Model not found: ${modelId}`)
    console.log(
      "Available models:",
      getAllModels().map((m) => m.id),
    )
    return null
  }

  // Try to load test configuration
  const testConfig = loadTestConfiguration(modelId)
  if (testConfig) {
    console.log(`✅ Loaded model with test configuration: ${model.name}`)
    return {
      ...model,
      ...testConfig,
      defaultSettings: {
        ...model.defaultSettings,
        ...testConfig.defaultSettings,
      },
      componentTextures: {
        ...model.componentTextures,
        ...testConfig.componentTextures,
      },
    }
  }

  console.log(`✅ Loaded model: ${model.name}`)
  return model
}

export function saveModelConfiguration(
  modelId: string,
  updates: Partial<Pick<ModelConfiguration, "defaultSettings" | "componentTextures">>,
): boolean {
  const model = getModelById(modelId)
  if (!model) return false

  // If it's a built-in model, save to test configuration instead
  if (!model.metadata.isCustom) {
    console.log(`💾 Saving test configuration for built-in model: ${modelId}`)
    return saveTestConfiguration(modelId, updates)
  }

  // If it's a custom model, update it directly
  return updateCustomModel(modelId, updates)
}

export function getModelsByCategory(category: string): ModelConfiguration[] {
  return getAllModels().filter((model) => model.category === category)
}

export function validateModelConfiguration(model: Partial<ModelConfiguration>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!model.id) errors.push("Model ID is required")
  if (!model.name) errors.push("Model name is required")
  if (!model.category) errors.push("Model category is required")
  if (!model.components || Object.keys(model.components).length === 0) {
    errors.push("At least one component is required")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function getModelStorageInfo() {
  if (typeof window === "undefined") {
    return { used: 0, available: 0, percentage: 0, modelCount: 0 }
  }

  try {
    const customModels = getCustomModels()
    const stored = localStorage.getItem(STORAGE_KEY) || ""
    const used = new Blob([stored]).size
    const available = 5 * 1024 * 1024
    const percentage = (used / available) * 100

    return {
      used,
      available,
      percentage: Math.min(percentage, 100),
      modelCount: customModels.length,
    }
  } catch (error) {
    console.error("Failed to get storage info:", error)
    return { used: 0, available: 0, percentage: 0, modelCount: 0 }
  }
}

export function clearAllCustomModels(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log("🧹 Cleared all custom models")
  } catch (error) {
    console.error("❌ Failed to clear custom models:", error)
  }
}

export function debugModelSystem(): void {
  if (typeof window === "undefined") return

  console.group("=== 🏗️ MODEL SYSTEM DEBUG ===")

  const allModels = getAllModels()
  const customModels = getCustomModels()
  const storageInfo = getModelStorageInfo()

  console.log(`Total models: ${allModels.length}`)
  console.log(`Built-in models: ${BUILT_IN_MODELS.length}`)
  console.log(`Custom models: ${customModels.length}`)
  console.log(`Storage used: ${(storageInfo.used / 1024).toFixed(2)} KB`)
  console.log(`Storage percentage: ${storageInfo.percentage.toFixed(2)}%`)

  console.log(
    "Built-in models:",
    BUILT_IN_MODELS.map((m) => m.name),
  )
  console.log(
    "Custom models:",
    customModels.map((m) => m.name),
  )

  console.log(
    "Available model IDs:",
    allModels.map((m) => m.id),
  )

  console.groupEnd()
}

export function calculateComponentPosition(
  componentId: string,
  model: ModelConfiguration,
  index = 0,
): [number, number, number] {
  const positionFunc = model.positioningLogic[componentId]

  if (!positionFunc) {
    console.warn(`No positioning function for component: ${componentId}`)
    return model.defaultSettings.positions[componentId as keyof typeof model.defaultSettings.positions] || [0, 0, 0]
  }

  const params: ComponentPositionParams = {
    index,
    arraySize: model.defaultSettings.arraySize,
    stepSpacing: model.defaultSettings.stepSpacing,
    step1Spacing: model.defaultSettings.step1Spacing,
    globalScale: model.defaultSettings.globalScale,
    basePosition: model.defaultSettings.positions.base,
  }

  try {
    return positionFunc(params)
  } catch (error) {
    console.error(`Error calculating position for ${componentId}:`, error)
    return model.defaultSettings.positions[componentId as keyof typeof model.defaultSettings.positions] || [0, 0, 0]
  }
}

export { defaultBasePosition, defaultStepPosition, defaultStep1Position, defaultTopPosition }

// Unified component array settings interface
export interface ComponentArraySettings {
  enabled: boolean
  count: number
  spacing: [number, number, number]
  basePosition: [number, number, number]
  followSteps: boolean
  positionAtEnd: boolean
  followComponent?: string // Which component to follow (e.g., "step", "step1")
}

// Unified stair configuration interface
export interface StairConfiguration {
  modelId: string
  globalScale: number
  globalArrayMultiplier: number
  componentSettings: Record<string, ComponentArraySettings>
  componentTextures: Record<string, string>
  selectedAngleType?: string
  selectedBottomAngle?: "left" | "right" | "none"
  selectedTopAngle?: "left" | "right" | "none"
}

/**
 * Calculate position for a component instance in an array
 */
export function calculatePosition(
  componentId: string,
  index: number,
  componentSettings: Record<string, ComponentArraySettings>,
  globalArrayMultiplier = 1.0,
): [number, number, number] {
  const settings = componentSettings[componentId]

  if (settings.followSteps && !settings.enabled) {
    const autoPos = calculateAutoPosition(componentId, componentSettings, globalArrayMultiplier)
    const baseAnchor = componentSettings.base?.basePosition || [0, 0, 0]
    if (componentId === "base") return autoPos
    return [autoPos[0] + baseAnchor[0], autoPos[1] + baseAnchor[1], autoPos[2] + baseAnchor[2]]
  }

  const baseAnchor = componentSettings.base?.basePosition || [0, 0, 0]
  const pos: [number, number, number] = [
    settings.basePosition[0] + settings.spacing[0] * index,
    settings.basePosition[1] + settings.spacing[1] * index,
    settings.basePosition[2] + settings.spacing[2] * index,
  ]
  if (componentId === "base") return pos
  return [pos[0] + baseAnchor[0], pos[1] + baseAnchor[1], pos[2] + baseAnchor[2]]
}

/**
 * Calculate auto position based on step array (for components that follow steps)
 */
export function calculateAutoPosition(
  componentId: string,
  componentSettings: Record<string, ComponentArraySettings>,
  globalArrayMultiplier = 1.0,
): [number, number, number] {
  const settings = componentSettings[componentId]

  if (!settings.followSteps) {
    return settings.basePosition
  }

  // Determine which component to follow (default to "step" for backward compatibility)
  const followComponentId = settings.followComponent || "step"
  const followSettings = componentSettings[followComponentId]

  if (!followSettings) {
    console.warn(`Component "${componentId}" is set to follow "${followComponentId}", but it doesn't exist`)
    return settings.basePosition
  }

  const effectiveCount = getEffectiveCount(followComponentId, followSettings, globalArrayMultiplier)
  const multiplier = settings.positionAtEnd ? effectiveCount : effectiveCount - 1

  return [
    followSettings.basePosition[0] + followSettings.spacing[0] * multiplier,
    followSettings.basePosition[1] + followSettings.spacing[1] * multiplier,
    followSettings.basePosition[2] + followSettings.spacing[2] * multiplier,
  ]
}

function isSingleComponentSettings(
  value: ComponentArraySettings | Record<string, ComponentArraySettings>,
): value is ComponentArraySettings {
  return (value as ComponentArraySettings).enabled !== undefined
}

/**
 * Get effective count for a component (considering global multiplier)
 */
export function getEffectiveCount(
  componentId: string,
  componentSettings: ComponentArraySettings | Record<string, ComponentArraySettings>,
  globalArrayMultiplier: number,
): number {
  let settings: ComponentArraySettings | undefined
  if (isSingleComponentSettings(componentSettings)) {
    settings = componentSettings
  } else {
    settings = (componentSettings as Record<string, ComponentArraySettings>)[componentId]
  }

  if (!settings) {
    console.warn(`No settings found for component: ${componentId}`)
    return 1
  }

  // Base and top are typically single components, don't multiply
  if (componentId === "base" || componentId === "top") {
    return settings.enabled ? settings.count : 1
  }

  // For array components (step, step1), apply global multiplier
  return Math.round(settings.count * globalArrayMultiplier)
}

/**
 * Create default component settings from a model configuration
 */
export function createDefaultComponentSettings(model: ModelConfiguration): Record<string, ComponentArraySettings> {
  const settings: Record<string, ComponentArraySettings> = {}

  // Process each component in the model
  Object.entries(model.components).forEach(([componentId, component]) => {
    if (!component) return

    const isArrayComponent = componentId === "step" || componentId === "step1"
    const isTopComponent = componentId === "top"
    const isAngleComponent = componentId === "angle"

    settings[componentId] = {
      enabled: componentId === "base" || isArrayComponent || isAngleComponent, // Enable base, array, and angle components by default
      count: isArrayComponent ? model.defaultSettings.arraySize : 1,
      spacing:
        componentId === "step"
          ? model.defaultSettings.stepSpacing
          : componentId === "step1"
            ? model.defaultSettings.step1Spacing
            : [0, 0, 0],
      basePosition: model.defaultSettings.positions[componentId as keyof typeof model.defaultSettings.positions] || [
        0, 0, 0,
      ],
      followSteps: isTopComponent, // Top component follows steps
      positionAtEnd: false, // Position at last step, not beyond it
      followComponent: isTopComponent ? "step1" : undefined, // Top follows tread (step1)
    }
  })

  return settings
}

/**
 * Save unified configuration to localStorage
 */
export function saveStairConfiguration(config: StairConfiguration): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    console.log("✅ Saved unified stair configuration")
    return true
  } catch (error) {
    console.error("Failed to save stair configuration:", error)
    return false
  }
}

/**
 * Load unified configuration from localStorage
 */
export function loadStairConfiguration(): StairConfiguration | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!stored) return null

    const config = JSON.parse(stored)
    console.log("✅ Loaded unified stair configuration")
    return config
  } catch (error) {
    console.error("Failed to load stair configuration:", error)
    return null
  }
}

/**
 * Clear saved configuration
 */
export function clearStairConfiguration(): boolean {
  if (typeof window === "undefined") return false

  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
    console.log("🧹 Cleared unified stair configuration")
    return true
  } catch (error) {
    console.error("Failed to clear stair configuration:", error)
    return false
  }
}
