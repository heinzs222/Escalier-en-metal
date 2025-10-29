
export interface UploadedTextureMap {
  type: "diffuse" | "normal" | "roughness" | "metalness" | "ao" | "specular" | "glossiness"
  file: File
  dataUrl: string
  name: string
}

export interface UploadedTexture {
  id: string
  name: string
  category: "wood" | "metal"
  maps: UploadedTextureMap[]
  materialProps: {
    metalness: number
    roughness: number
    color: number
  }
  createdAt: Date
  isCustom: true
}


export const SUPPORTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp", "image/tiff"]

export const MAP_TYPES = [
  { id: "diffuse", name: "Diffuse (Color)", description: "Base color/albedo map", required: true },
  { id: "normal", name: "Normal Map", description: "Surface detail and bumps", required: false },
  { id: "roughness", name: "Roughness Map", description: "Surface shininess/roughness", required: false },
  { id: "metalness", name: "Metalness Map", description: "Metallic vs non-metallic areas", required: false },
  { id: "ao", name: "Ambient Occlusion", description: "Shadow detail in crevices", required: false },
  { id: "specular", name: "Specular Map", description: "Reflectivity (legacy workflow)", required: false },
  { id: "glossiness", name: "Glossiness Map", description: "Surface glossiness (legacy workflow)", required: false },
] as const

// Validate file format
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported format: ${file.type}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    }
  }


  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 10MB`,
    }
  }

  return { valid: true }
}


export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


export function generateTextureId(name: string, category: "wood" | "metal"): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return `custom-${category}-${cleanName}-${Date.now()}`
}

// Storage keys
const CUSTOM_TEXTURES_KEY = "customTextures"

// Save custom texture to localStorage
export function saveCustomTexture(texture: UploadedTexture): void {
  // Check if we're in the browser
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage not available')
    return
  }
  
  try {
    const existing = getCustomTextures()
    const updated = [...existing.filter((t) => t.id !== texture.id), texture]
    localStorage.setItem(CUSTOM_TEXTURES_KEY, JSON.stringify(updated))
    console.log(`✅ Saved custom texture: ${texture.id}`)
  } catch (error) {
    console.error("❌ Failed to save custom texture:", error)
    throw new Error("Failed to save texture. Storage may be full.")
  }
}

// Load custom textures from localStorage
export function getCustomTextures(): UploadedTexture[] {
  // Check if we're in the browser
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  
  try {
    const stored = localStorage.getItem(CUSTOM_TEXTURES_KEY)
    if (!stored) return []

    const textures = JSON.parse(stored) as UploadedTexture[]
    return textures.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }))
  } catch (error) {
    console.error("❌ Failed to load custom textures:", error)
    return []
  }
}

// Delete custom texture
export function deleteCustomTexture(textureId: string): void {
  // Check if we're in the browser
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage not available')
    return
  }
  
  try {
    const existing = getCustomTextures()
    const updated = existing.filter((t) => t.id !== textureId)
    localStorage.setItem(CUSTOM_TEXTURES_KEY, JSON.stringify(updated))
    console.log(`🗑️ Deleted custom texture: ${textureId}`)
  } catch (error) {
    console.error("❌ Failed to delete custom texture:", error)
    throw new Error("Failed to delete texture")
  }
}

// Get storage usage info
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  // Check if we're in the browser
  if (typeof window === 'undefined' || !window.localStorage) {
    return { used: 0, available: 5 * 1024 * 1024, percentage: 0 }
  }
  
  try {
    const used = new Blob([localStorage.getItem(CUSTOM_TEXTURES_KEY) || ""]).size
    const available = 5 * 1024 * 1024 // Approximate 5MB localStorage limit
    const percentage = (used / available) * 100

    return { used, available, percentage }
  } catch (error) {
    return { used: 0, available: 5 * 1024 * 1024, percentage: 0 }
  }
}

// Clear all custom textures
export function clearAllCustomTextures(): void {
  // Check if we're in the browser
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage not available')
    return
  }
  
  try {
    localStorage.removeItem(CUSTOM_TEXTURES_KEY)
    console.log("🧹 Cleared all custom textures")
  } catch (error) {
    console.error("❌ Failed to clear custom textures:", error)
  }
}
