export type Unit = "/marche" | "/pied linéaire" | undefined

export interface StoreProduct {
  id: string
  name: string
  category: string
  base_price: number
  image: string
  images: string[]
  unit?: Unit
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "p1",
    name: "Limon central - Tube 45 degrés",
    category: "Limon central",
    base_price: 1115,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc2f80c1c5c6b2bf6a852.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc2f80c1c5c6b2bf6a852.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc2f82c36679195be6f88.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc2f80c1c5c5121f6a850.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc2f80c1c5c182ef6a851.webp",
    ],
  },
  {
    id: "p2",
    name: "Limon central - Flatbar 45 degrés",
    category: "Limon central",
    base_price: 965,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc35d588b864ea872d075.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc35d588b864ea872d075.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc35d10035f3fd5a079f7.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc35dd79817a46c3ede74.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc35d2c3667a93dbe7cdf.webp",
    ],
  },
  {
    id: "p3",
    name: "Limon central - Tube Droit",
    category: "Limon central",
    base_price: 575,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc3ca0c1c5cb198f6c920.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc3ca0c1c5cb198f6c920.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc3ca588b866f9372dd33.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc3ca2c3667494ebe8ac9.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc3ca588b86596572dd37.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc3ca0c1c5c8d02f6c91f.webp",
    ],
  },
  {
    id: "p4",
    name: "Limon central - Flat Bar Droit",
    category: "Limon central",
    base_price: 800,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc455d798172f2a3f010f.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc455d798172f2a3f010f.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc455d79817fcef3f010e.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc45510035f2fb1a09bc9.webp",
    ],
  },
  {
    id: "p5",
    name: "Limon Latéraux - Tubes",
    category: "Double limon",
    base_price: 1450,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc4e7588b867768730683.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc4e7588b867768730683.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc4e72c3667240ebeb3dd.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc4e7d7981776c63f1501.webp",
    ],
  },
  {
    id: "p6",
    name: "Limon Latéraux - C Channel",
    category: "Double limon",
    base_price: 1650,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc54510035f3652a0b8a6.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc54510035f3652a0b8a6.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc545d79817b2633f2802.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc545588b868d7773164e.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc545d79817579a3f2801.webp",
    ],
  },
  {
    id: "p7",
    name: "Limon Latéraux - Flat Bar",
    category: "Double limon",
    base_price: 1850,
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc57bd7981702f93f2fb4.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc57bd7981702f93f2fb4.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc57b2c3667197ebec99e.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc57b588b860964731e1f.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68afc57b0c1c5c6fb1f70b46.webp",
    ],
  },
  {
    id: "p8",
    name: "Marches en Érable",
    category: "Marches",
    base_price: 120,
    unit: "/marche",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a01509ec256cb3937aab.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a01509ec256cb3937aab.webp",
    ],
  },
  {
    id: "p8b",
    name: "Marches en Chêne Rouge",
    category: "Marches",
    base_price: 130,
    unit: "/marche",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09f79621e110cb0672379.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09f79621e110cb0672379.webp",
    ],
  },
  {
    id: "p8c",
    name: "Marches en Noyer Noir",
    category: "Marches",
    base_price: 150,
    unit: "/marche",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09f8c66583932659e8c33.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09f8c66583932659e8c33.webp",
    ],
  },
  {
    id: "p8d",
    name: "Marches en Frêne",
    category: "Marches",
    base_price: 115,
    unit: "/marche",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09f9e588b867588991947.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09f9e588b867588991947.webp",
    ],
  },
  {
    id: "p8e",
    name: "Marches en Merisier",
    category: "Marches",
    base_price: 140,
    unit: "/marche",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09fad81867d28e2ec996f.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b09fad81867d28e2ec996f.webp",
    ],
  },
  {
    id: "p9",
    name: "Garde-corps - Tubes horizontaux",
    category: "Garde-corps",
    base_price: 200,
    unit: "/pied linéaire",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a068621e119eb567468e.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a068621e119eb567468e.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a068d7b73201405cf5fc.webp",
    ],
  },
  {
    id: "p10",
    name: "Garde-corps - Tubes verticaux",
    category: "Garde-corps",
    base_price: 230,
    unit: "/pied linéaire",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0856658390f919eb127.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0856658390f919eb127.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a08509ec2517fd9388bd.webp",
    ],
  },
  {
    id: "p11",
    name: "Garde-corps - Vertical 2up",
    category: "Garde-corps",
    base_price: 395,
    unit: "/pied linéaire",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0b30b7a45e622314b7f.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0b30b7a45e622314b7f.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0b381867d5f72ecbecf.webp",
    ],
  },
  {
    id: "p12",
    name: "Garde-corps - Horizontal Flatbar",
    category: "Garde-corps",
    base_price: 320,
    unit: "/pied linéaire",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0d10b7a455d873150c1.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0d10b7a455d873150c1.webp",
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0d181867d309fecc71f.webp",
    ],
  },
  {
    id: "p13",
    name: "Main courante - Acier",
    category: "Main courante",
    base_price: 60,
    unit: "/pied linéaire",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0ec0b7a4524813153f8.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0ec0b7a4524813153f8.webp",
    ],
  },
  {
    id: "p14",
    name: "Main courante - Acier avec bois",
    category: "Main courante",
    base_price: 195,
    unit: "/pied linéaire",
    image: "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0fd6997402bd96ea3dd.webp",
    images: [
      "https://storage.googleapis.com/msgsndr/sCtBisO8EbDycQc8Ce6b/media/68b0a0fd6997402bd96ea3dd.webp",
    ],
  },
]

