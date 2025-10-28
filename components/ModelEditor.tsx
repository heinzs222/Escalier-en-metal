"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Package,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
} from "lucide-react"
import { updateModel, validateModelConfiguration, type ModelConfiguration, type ModelComponent } from "@/lib/models"
import { CategorySelect } from "@/components/CategorySelect"

interface UploadedFile {
  file: File
  url: string
  component: string
}

interface ModelEditorProps {
  model: ModelConfiguration
  onSaveComplete?: (model: ModelConfiguration) => void
  onCancel?: () => void
}

export function ModelEditor({ model, onSaveComplete, onCancel }: ModelEditorProps) {
  const [modelName, setModelName] = useState(model.name)
  const [modelDescription, setModelDescription] = useState(model.description)
  const [modelCategory, setModelCategory] = useState<string>(model.category)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [extraComponents, setExtraComponents] = useState<Array<{ id: string; name: string }>>([])
  const [existingComponents, setExistingComponents] = useState<Record<string, ModelComponent>>(model.components)
  const [editingComponentName, setEditingComponentName] = useState<string | null>(null)
  const [tempComponentName, setTempComponentName] = useState("")

  const coreComponentTypes = ["base", "step", "step1", "top"]

  // Initialize extra components from existing model
  useEffect(() => {
    const extras = Object.keys(model.components).filter((key) => !coreComponentTypes.includes(key))
    setExtraComponents(extras.map((id) => ({ id, name: model.components[id]?.name || id })))
  }, [model])

  // Simulate file upload with progress
  const simulateUpload = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          clearInterval(interval)
          const url = URL.createObjectURL(file)
          resolve(url)
        }
        setUploadProgress(Math.min(progress, 100))
      }, 200)
    })
  }, [])

  const handleFileUpload = useCallback(
    async (files: FileList | null, component: string) => {
      if (!files || files.length === 0) return

      const file = files[0]

      if (!file.name.toLowerCase().endsWith(".glb") && !file.name.toLowerCase().endsWith(".gltf")) {
        setErrors((prev) => [...prev, `${component}: Only GLTF/GLB files are supported`])
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => [...prev, `${component}: File size must be less than 10MB`])
        return
      }

      setIsUploading(true)
      setErrors([])

      try {
        const url = await simulateUpload(file)
        setUploadedFiles((prev) => prev.filter((f) => f.component !== component))
        setUploadedFiles((prev) => [...prev, { file, url, component }])
        console.log(`✅ Uploaded ${component}:`, file.name)
      } catch (error) {
        setErrors((prev) => [...prev, `Failed to upload ${component}: ${error}`])
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [simulateUpload],
  )

  const removeFile = useCallback((component: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.component === component)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((f) => f.component !== component)
    })
  }, [])

  const removeComponent = useCallback((componentId: string) => {
    setExistingComponents((prev) => {
      const updated = { ...prev }
      delete updated[componentId]
      return updated
    })
    setExtraComponents((prev) => prev.filter((comp) => comp.id !== componentId))
    setUploadedFiles((prev) => prev.filter((f) => f.component !== componentId))
  }, [])

  const addExtraComponent = useCallback(() => {
    const componentId = `extra-${Date.now()}`
    setExtraComponents((prev) => [...prev, { id: componentId, name: "" }])
  }, [])

  const updateExtraComponentName = useCallback((id: string, name: string) => {
    setExtraComponents((prev) => prev.map((comp) => (comp.id === id ? { ...comp, name } : comp)))
  }, [])

  const removeExtraComponent = useCallback(
    (id: string) => {
      setExtraComponents((prev) => prev.filter((comp) => comp.id !== id))
      removeComponent(id)
    },
    [removeComponent],
  )

  const startEditingComponentName = useCallback(
    (componentId: string) => {
      const component = existingComponents[componentId]
      if (component) {
        setEditingComponentName(componentId)
        setTempComponentName(component.name)
      }
    },
    [existingComponents],
  )

  const saveComponentName = useCallback(
    (componentId: string) => {
      if (!tempComponentName.trim()) {
        setErrors(["Component name cannot be empty"])
        return
      }

      setExistingComponents((prev) => ({
        ...prev,
        [componentId]: {
          ...prev[componentId]!,
          name: tempComponentName.trim(),
        },
      }))

      setEditingComponentName(null)
      setTempComponentName("")
    },
    [tempComponentName],
  )

  const cancelEditingComponentName = useCallback(() => {
    setEditingComponentName(null)
    setTempComponentName("")
  }, [])

  const handleSubmit = useCallback(async () => {
    setErrors([])
    setSuccess(false)

    if (!modelName.trim()) {
      setErrors(["Model name is required"])
      return
    }

    try {
      setIsUploading(true)

      const components: ModelConfiguration["components"] = { ...existingComponents }

      // Update components with new uploads
      uploadedFiles.forEach((uploadedFile) => {
        const existingComp = components[uploadedFile.component]
        components[uploadedFile.component] = {
          id: uploadedFile.component,
          name: existingComp?.name || `${uploadedFile.component} Component`,
          url: uploadedFile.url,
          defaultTexture: existingComp?.defaultTexture || "painted-metal",
          position: existingComp?.position || [0, 0, 0],
        }
      })

      // Update extra component names
      extraComponents.forEach((extraComp) => {
        if (components[extraComp.id] && extraComp.name.trim()) {
          components[extraComp.id] = {
            ...components[extraComp.id]!,
            name: extraComp.name.trim(),
          }
        }
      })

      const updatedModel: ModelConfiguration = {
        ...model,
        name: modelName.trim(),
        description: modelDescription.trim(),
        category: modelCategory as any,
        components,
        metadata: {
          ...model.metadata,
          updatedAt: new Date(),
        },
      }

      const validation = validateModelConfiguration(updatedModel)
      if (!validation.valid) {
        setErrors(validation.errors)
        return
      }

      updateModel(updatedModel)

      setSuccess(true)
      console.log("✅ Model updated successfully:", updatedModel.name)

      if (onSaveComplete) {
        setTimeout(() => {
          onSaveComplete(updatedModel)
        }, 1000)
      }
    } catch (error) {
      console.error("❌ Failed to update model:", error)
      setErrors([`Failed to save model: ${error}`])
    } finally {
      setIsUploading(false)
    }
  }, [
    modelName,
    modelDescription,
    modelCategory,
    uploadedFiles,
    extraComponents,
    existingComponents,
    model,
    onSaveComplete,
  ])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Edit Model: {model.name}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modelName">Model Name *</Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., Custom Spiral Stair"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelDescription">Description</Label>
            <Textarea
              id="modelDescription"
              value={modelDescription}
              onChange={(e) => setModelDescription(e.target.value)}
              placeholder="Describe your stair model..."
              rows={3}
              disabled={isUploading}
            />
          </div>

          <CategorySelect value={modelCategory} onValueChange={setModelCategory} disabled={isUploading} />
        </div>

        {/* Existing Components */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <Label className="text-base font-medium">Model Components</Label>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Core Components</div>
            <div className="grid gap-4">
              {coreComponentTypes.map((componentType) => {
                const existingComp = existingComponents[componentType]
                const uploadedFile = uploadedFiles.find((f) => f.component === componentType)
                const isRequired = componentType === "step"
                const isEditing = editingComponentName === componentType

                return (
                  <div key={componentType} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={tempComponentName}
                              onChange={(e) => setTempComponentName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveComponentName(componentType)
                                } else if (e.key === "Escape") {
                                  cancelEditingComponentName()
                                }
                              }}
                              placeholder="Component name"
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveComponentName(componentType)}
                              className="h-8"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEditingComponentName} className="h-8">
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Label className="font-medium">
                              {existingComp?.name ||
                                `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Component`}
                            </Label>
                            {existingComp && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => startEditingComponentName(componentType)}
                                disabled={isUploading}
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </Button>
                            )}
                          </>
                        )}
                        {isRequired && <Badge variant="destructive">Required</Badge>}
                        {existingComp && !uploadedFile && <Badge variant="outline">Existing</Badge>}
                      </div>
                      {uploadedFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(componentType)}
                          disabled={isUploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {uploadedFile ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{uploadedFile.file.name}</span>
                        <Badge variant="outline">{(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB</Badge>
                      </div>
                    ) : existingComp ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <div className="text-xs text-gray-500 truncate max-w-xs">{existingComp.url}</div>
                        </div>
                        <label className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer">
                          Replace
                          <input
                            type="file"
                            className="hidden"
                            accept=".glb,.gltf"
                            onChange={(e) => handleFileUpload(e.target.files, componentType)}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <div className="text-sm text-gray-600 mb-2">
                            Drop GLTF/GLB file here or{" "}
                            <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                              browse
                              <input
                                type="file"
                                className="hidden"
                                accept=".glb,.gltf"
                                onChange={(e) => handleFileUpload(e.target.files, componentType)}
                                disabled={isUploading}
                              />
                            </label>
                          </div>
                          <div className="text-xs text-gray-500">Max file size: 10MB</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Extra Components */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">Extra Components (Railings, etc.)</div>
              <Button variant="outline" size="sm" onClick={addExtraComponent} disabled={isUploading}>
                <Plus className="w-4 h-4 mr-1" />
                Add Component
              </Button>
            </div>

            {extraComponents.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-lg">
                No extra components. Click "Add Component" to add railings or other parts.
              </div>
            ) : (
              <div className="grid gap-4">
                {extraComponents.map((extraComp) => {
                  const existingComp = existingComponents[extraComp.id]
                  const uploadedFile = uploadedFiles.find((f) => f.component === extraComp.id)
                  const isEditing = editingComponentName === extraComp.id

                  return (
                    <div key={extraComp.id} className="border rounded-lg p-4 bg-blue-50/30">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={tempComponentName}
                                onChange={(e) => setTempComponentName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveComponentName(extraComp.id)
                                  } else if (e.key === "Escape") {
                                    cancelEditingComponentName()
                                  }
                                }}
                                placeholder="Component name"
                                className="bg-white"
                                autoFocus
                              />
                              <Button variant="ghost" size="sm" onClick={() => saveComponentName(extraComp.id)}>
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEditingComponentName}>
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Input
                                placeholder="Component name (e.g., Left Railing)"
                                value={extraComp.name}
                                onChange={(e) => updateExtraComponentName(extraComp.id, e.target.value)}
                                disabled={isUploading}
                                className="flex-1 bg-white"
                              />
                              {existingComp && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingComponentName(extraComp.id)}
                                  disabled={isUploading}
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExtraComponent(extraComp.id)}
                                disabled={isUploading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>

                        {uploadedFile ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{uploadedFile.file.name}</span>
                            <Badge variant="outline">{(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB</Badge>
                          </div>
                        ) : existingComp ? (
                          <div className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="text-sm text-gray-600 flex-1 truncate">{existingComp.url}</div>
                            <label className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer ml-2">
                              Replace
                              <input
                                type="file"
                                className="hidden"
                                accept=".glb,.gltf"
                                onChange={(e) => handleFileUpload(e.target.files, extraComp.id)}
                                disabled={isUploading}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white">
                            <div className="text-center">
                              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                              <div className="text-xs text-gray-600 mb-1">
                                Drop GLTF/GLB file here or{" "}
                                <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                                  browse
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".glb,.gltf"
                                    onChange={(e) => handleFileUpload(e.target.files, extraComp.id)}
                                    disabled={isUploading || !extraComp.name.trim()}
                                  />
                                </label>
                              </div>
                              {!extraComp.name.trim() && (
                                <div className="text-xs text-amber-600">Enter a name first</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Model updated successfully!</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSubmit} disabled={isUploading} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {isUploading ? "Saving..." : "Save Changes"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
