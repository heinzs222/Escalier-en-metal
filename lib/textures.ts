// Enhanced texture configuration system with custom texture support
import { getCustomTextures as getUploadedCustomTextures, type UploadedTexture } from "./textureUploader"

export interface TextureSet {
  id: string
  name: string
  category: "wood" | "metal"
  maps: {
    diffuse?: string
    normal?: string
    roughness?: string
    metalness?: string
    ao?: string
    specular?: string
    glossiness?: string
  }
  materialProps: {
    metalness: number
    roughness: number
    color: number
    [key: string]: any
  }
  isCustom?: boolean
}

// Built-in texture library
export const BUILT_IN_TEXTURES: TextureSet[] = [
  // Wood Textures
  {
    id: "dark-cherry-wood",
    name: "Dark Cherry Wood",
    category: "wood",
    maps: {
      diffuse: "/textures/wood/dark-cherrywood-diffuse.jpg",
      normal: "/textures/wood/dark-cherrywood-normal.jpg",
      ao: "/textures/wood/dark-cherrywood-ao.jpg",
    },
    materialProps: {
      metalness: 0.0,
      roughness: 0.9,
      color: 0x8b4513,
    },
  },

  // Metal Textures
  {
    id: "painted-metal",
    name: "Painted Metal",
    category: "metal",
    maps: {
      diffuse: "/textures/metal/painted_metal_diffuse.jpg",
      normal: "/textures/metal/painted_metal_normal_opengl.jpg",
      specular: "/textures/metal/painted_metal_specular.jpg",
      glossiness: "/textures/metal/painted_metal_glossiness.png",
    },
    materialProps: {
      metalness: 0.8,
      roughness: 0.2,
      color: 0xcccccc,
    },
  },
]

// Convert uploaded texture to TextureSet format
function convertUploadedTexture(uploaded: UploadedTexture): TextureSet {
  const maps: { [key: string]: string } = {}

  uploaded.maps.forEach((map) => {
    if (map.type === "diffuse") {
      maps.diffuse = map.dataUrl
    } else {
      maps[map.type] = map.dataUrl
    }
  })

  return {
    id: uploaded.id,
    name: uploaded.name,
    category: uploaded.category,
    maps,
    materialProps: uploaded.materialProps,
    isCustom: true,
  }
}

// Get all textures (built-in + custom)
function getAllTexturesInternal(): TextureSet[] {
  const customTextures = getUploadedCustomTextures().map(convertUploadedTexture)
  return [...BUILT_IN_TEXTURES, ...customTextures]
}

// Centralized lookup maps
const texturesByCategory = new Map<string, TextureSet[]>()
const texturesById = new Map<string, TextureSet>()
let isInitialized = false

function initializeLookups() {
  if (isInitialized) return

  // Clear existing maps
  texturesByCategory.clear()
  texturesById.clear()

  const allTextures = getAllTexturesInternal()

  allTextures.forEach((texture) => {
    texturesById.set(texture.id, texture)

    if (!texturesByCategory.has(texture.category)) {
      texturesByCategory.set(texture.category, [])
    }
    texturesByCategory.get(texture.category)!.push(texture)
  })

  isInitialized = true
}

// Force refresh of texture system (for when custom textures are added/removed)
export function refreshTextureSystem(): void {
  isInitialized = false
  initializeLookups()
}

export function getTexturesByCategory(category: "wood" | "metal"): TextureSet[] {
  initializeLookups()
  return texturesByCategory.get(category) || []
}

export function getTextureById(id: string): TextureSet | undefined {
  initializeLookups()
  const texture = texturesById.get(id)
  if (!texture) {
    console.error(`❌ [TextureSystem] Texture not found: ${id}`)
    console.log(`Available texture IDs:`, Array.from(texturesById.keys()))
  }
  return texture
}

export function getWoodTextures(): TextureSet[] {
  return getTexturesByCategory("wood")
}

export function getMetalTextures(): TextureSet[] {
  return getTexturesByCategory("metal")
}

