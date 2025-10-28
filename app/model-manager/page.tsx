"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Edit2, Trash2, Plus, AlertCircle, ArrowLeft } from "lucide-react"
import { getAllModels, deleteModel, type ModelConfiguration } from "@/lib/models"
import { ModelUploader } from "@/components/ModelUploader"
import { ModelEditor } from "@/components/ModelEditor"

export default function ModelManagerPage() {
  const [models, setModels] = useState<ModelConfiguration[]>([])
  const [view, setView] = useState<"list" | "add" | "edit">("list")
  const [selectedModel, setSelectedModel] = useState<ModelConfiguration | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    refreshModels()
  }, [])

  const refreshModels = () => {
    setModels(getAllModels())
  }

  const handleEditModel = (model: ModelConfiguration) => {
    setSelectedModel(model)
    setView("edit")
    setError(null)
  }

  const handleDeleteModel = (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) {
      return
    }

    try {
      deleteModel(modelId)
      refreshModels()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete model")
    }
  }

  const handleSaveComplete = () => {
    refreshModels()
    setView("list")
    setSelectedModel(null)
  }

  const handleCancel = () => {
    setView("list")
    setSelectedModel(null)
    setError(null)
  }

  if (view === "add") {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Models
          </Button>
        </div>
        <ModelUploader
          onUploadComplete={() => {
            refreshModels()
            setView("list")
          }}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  if (view === "edit" && selectedModel) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <ModelEditor model={selectedModel} onSaveComplete={handleSaveComplete} onCancel={handleCancel} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Model Manager</h1>
          <p className="text-gray-600">Manage your stair models and configurations</p>
        </div>
        <Button onClick={() => setView("add")}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Model
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {models.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Models Yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first stair model</p>
                <Button onClick={() => setView("add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Model
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          models.map((model) => (
            <Card key={model.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{model.name}</CardTitle>
                      <Badge variant="outline">{model.category}</Badge>
                      {!model.metadata.isCustom && (
                        <Badge variant="secondary" className="text-xs">
                          Built-in
                        </Badge>
                      )}
                    </div>
                    {model.description && <CardDescription>{model.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditModel(model)}>
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {model.metadata.isCustom && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteModel(model.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Components</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(model.components).map(([key, component]) => (
                        <Badge key={key} variant="secondary">
                          {component?.name || key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(model.metadata.createdAt).toLocaleDateString()}
                    {model.metadata.updatedAt &&
                      ` • Updated: ${new Date(model.metadata.updatedAt).toLocaleDateString()}`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
