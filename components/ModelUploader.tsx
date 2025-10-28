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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, X, CheckCircle, AlertCircle, FileText, Package, Plus } from "lucide-react"
import { saveCustomModel, generateModelId, validateModelConfiguration, type ModelConfiguration } from "@/lib/models"
import { getCategories, addCategory, updateCategory, deleteCategory, type StairCategory } from "@/lib/categories"
import { CategorySelect } from "@/components/CategorySelect"

interface UploadedFile {
  file: File
  url: string
  component: string
}

interface ModelUploaderProps {
  onUploadComplete?: (model: ModelConfiguration) => void
  onCancel?: () => void
}

export function ModelUploader({ onUploadComplete, onCancel }: ModelUploaderProps) {
  const [modelName, setModelName] = useState("")
  const [modelDescription, setModelDescription] = useState("")
  const [modelCategory, setModelCategory] = useState<string>("custom")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [extraComponents, setExtraComponents] = useState<Array<{ id: string; name: string }>>([])

  // Category management
  const [categories, setCategories] = useState<StairCategory[]>([])
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StairCategory | null>(null)
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryError, setCategoryError] = useState("")

  const componentTypes = [
    { id: "base", name: "Base Component", required: false, isCore: true },
    { id: "step", name: "Step Component", required: true, isCore: true },
    { id: "step1", name: "Step1 Component", required: false, isCore: true },
    { id: "top", name: "Top Component", required: false, isCore: true },
  ]

  // Load categories
  useEffect(() => {
    refreshCategories()
  }, [])

  const refreshCategories = () => {
    const loadedCategories = getCategories()
    setCategories(loadedCategories)
  }

  const handleAddCategory = () => {
    setCategoryError("")

    if (!newCategoryId.trim() || !newCategoryName.trim()) {
      setCategoryError("Both ID and name are required")
      return
    }

    // Validate ID format (lowercase, hyphens only)
    if (!/^[a-z0-9-]+$/.test(newCategoryId)) {
      setCategoryError("ID must contain only lowercase letters, numbers, and hyphens")
      return
    }

    // Check if category already exists
    if (categories.some((cat) => cat.id === newCategoryId)) {
      setCategoryError("A category with this ID already exists")
      return
    }

    const newCategory: StairCategory = {
      id: newCategoryId,
      name: newCategoryName,
      isCustom: true,
    }

    addCategory(newCategory)
    refreshCategories()
    setModelCategory(newCategoryId)
    setNewCategoryId("")
    setNewCategoryName("")
    setShowCategoryDialog(false)
  }

  const handleEditCategory = (category: StairCategory) => {
    setEditingCategory(category)
    setNewCategoryId(category.id)
    setNewCategoryName(category.name)
    setCategoryError("")
    setShowCategoryDialog(true)
  }

  const handleUpdateCategory = () => {
    if (!editingCategory) return

    setCategoryError("")

    if (!newCategoryName.trim()) {
      setCategoryError("Category name is required")
      return
    }

    updateCategory(editingCategory.id, { name: newCategoryName })
    refreshCategories()
    setEditingCategory(null)
    setNewCategoryId("")
    setNewCategoryName("")
    setShowCategoryDialog(false)
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory(categoryId)
      refreshCategories()
      if (modelCategory === categoryId) {
        setModelCategory("custom")
      }
    }
  }

  const openAddCategoryDialog = () => {
    setEditingCategory(null)
    setNewCategoryId("")
    setNewCategoryName("")
    setCategoryError("")
    setShowCategoryDialog(true)
  }

  // Simulate file upload with progress
  const simulateUpload = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          clearInterval(interval)
          // Generate a blob URL for the uploaded file
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

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".glb") && !file.name.toLowerCase().endsWith(".gltf")) {
        setErrors((prev) => [...prev, `${component}: Only GLTF/GLB files are supported`])
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => [...prev, `${component}: File size must be less than 10MB`])
        return
      }

      setIsUploading(true)
      setErrors([])

      try {
        const url = await simulateUpload(file)

        // Remove existing file for this component
        setUploadedFiles((prev) => prev.filter((f) => f.component !== component))

        // Add new file
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

  const addExtraComponent = useCallback(() => {
    const componentId = `extra-${Date.now()}`
    setExtraComponents((prev) => [...prev, { id: componentId, name: "" }])
  }, [])

  const updateExtraComponentName = useCallback((id: string, name: string) => {
    setExtraComponents((prev) => prev.map((comp) => (comp.id === id ? { ...comp, name } : comp)))
  }, [])

  const removeExtraComponent = useCallback((id: string) => {
    setExtraComponents((prev) => prev.filter((comp) => comp.id !== id))
    // Also remove any uploaded files for this component
    setUploadedFiles((prev) => prev.filter((f) => f.component !== id))
  }, [])

  const handleSubmit = useCallback(async () => {
    setErrors([])
    setSuccess(false)

    // Basic validation
    if (!modelName.trim()) {
      setErrors(["Model name is required"])
      return
    }

    if (uploadedFiles.length === 0) {
      setErrors(["At least one component file is required"])
      return
    }

    // Check if required step component is present
    const hasStepComponent = uploadedFiles.some((f) => f.component === "step")
    if (!hasStepComponent) {
      setErrors(["Step component is required"])
      return
    }

    try {
      setIsUploading(true)

      // Create model configuration
      const modelId = generateModelId(modelName)
      const components: ModelConfiguration["components"] = {}

      // Process uploaded files
      uploadedFiles.forEach((uploadedFile) => {
        components[uploadedFile.component] = {
          id: uploadedFile.component,
          name: `${uploadedFile.component} Component`,
          url: uploadedFile.url,
          defaultTexture: uploadedFile.component === "step1" ? "dark-cherry-wood" : "painted-metal",
          position: [0, 0, 0],
        }
      })

      // Process extra components
      extraComponents.forEach((extraComp) => {
        const uploadedFile = uploadedFiles.find((f) => f.component === extraComp.id)
        if (uploadedFile && extraComp.name.trim()) {
          components[extraComp.id] = {
            id: extraComp.id,
            name: extraComp.name.trim(),
            url: uploadedFile.url,
            defaultTexture: "painted-metal",
            position: [0, 0, 0],
          }
        }
      })

      const newModel: ModelConfiguration = {
        id: modelId,
        name: modelName.trim(),
        description: modelDescription.trim() || `Custom ${modelName} stair model`,
        category: modelCategory as any,
        components,
        defaultSettings: {
          arraySize: 8,
          stepSpacing: [-10.133, 6.941, 0.0],
          step1Spacing: [-10.133, 6.941, 0.3],
          globalScale: 0.01,
          positions: {
            base: [0, 0, 0],
            step: [0, 0, 0],
            step1: [0, 0, 0],
            top: [0, 0, 0],
          },
        },
        componentTextures: {
          base: "painted-metal",
          step: "painted-metal",
          step1: "dark-cherry-wood",
          top: "painted-metal",
        },
        pricing: {
          basePrice: 5000,
          stepMultiplier: 150,
          widthMultiplier: 200,
        },
        metadata: {
          author: "Custom Upload",
          version: "1.0.0",
          createdAt: new Date(),
          updatedAt: new Date(),
          isCustom: true,
        },
      }

      // Validate model configuration
      const validation = validateModelConfiguration(newModel)
      if (!validation.valid) {
        setErrors(validation.errors)
        return
      }

      // Save model
      saveCustomModel(newModel)

      setSuccess(true)
      console.log("✅ Model uploaded successfully:", newModel.name)

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(newModel)
      }

      // Reset form after delay
      setTimeout(() => {
        setModelName("")
        setModelDescription("")
        setModelCategory("custom")
        setUploadedFiles([])
        setExtraComponents([])
        setSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("❌ Failed to upload model:", error)
      setErrors([`Failed to save model: ${error}`])
    } finally {
      setIsUploading(false)
    }
  }, [modelName, modelDescription, modelCategory, uploadedFiles, extraComponents, onUploadComplete])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Upload New Stair Model
        </CardTitle>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="modelCategory">Category</Label>
              <Button variant="ghost" size="sm" onClick={openAddCategoryDialog} disabled={isUploading}>
                <Plus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            </div>
            <CategorySelect
              value={modelCategory}
              onValueChange={setModelCategory}
              categories={categories}
              onAddCategory={openAddCategoryDialog}
              onDeleteCategory={handleDeleteCategory}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <Label className="text-base font-medium">Model Components</Label>
          </div>

          {/* Core Components */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Core Components</div>
            <div className="grid gap-4">
              {componentTypes.map((componentType) => {
                const uploadedFile = uploadedFiles.find((f) => f.component === componentType.id)

                return (
                  <div key={componentType.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{componentType.name}</Label>
                        {componentType.required && <Badge variant="destructive">Required</Badge>}
                      </div>
                      {uploadedFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(componentType.id)}
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
                                onChange={(e) => handleFileUpload(e.target.files, componentType.id)}
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
                <Upload className="w-4 h-4 mr-1" />
                Add Component
              </Button>
            </div>

            {extraComponents.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-lg">
                No extra components added. Click "Add Component" to add railings or other parts.
              </div>
            ) : (
              <div className="grid gap-4">
                {extraComponents.map((extraComp) => {
                  const uploadedFile = uploadedFiles.find((f) => f.component === extraComp.id)

                  return (
                    <div key={extraComp.id} className="border rounded-lg p-4 bg-blue-50/30">
                      <div className="space-y-3">
                        {/* Component Name Input */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Component name (e.g., Left Railing, Right Railing)"
                            value={extraComp.name}
                            onChange={(e) => updateExtraComponentName(extraComp.id, e.target.value)}
                            disabled={isUploading}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExtraComponent(extraComp.id)}
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* File Upload */}
                        {uploadedFile ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>{uploadedFile.file.name}</span>
                            <Badge variant="outline">{(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB</Badge>
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
            <AlertDescription className="text-green-800">
              Model uploaded successfully! You can now use it in the stair builder.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSubmit} disabled={isUploading || uploadedFiles.length === 0} className="flex-1">
            {isUploading ? "Uploading..." : "Upload Model"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
          )}
        </div>

        {/* Upload Guidelines */}
        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
          <p className="font-medium">Upload Guidelines:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Only GLTF (.gltf) and GLB (.glb) files are supported</li>
            <li>Maximum file size per component: 10MB</li>
            <li>Step component is required, others are optional</li>
            <li>Models should be properly scaled and positioned</li>
            <li>Textures should be embedded or use standard material names</li>
          </ul>
        </div>
      </CardContent>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category name."
                : "Create a new category for organizing your stair models."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingCategory && (
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category ID *</Label>
                <Input
                  id="categoryId"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="e.g., modern-spiral"
                  disabled={!!editingCategory}
                />
                <p className="text-xs text-gray-500">Use lowercase letters, numbers, and hyphens only</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Modern Spiral"
              />
            </div>

            {categoryError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{categoryError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
