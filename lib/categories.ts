export interface Category {
  id: string
  name: string
  description: string
  type: "stair" | "component" | "accessory"
  isCustom: boolean
  createdAt?: Date
}

// Built-in categories
const BUILT_IN_CATEGORIES: Category[] = [
  {
    id: "central-stringer",
    name: "Central Stringer",
    description: "Stairs with a central support beam",
    type: "stair",
    isCustom: false,
  },
  {
    id: "side-stringer",
    name: "Side Stringer",
    description: "Stairs with side support beams",
    type: "stair",
    isCustom: false,
  },
  {
    id: "spiral",
    name: "Spiral",
    description: "Spiral staircases",
    type: "stair",
    isCustom: false,
  },
  {
    id: "floating",
    name: "Floating",
    description: "Floating stairs with hidden support",
    type: "stair",
    isCustom: false,
  },
]

// Storage key
const CUSTOM_CATEGORIES_KEY = "customCategories"

// Get custom categories from localStorage
export function getCustomCategories(): Category[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY)
    if (!stored) return []

    const categories = JSON.parse(stored) as Category[]
    return categories.map((cat) => ({
      ...cat,
      createdAt: cat.createdAt ? new Date(cat.createdAt) : undefined,
    }))
  } catch (error) {
    console.error("Failed to load custom categories:", error)
    return []
  }
}

// Get all categories (built-in + custom)
export function getAllCategories(): Category[] {
  const customCategories = getCustomCategories()
  return [...BUILT_IN_CATEGORIES, ...customCategories]
}

// Alias for getAllCategories
export function getCategories(): Category[] {
  return getAllCategories()
}

// Get categories by type
export function getCategoriesByType(type: "stair" | "component" | "accessory"): Category[] {
  return getAllCategories().filter((cat) => cat.type === type)
}

// Get category by ID
export function getCategoryById(categoryId: string): Category | undefined {
  return getAllCategories().find((cat) => cat.id === categoryId)
}

// Check if category exists
export function categoryExists(categoryId: string): boolean {
  return getAllCategories().some((cat) => cat.id === categoryId)
}

// Check if category is built-in
export function isBuiltInCategory(categoryId: string): boolean {
  return BUILT_IN_CATEGORIES.some((cat) => cat.id === categoryId)
}

// Add custom category
export function addCategory(category: Omit<Category, "isCustom" | "createdAt">): boolean {
  if (typeof window === "undefined") return false

  try {
    // Check if category with same ID already exists
    if (categoryExists(category.id)) {
      console.error(`Category with id "${category.id}" already exists`)
      return false
    }

    const customCategories = getCustomCategories()
    const newCategory: Category = {
      ...category,
      isCustom: true,
      createdAt: new Date(),
    }

    customCategories.push(newCategory)
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories))
    console.log(`✅ Added category: ${category.name}`)
    return true
  } catch (error) {
    console.error("Failed to add category:", error)
    return false
  }
}

// Alias for addCategory
export function addCustomCategory(category: Omit<Category, "isCustom" | "createdAt">): boolean {
  return addCategory(category)
}

// Update category
export function updateCategory(categoryId: string, updates: Partial<Omit<Category, "id" | "isCustom">>): boolean {
  if (typeof window === "undefined") return false

  try {
    const category = getCategoryById(categoryId)

    if (!category) {
      console.error(`Category not found: ${categoryId}`)
      return false
    }

    if (!category.isCustom) {
      console.error(`Cannot update built-in category: ${categoryId}`)
      return false
    }

    const customCategories = getCustomCategories()
    const categoryIndex = customCategories.findIndex((cat) => cat.id === categoryId)

    if (categoryIndex === -1) {
      console.error(`Category not found: ${categoryId}`)
      return false
    }

    customCategories[categoryIndex] = {
      ...customCategories[categoryIndex],
      ...updates,
    }

    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories))
    console.log(`✅ Updated category: ${categoryId}`)
    return true
  } catch (error) {
    console.error("Failed to update category:", error)
    return false
  }
}

// Alias for updateCategory
export function updateCustomCategory(categoryId: string, updates: Partial<Omit<Category, "id" | "isCustom">>): boolean {
  return updateCategory(categoryId, updates)
}

// Delete category
export function deleteCategory(categoryId: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const category = getCategoryById(categoryId)

    if (!category) {
      console.error(`Category not found: ${categoryId}`)
      return false
    }

    if (!category.isCustom) {
      console.error(`Cannot delete built-in category: ${categoryId}`)
      return false
    }

    const customCategories = getCustomCategories()
    const filtered = customCategories.filter((cat) => cat.id !== categoryId)

    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(filtered))
    console.log(`🗑️ Deleted category: ${categoryId}`)
    return true
  } catch (error) {
    console.error("Failed to delete category:", error)
    return false
  }
}

// Alias for deleteCategory
export function deleteCustomCategory(categoryId: string): boolean {
  return deleteCategory(categoryId)
}

// Generate category ID from name
export function generateCategoryId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// Clear all custom categories
export function clearAllCustomCategories(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(CUSTOM_CATEGORIES_KEY)
    console.log("🧹 Cleared all custom categories")
  } catch (error) {
    console.error("Failed to clear custom categories:", error)
  }
}

// Get category options for select dropdowns
export function getCategoryOptions(): Array<{ value: string; label: string }> {
  return getAllCategories().map((cat) => ({
    value: cat.id,
    label: cat.name,
  }))
}

// Validate category
export function validateCategory(category: Partial<Category>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!category.id) {
    errors.push("Category ID is required")
  } else if (!/^[a-z0-9-]+$/.test(category.id)) {
    errors.push("Category ID must contain only lowercase letters, numbers, and hyphens")
  }

  if (!category.name || category.name.trim().length === 0) {
    errors.push("Category name is required")
  }

  if (!category.type) {
    errors.push("Category type is required")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
