"use client"

import { useGLTF, useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"
import { getTextureById, getTextureMaps, validateTextureId } from "@/lib/textures"

interface StairModuleProps {
  url: string
  textureId: string
  position?: [number, number, number]
  [key: string]: any
}

export function StairModule({ url, textureId, position = [0, 0, 0], ...rest }: StairModuleProps) {
  const { scene } = useGLTF(url)

  // Get texture configuration
  const textureSet = useMemo(() => {
    if (!validateTextureId(textureId)) {
      console.error(`[StairModule] Invalid textureId: ${textureId}`)
      return null
    }

    return getTextureById(textureId)
  }, [textureId])

  // Get texture maps (converts to Three.js property names)
  const textureUrlMap = useMemo(() => {
    if (!textureSet) {
      return {}
    }

    return getTextureMaps(textureSet)
  }, [textureSet])

  const loadedTextures = useTexture(textureUrlMap)
  const hasTextures = Object.keys(textureUrlMap).length > 0

  // Create material
  const material = useMemo(() => {
    if (!textureSet) {
      return new THREE.MeshStandardMaterial({
        color: 0xff00ff, // Bright magenta for debugging
        name: `fallback-${textureId}`,
      })
    }

    // Start with base material properties
    const materialConfig: any = {
      ...textureSet.materialProps,
      name: textureSet.id,
    }

    // Apply loaded textures if we have any
    if (hasTextures && loadedTextures) {
      Object.entries(loadedTextures).forEach(([key, texture]) => {
        // Check if it's a texture-like object
        if (texture && typeof texture === "object" && "uuid" in texture && "image" in texture) {
          // Configure texture properties
          if ("wrapS" in texture && "wrapT" in texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
          }
          if ("flipY" in texture) {
            texture.flipY = false
          }

          materialConfig[key] = texture
        }
      })
    }

    const newMaterial = new THREE.MeshStandardMaterial(materialConfig)
    newMaterial.needsUpdate = true

    return newMaterial
  }, [textureSet, textureId, hasTextures, loadedTextures])

  // Clone scene and apply material
  const clonedScene = useMemo(() => {
    const cloned = scene.clone()

    cloned.traverse((child) => {
      if ((child as any).isMesh || child.type === "Mesh" || child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh
        mesh.material = material
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })

    return cloned
  }, [scene, material])

  return <primitive object={clonedScene} position={position} {...rest} />
}

// Preload all GLTF models
useGLTF.preload("/models/limon_central/limon_central_droit_droit_base.glb")
useGLTF.preload("/models/limon_central/limon_central_droit_droit_step.glb")
useGLTF.preload("/models/limon_central/limon_central_droit_droit_step1.glb")
useGLTF.preload("/models/limon_central/limon_central_droit_droit_top.glb")
