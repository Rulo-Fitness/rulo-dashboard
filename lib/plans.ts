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
    name: "Fiera",
    price: 4999,
    originalPrice: 5999,
    desc: "Para arrancar a trackear en serio.",
    highlights: [
      "Registro de entrenamiento por voz",
      "Historial completo de entrenos",
      "Gráfico de progreso por ejercicio",
      "Dashboard de entrenamiento",
      "Mensajes ilimitados por día",
      "Soporte prioritario",
    ],
    featureIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    popular: false,
    image: "/images/rulo-fiera.webp",
    glow: "rgba(59, 130, 246, 0.25)",
  },
  {
    name: "Bestia",
    price: 6999,
    originalPrice: 8999,
    desc: "Para los que van por todo. Sin límites.",
    highlights: [
      "Todo lo de Fiera",
      "Foto de comida → macros calculados",
      "Foto de menú → calorías (próximamente)",
      "Balance calorías vs. objetivo del día",
      "Dashboard de nutrición",
      "Recap semanal por WhatsApp (lunes)",
    ],
    featureIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    popular: true,
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