export function getBuiltInTextures(): TextureSet[] {
  return BUILT_IN_TEXTURES
}

// Export function to get all textures (built-in + custom)
export function getTextures(): TextureSet[] {
  initializeLookups()
  return getAllTexturesInternal()
}

// Enhanced texture maps generation
export function getTextureMaps(textureSet?: TextureSet): { [key: string]: string } {
  if (!textureSet) {
    return {}
  }

  const maps: { [key: string]: string } = {}

  // Direct mapping to Three.js material properties
  if (textureSet.maps.diffuse) {
    maps.map = textureSet.maps.diffuse
  }

  if (textureSet.maps.normal) {
    maps.normalMap = textureSet.maps.normal
  }

  if (textureSet.maps.ao) {
    maps.aoMap = textureSet.maps.ao
  }

  if (textureSet.maps.roughness) {
    maps.roughnessMap = textureSet.maps.roughness
  }

  if (textureSet.maps.metalness) {
    maps.metalnessMap = textureSet.maps.metalness
  }

  // Handle specular and glossiness for older material workflows
  if (textureSet.maps.specular && !maps.metalnessMap) {
    maps.metalnessMap = textureSet.maps.specular
  }

  if (textureSet.maps.glossiness && !maps.roughnessMap) {
    maps.roughnessMap = textureSet.maps.glossiness
  }

  return maps
}

export function validateTextureId(id: string): boolean {
  initializeLookups()
  const isValid = texturesById.has(id)
  if (!isValid) {
    console.error(`❌ [TextureSystem] Invalid texture ID: ${id}`)
  }
  return isValid
}

export function getAllTexturePaths(): string[] {
  const paths: string[] = []
  const allTextures = getAllTexturesInternal()

  allTextures.forEach((texture) => {
    Object.entries(texture.maps).forEach(([type, path]) => {
      if (path && !path.startsWith("data:")) {
        paths.push(path)
      }
    })
  })
  return paths
}

export function preloadTextures(): Promise<void[]> {
  const paths = getAllTexturePaths()

  const preloadPromises = paths.map((path) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        resolve()
      }

      img.onerror = (error) => {
        console.error(`❌ Failed to preload texture: ${path}`, error)
        resolve()
      }

      img.src = path
    })
  })

  return Promise.all(preloadPromises)
}

export async function initializeTextureSystem(): Promise<void> {
  console.log("🎨 Initializing texture system...")
  initializeLookups()

  try {
    await preloadTextures()
    console.log("✅ Texture system ready")
  } catch (error) {
    console.error("❌ Texture system initialization failed:", error)
  }
}

// Enhanced debug function - only call manually when needed
export function debugTextureSystem(): void {
  console.log("=== 🔍 TEXTURE SYSTEM DEBUG ===")

  const allTextures = getAllTexturesInternal()
  const customTextures = getAllTexturesInternal().filter((t) => t.isCustom)
  const builtInTextures = getBuiltInTextures()

  console.log(`Total textures: ${allTextures.length}`)
  console.log(`Built-in textures: ${builtInTextures.length}`)
  console.log(`Custom textures: ${customTextures.length}`)
  console.log("Available texture IDs:", Array.from(texturesById.keys()))

  // Test specific textures
  const paintedMetal = getTextureById("painted-metal")
  const darkCherry = getTextureById("dark-cherry-wood")

  console.log("=== PAINTED METAL TEST ===")
  if (paintedMetal) {
    console.log("✅ painted-metal found:", paintedMetal)
    const maps = getTextureMaps(paintedMetal)
    console.log("Generated maps:", maps)
  } else {
    console.error("❌ painted-metal NOT FOUND!")
  }

  console.log("=== DARK CHERRY WOOD TEST ===")
  if (darkCherry) {
    console.log("✅ dark-cherry-wood found:", darkCherry)
    const maps = getTextureMaps(darkCherry)
    console.log("Generated maps:", maps)
  } else {
    console.error("❌ dark-cherry-wood NOT FOUND!")
  }

  console.log("=== END DEBUG ===")
}
