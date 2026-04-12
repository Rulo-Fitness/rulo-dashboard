export type DashboardPlan = {
  name: string
  price: number
  originalPrice: number
  descKey: string
  highlightKeys: string[]
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
    descKey: "plan.fiera.desc",
    highlightKeys: [
      "plan.fiera.h1",
      "plan.fiera.h2",
      "plan.fiera.h3",
      "plan.fiera.h4",
      "plan.fiera.h5",
      "plan.fiera.h6",
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
    descKey: "plan.bestia.desc",
    highlightKeys: [
      "plan.bestia.h1",
      "plan.bestia.h2",
      "plan.bestia.h3",
      "plan.bestia.h4",
      "plan.bestia.h5",
      "plan.bestia.h6",
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
  if (normalized === "free_trial" || normalized === "prueba gratis") return "free_trial"
  const knownPlan = DASHBOARD_PLANS.find((plan) => plan.name.toLowerCase() === normalized)
  return knownPlan?.name ?? planName.trim()
}

export function displayPlanName(planName: string | null | undefined, t: (key: string) => string) {
  const normalized = normalizePlanName(planName)
  if (!normalized) return null
  if (normalized === "free_trial") return t("subscription.trialName")
  return normalized
}

export function getDashboardPlanByName(planName: string | null | undefined) {
  const normalized = normalizePlanName(planName)
  if (!normalized) return null
  return DASHBOARD_PLANS.find((plan) => plan.name === normalized) ?? null
}