export const PRICE_MATRIX: Record<string, Record<number, number>> = {
  p1: { 2: 1455, 3: 1696, 4: 1955, 5: 2156, 6: 2415, 7: 2760, 8: 3105, 9: 3508, 10: 3853, 11: 4255, 12: 4658, 13: 5060, 14: 5410, 15: 5760, 16: 6110, 17: 6460, 18: 6810, 19: 7160, 20: 7510 },
  p2: { 3: 980, 4: 1210, 5: 1323, 6: 1553, 7: 1725, 8: 2070, 9: 2415, 10: 2645, 11: 2990, 12: 3335, 13: 3738, 14: 4025, 15: 4375, 16: 4725, 17: 5075, 18: 5425, 19: 5775, 20: 6125 },
  p3: { 2: 1265, 3: 1475, 4: 1700, 5: 1875, 6: 2100, 7: 2400, 8: 2700, 9: 3050, 10: 3350, 11: 3700, 12: 4050, 13: 4400, 14: 4750, 15: 5100, 16: 5450, 17: 5800, 18: 6150, 19: 6500, 20: 6850 },
  p4: { 2: 850, 3: 1050, 4: 1150, 5: 1350, 6: 1500, 7: 1800, 8: 2100, 9: 2300, 10: 2600, 11: 2900, 12: 3250, 13: 3500, 14: 3850, 15: 4200, 16: 4550, 17: 4900, 18: 5250, 19: 5600, 20: 5950 },
  p5: { 2: 1025, 3: 1150, 4: 1275, 5: 1475, 6: 1675, 7: 1875, 8: 2075, 9: 2550, 10: 2750, 11: 2950, 12: 3150, 13: 3350 },
  p6: { 2: 750, 3: 875, 4: 1000, 5: 1200, 6: 1400, 7: 1600, 8: 1800, 9: 2000, 10: 2200, 11: 2400, 12: 2600, 13: 2800 },
  p7: { 2: 750, 3: 875, 4: 1000, 5: 1200, 6: 1400, 7: 1600, 8: 1800, 9: 2000, 10: 2200, 11: 2400, 12: 2600, 13: 2800 },
}

export const MARCHES_UNIT_PRICE: Record<string, Record<string, number>> = {
  p8: { "1_1_16": 93, "1_3_4": 107, 2: 127 as any, "2_1_2": 146, 3: 176 as any },
  p8b: { "1_1_16": 93, "1_3_4": 107, 2: 127 as any, "2_1_2": 146, 3: 166 as any },
  p8c: { "1_1_16": 122, "1_3_4": 176, 2: 215 as any, "2_1_2": 244, 3: 271 as any },
  p8d: { "1_1_16": 93, "1_3_4": 107, 2: 127 as any, "2_1_2": 146, 3: 176 as any },
  p8e: { "1_1_16": 93, "1_3_4": 107, 2: 127 as any, "2_1_2": 146, 3: 176 as any },
}

export const RAMPES_PRICES: Record<string, Record<string, number>> = {
  p9: { metal_1x3: 200, metal_1_5sq: 200, bois_chene_blanc: 245, bois_chene_rouge: 230, bois_frene: 230, bois_erable_sucre: 230, bois_erable_ambrosia: 230, bois_merisier: 230, bois_noyer_noir: 255 },
  p10: { metal_1x3: 230, metal_1_5sq: 230, bois_chene_blanc: 275, bois_chene_rouge: 260, bois_frene: 260, bois_erable_sucre: 250, bois_erable_ambrosia: 260, bois_merisier: 260, bois_noyer_noir: 285 },
  p11: { metal_1x3: 395, metal_1_5sq: 395, bois_chene_blanc: 440, bois_chene_rouge: 425, bois_frene: 425, bois_erable_sucre: 415, bois_erable_ambrosia: 425, bois_merisier: 425, bois_noyer_noir: 440 },
  p12: { metal_1x3: 320, metal_1_5sq: 320, bois_chene_blanc: 365, bois_chene_rouge: 350, bois_frene: 350, bois_erable_sucre: 340, bois_erable_ambrosia: 350, bois_merisier: 350, bois_noyer_noir: 365 },
}

export const MAIN_COURANTE_ONLY: Record<string, Record<string, number>> = {
  p13: { metal_1x3: 60, metal_1_5sq: 60, bois_chene_blanc: 90, bois_chene_rouge: 85, bois_frene: 85, bois_erable_sucre: 85, bois_erable_ambrosia: 85, bois_merisier: 85, bois_noyer_noir: 95 },
  p14: { metal_1x3: 60, metal_1_5sq: 60, bois_chene_blanc: 90, bois_chene_rouge: 85, bois_frene: 85, bois_erable_sucre: 85, bois_erable_ambrosia: 85, bois_merisier: 85, bois_noyer_noir: 95 },
}

export function getStartPrice(p: StoreProduct): number {
  const matrix = PRICE_MATRIX[p.id]
  if (matrix) {
    let min = Infinity
    Object.values(matrix).forEach(v => { if (v < min) min = v })
    return isFinite(min) ? min : p.base_price || 0
  }
  if (p.unit === "/marche") {
    const t = MARCHES_UNIT_PRICE[p.id]
    if (t) {
      const vals = Object.values(t).filter(v => Number.isFinite(v)) as number[]
      return Math.min(...vals)
    }
    return p.base_price || 0
  }
  if (p.unit === "/pied linéaire") {
    const candidates: number[] = []
    if (RAMPES_PRICES[p.id]) {
      Object.values(RAMPES_PRICES[p.id]).forEach(v => candidates.push(v))
    }
    if (MAIN_COURANTE_ONLY[p.id]) {
      Object.values(MAIN_COURANTE_ONLY[p.id]).forEach(v => candidates.push(v))
    }
    if (candidates.length) return Math.min(...candidates)
    return p.base_price || 0
  }
  return p.base_price || 0
}
