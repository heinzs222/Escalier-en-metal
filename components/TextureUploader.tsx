"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, ImageIcon, Trash2, Download, Info, CheckCircle, AlertCircle, Folder } from "lucide-react"
import {
  validateImageFile,
  fileToDataUrl,
  generateTextureId,
  saveCustomTexture,
  getCustomTextures,
  deleteCustomTexture,
  getStorageInfo,
  clearAllCustomTextures,
  MAP_TYPES,
  type UploadedTextureMap,
  type UploadedTexture,
} from "@/lib/textureUploader"

interface TextureUploaderProps {
  onTextureUploaded?: (texture: UploadedTexture) => void
  onClose?: () => void
}

export function TextureUploader({ onTextureUploaded, onClose }: TextureUploaderProps) {
  const [textureName, setTextureName] = useState("")
  const [textureCategory, setTextureCategory] = useState<"wood" | "metal">("wood")
  const [uploadedMaps, setUploadedMaps] = useState<UploadedTextureMap[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [customTextures, setCustomTextures] = useState<UploadedTexture[]>([])
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 5 * 1024 * 1024, percentage: 0 })
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Load textures and storage info on client side
  useEffect(() => {
    setCustomTextures(getCustomTextures())
    setStorageInfo(getStorageInfo())
  }, [])

  // Handle file upload for specific map type
  const handleFileUpload = useCallback(
    async (mapType: string, file: File) => {
      setError(null)

      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error!)
        return
      }

      try {
        const dataUrl = await fileToDataUrl(file)
        const mapName = `${textureName || "Untitled"} - ${MAP_TYPES.find((t) => t.id === mapType)?.name}`

        const newMap: UploadedTextureMap = {
          type: mapType as any,
          file,
          dataUrl,
          name: mapName,
        }

        setUploadedMaps((prev) => {
          const filtered = prev.filter((m) => m.type !== mapType)
          return [...filtered, newMap]
        })

        console.log(`✅ Uploaded ${mapType} map:`, file.name)
      } catch (error) {
        setError(`Failed to process ${mapType} map: ${error}`)
      }
    },
    [textureName],
  )

  // Remove uploaded map
  const removeMap = useCallback((mapType: string) => {
    setUploadedMaps((prev) => prev.filter((m) => m.type !== mapType))
    if (fileInputRefs.current[mapType]) {
      fileInputRefs.current[mapType]!.value = ""
    }
  }, [])

  // Save texture
  const saveTexture = useCallback(async () => {
    if (!textureName.trim()) {
      setError("Please enter a texture name")
      return
    }

    const diffuseMap = uploadedMaps.find((m) => m.type === "diffuse")
    if (!diffuseMap) {
      setError("Diffuse map is required")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const textureId = generateTextureId(textureName, textureCategory)

      // Convert maps to the format expected by texture system
      const maps: { [key: string]: string } = {}
      uploadedMaps.forEach((map) => {
        if (map.type === "diffuse") {
          maps.diffuse = map.dataUrl
        } else {
          maps[map.type] = map.dataUrl
        }
      })

      const newTexture: UploadedTexture = {
        id: textureId,
        name: textureName,
        category: textureCategory,
        maps: uploadedMaps,
        materialProps: {
          metalness: textureCategory === "metal" ? 0.8 : 0.0,
          roughness: textureCategory === "wood" ? 0.9 : 0.2,
          color: textureCategory === "wood" ? 0x8b4513 : 0xcccccc,
        },
        createdAt: new Date(),
        isCustom: true,
      }

      saveCustomTexture(newTexture)
      setCustomTextures(getCustomTextures())
      setStorageInfo(getStorageInfo())

      setSuccess(`Texture "${textureName}" saved successfully!`)
      onTextureUploaded?.(newTexture)

      // Reset form
      setTextureName("")
      setUploadedMaps([])
      Object.values(fileInputRefs.current).forEach((input) => {
        if (input) input.value = ""
      })
    } catch (error) {
      setError(`Failed to save texture: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }, [textureName, textureCategory, uploadedMaps, onTextureUploaded])

  // Delete custom texture
  const handleDeleteTexture = useCallback((textureId: string) => {
    try {
      deleteCustomTexture(textureId)
      setCustomTextures(getCustomTextures())
      setStorageInfo(getStorageInfo())
      setSuccess("Texture deleted successfully")
    } catch (error) {
      setError(`Failed to delete texture: ${error}`)
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Texture Manager</h2>
          <p className="text-stone-600">Upload and manage custom textures for your stair designs</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      {/* Storage Info */}
      <Card className="border-stone-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-600">Storage Usage</span>
            <span className="text-sm text-stone-500">
              {(storageInfo.used / 1024).toFixed(1)}KB / {(storageInfo.available / 1024).toFixed(0)}KB
            </span>
          </div>
          <Progress value={storageInfo.percentage} className="h-2" />
          {storageInfo.percentage > 80 && (
            <p className="text-xs text-amber-600 mt-1">Storage is getting full. Consider removing unused textures.</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload New Texture</TabsTrigger>
          <TabsTrigger value="manage">Manage Textures ({customTextures.length})</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Texture Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="texture-name">Texture Name *</Label>
                  <Input
                    id="texture-name"
                    value={textureName}
                    onChange={(e) => setTextureName(e.target.value)}
                    placeholder="e.g., Dark Walnut, Brushed Steel"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="texture-category">Category *</Label>
                  <Select
                    value={textureCategory}
                    onValueChange={(value: "wood" | "metal") => setTextureCategory(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wood">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-amber-600"></div>
                          Wood
                        </div>
                      </SelectItem>
                      <SelectItem value="metal">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-gray-400"></div>
                          Metal
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Texture Maps Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Texture Maps
              </CardTitle>
              <p className="text-sm text-stone-600">
                Upload different map types to create realistic materials. Diffuse map is required.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MAP_TYPES.map((mapType) => {
                  const uploadedMap = uploadedMaps.find((m) => m.type === mapType.id)

                  return (
                    <div key={mapType.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="flex items-center gap-2">
                            {mapType.name}
                            {mapType.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </Label>
                          <p className="text-xs text-stone-500">{mapType.description}</p>
                        </div>
                        {uploadedMap && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMap(mapType.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {uploadedMap ? (
                        <div className="relative">
                          <img
                            src={uploadedMap.dataUrl || "/placeholder.svg"}
                            alt={mapType.name}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Badge className="absolute top-2 right-2 bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center hover:border-stone-400 transition-colors">
                          <input
                            ref={(el) => {
                              if (fileInputRefs.current) {
                                fileInputRefs.current[mapType.id] = el
                              }
                            }}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(mapType.id, file)
                            }}
                            className="hidden"
                            id={`upload-${mapType.id}`}
                          />
                          <label
                            htmlFor={`upload-${mapType.id}`}
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <ImageIcon className="w-8 h-8 text-stone-400" />
                            <span className="text-sm text-stone-600">Click to upload</span>
                            <span className="text-xs text-stone-500">JPG, PNG, WebP up to 10MB</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <div className="text-sm text-stone-600">
                  {uploadedMaps.length} of {MAP_TYPES.length} maps uploaded
                  {uploadedMaps.find((m) => m.type === "diffuse") && (
                    <Badge variant="secondary" className="ml-2">
                      Ready to save
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={saveTexture}
                  disabled={isUploading || !textureName.trim() || !uploadedMaps.find((m) => m.type === "diffuse")}
                  className="bg-stone-800 hover:bg-stone-700"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Save Texture
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          {customTextures.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Folder className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-800 mb-2">No Custom Textures</h3>
                <p className="text-stone-600 mb-4">Upload your first custom texture to get started</p>
                <Button variant="outline" onClick={() => {
                  const element = document.querySelector('[value="upload"]') as HTMLElement
                  element?.click()
                }}>
                  Upload Texture
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-stone-800">Custom Textures</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete all custom textures?")) {
                      clearAllCustomTextures()
                      setCustomTextures([])
                      setStorageInfo({ used: 0, available: 5 * 1024 * 1024, percentage: 0 })
                      setSuccess("All custom textures deleted")
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTextures.map((texture) => {
                  const diffuseMap = texture.maps.find((m) => m.type === "diffuse")

                  return (
                    <Card key={texture.id} className="overflow-hidden">
                      <div className="aspect-video relative">
                        {diffuseMap ? (
                          <img
                            src={diffuseMap.dataUrl || "/placeholder.svg"}
                            alt={texture.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-stone-400" />
                          </div>
                        )}
                        <Badge
                          className={`absolute top-2 right-2 ${
                            texture.category === "wood" ? "bg-amber-600" : "bg-gray-600"
                          }`}
                        >
                          {texture.category}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-stone-800 mb-1">{texture.name}</h4>
                        <p className="text-sm text-stone-600 mb-2">
                          {texture.maps.length} maps • {texture.createdAt.toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTexture(texture.id)}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
