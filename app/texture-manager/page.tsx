"use client"

import { TextureUploader } from "@/components/TextureUploader"
import { refreshTextureSystem } from "@/lib/textures"
import type { UploadedTexture } from "@/lib/textureUploader"

export default function TextureManagerPage() {
  const handleTextureUploaded = (texture: UploadedTexture) => {
    // Refresh the texture system to include the new texture
    refreshTextureSystem()
    console.log("New texture uploaded:", texture.name)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <TextureUploader onTextureUploaded={handleTextureUploaded} onClose={() => (window.location.href = "/")} />
    </div>
  )
}
