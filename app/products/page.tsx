"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { loadModelConfiguration, createDefaultComponentSettings, saveStairConfiguration } from "@/lib/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { STORE_PRODUCTS, getStartPrice } from "@/lib/storeProducts"

const DEFAULT_CATEGORY = "Limon central"

export default function ProductsPage() {
  const router = useRouter()
  const byCategory = useMemo(() => {
    const map = new Map<string, typeof STORE_PRODUCTS>()
    STORE_PRODUCTS.forEach((p) => {
      const arr = map.get(p.category) || []
      arr.push(p as any)
      map.set(p.category, arr)
    })
    return Array.from(map.entries())
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n)

  const PRODUCT_TO_MODEL: Record<string, string> = {
    p1: "limon-central-droit-droit",
    p2: "limon-central-droit-droit",
    p3: "limon-central-droit-droit",
    p4: "limon-central-droit-droit",
  }

  const handleSelectProduct = (pid: string) => {
    const modelId = PRODUCT_TO_MODEL[pid]
    if (!modelId) return
    const model = loadModelConfiguration(modelId)
    if (!model) return

    const textures: Record<string, string> = {}
    Object.entries(model.componentTextures || {}).forEach(([k, v]) => {
      if (typeof v === "string" && v.length > 0) textures[k] = v
    })

    const configToSave = {
      modelId: model.id,
      globalScale: model.defaultSettings?.globalScale || 0.01,
      globalArrayMultiplier: 1.0,
      componentSettings: createDefaultComponentSettings(model),
      componentTextures: textures,
      selectedAngleType: "middle" as const,
      selectedBottomAngle: "none" as const,
      selectedTopAngle: "none" as const,
    }

    saveStairConfiguration(configToSave)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Produits</h1>
          <p className="text-slate-600">Choisissez un produit pour commencer la configuration</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-10">
        {byCategory.filter(([category]) => category === DEFAULT_CATEGORY).map(([category, products]) => (
          <section key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{category}</h2>
              <Badge variant="secondary">{products.length} items</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <Card key={p.id} className="flex flex-col overflow-hidden">
                  <div className="p-4 pb-0">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-md border bg-slate-100">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <div className="text-xs text-slate-500 mt-1">{category}</div>
                      </div>
                      <Badge>{p.unit || ""}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700">
                        <span className="text-slate-500 text-xs mr-2">À PARTIR DE</span>
                        <strong>{fmt(getStartPrice(p))}</strong>
                      </div>
                      <Button onClick={() => handleSelectProduct(p.id)} disabled={!PRODUCT_TO_MODEL[p.id]}>Sélectionner</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
