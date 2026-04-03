export type DashboardPlan = {
  name: string
  price: number
  originalPrice: number
  desc: string
  highlights: string[]
  featureIndices: number[]
  popular: boolean
  image: string
  glow: string
}

export const DASHBOARD_PLANS: DashboardPlan[] = [
  {
    name: "Máquina",
    price: 4999,
    originalPrice: 5999,
    desc: "Para arrancar a trackear sin excusas.",
    highlights: ["Registro por voz", "Historial de entrenos", "Correcciones por chat"],
    featureIndices: [0, 6, 8, 9],
    popular: false,
    image: "/images/rulo-maquina.webp",
    glow: "rgba(56, 189, 248, 0.25)",
  },
  {
    name: "Fiera",
    price: 9999,
    originalPrice: 10999,
    desc: "Todo lo que necesitás para progresar en serio.",
    highlights: ["Todo de Máquina", "Foto → macros", "Dashboard completo", "Nudging inteligente", "Progresión automática"],
    featureIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    popular: true,
    image: "/images/rulo-fiera.webp",
    glow: "rgba(59, 130, 246, 0.25)",
  },
  {
    name: "Bestia",
    price: 19999,
    originalPrice: 21999,
    desc: "Para los que van por todo. Sin límites.",
    highlights: ["Todo de Fiera", "Análisis avanzado", "Export PDF/CSV", "Soporte prioritario"],
    featureIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    popular: false,
    image: "/images/rulo-bestia.webp",
    glow: "rgba(234, 179, 8, 0.25)",
  },
]

export const CHEAPEST_DASHBOARD_PLAN =
  DASHBOARD_PLANS.reduce((cheapest, plan) => (plan.price < cheapest.price ? plan : cheapest), DASHBOARD_PLANS[0])

export function formatPlanPrice(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function normalizePlanName(planName: string | null | undefined) {
  if (!planName) return null
  const normalized = planName.trim().toLowerCase()
  const knownPlan = DASHBOARD_PLANS.find((plan) => plan.name.toLowerCase() === normalized)
  return knownPlan?.name ?? planName.trim()
}

export function getDashboardPlanByName(planName: string | null | undefined) {
  const normalized = normalizePlanName(planName)
  if (!normalized) return null
  return DASHBOARD_PLANS.find((plan) => plan.name === normalized) ?? null
}
