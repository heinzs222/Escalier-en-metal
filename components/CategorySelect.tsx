"use client"

import type React from "react"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getAllCategories,
  addCustomCategory,
  deleteCustomCategory,
  generateCategoryId,
  type Category,
} from "@/lib/categories"

interface CategorySelectProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function CategorySelect({ value, onValueChange, disabled }: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [showAddNew, setShowAddNew] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>(getAllCategories())

  const selectedCategory = categories.find((cat) => cat.id === value)

  const refreshCategories = () => {
    setCategories(getAllCategories())
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setError("Category name is required")
      return
    }

    try {
      const categoryId = generateCategoryId(newCategoryName)
      addCustomCategory({
        id: categoryId,
        name: newCategoryName.trim(),
        description: `Custom ${newCategoryName.trim()} category`,
        type: "stair",
      })

      refreshCategories()
      onValueChange(categoryId)
      setNewCategoryName("")
      setShowAddNew(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category")
    }
  }

  const handleDeleteCategory = (categoryId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      deleteCustomCategory(categoryId)
      refreshCategories()

      // If the deleted category was selected, reset to default
      if (value === categoryId) {
        onValueChange("custom")
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="category"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
            disabled={disabled}
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                <span>{selectedCategory.name}</span>
                {selectedCategory.isCustom && (
                  <Badge variant="secondary" className="text-xs">
                    Custom
                  </Badge>
                )}
              </div>
            ) : (
              "Select category..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === category.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex items-center justify-between flex-1">
                      <div className="flex items-center gap-2">
                        <span>{category.name}</span>
                        {category.isCustom && (
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        )}
                      </div>
                      {category.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-red-100"
                          onMouseDown={(e) => handleDeleteCategory(category.id, e)}
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-2">
              {showAddNew ? (
                <div className="space-y-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddCategory()
                      } else if (e.key === "Escape") {
                        setShowAddNew(false)
                        setNewCategoryName("")
                        setError(null)
                      }
                    }}
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddCategory} className="flex-1">
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddNew(false)
                        setNewCategoryName("")
                        setError(null)
                      }}
                      className="flex-1 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => setShowAddNew(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              )}
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedCategory?.description && <p className="text-xs text-gray-500">{selectedCategory.description}</p>}
    </div>
  )
}
