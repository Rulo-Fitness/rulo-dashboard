"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DASHBOARD_PLANS } from "@/lib/plans"
import {
  Mic, Camera, BarChart3, TrendingUp, Bell, Target,
  Activity, Calendar, Zap, Smartphone, Lock, ArrowRight, Check,
} from "lucide-react"

const PLAN_CARD_WIDTH_MOBILE = 280
const PLAN_GAP = 24

const plans = DASHBOARD_PLANS

const allFeatures = [
  { icon: Mic, label: "Voice-to-Data ilimitado" },
  { icon: Camera, label: "Snapshot Nutrition" },
  { icon: BarChart3, label: "Dashboard de métricas" },
  { icon: TrendingUp, label: "Progresión automática" },
  { icon: Bell, label: "Nudging inteligente" },
  { icon: Target, label: "Heatmap de consistencia" },
  { icon: Activity, label: "Análisis de volumen" },
  { icon: Calendar, label: "Historial completo" },
  { icon: Zap, label: "Correcciones por voz" },
  { icon: Smartphone, label: "App móvil" },
  { icon: Lock, label: "Exportación de datos" },
]

export default function CheckoutPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [hoveredPlanIndex, setHoveredPlanIndex] = useState<number | null>(null)
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1)
  const [loadingPlan, setLoadingPlan] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [loadingTrial, setLoadingTrial] = useState(false)
  const plansScrollRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { user, updateUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const activePlan = isMobile ? selectedPlanIndex : (hoveredPlanIndex ?? selectedPlanIndex)
  const mobileCardWidth = PLAN_CARD_WIDTH_MOBILE + PLAN_GAP

  const getSelectedIndexFromScroll = (el: HTMLDivElement) => {
    const index = Math.round(el.scrollLeft / mobileCardWidth)
    return Math.max(0, Math.min(2, index))
  }

  useEffect(() => {
    if (!isMobile) return
    const el = plansScrollRef.current
    if (!el) return
    const scrollToCenter = (index: number) => {
      el.scrollLeft = index * mobileCardWidth
    }
    const run = () => {
      scrollToCenter(1)
      setSelectedPlanIndex(1)
    }
    run()
    requestAnimationFrame(run)
  }, [isMobile, mobileCardWidth])

  useEffect(() => {
    const el = plansScrollRef.current
    if (!el) return
    const onScroll = () => setSelectedPlanIndex(getSelectedIndexFromScroll(el))
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollToPlan = (index: number) => {
    const el = plansScrollRef.current
    if (!el) return
    el.scrollTo({ left: index * mobileCardWidth, behavior: "smooth" })
  }

  async function handleCheckout(planIndex: number) {
    if (!user) {
      router.push("/sign-in")
      return
    }
    setLoadingPlan(planIndex)
    setError("")
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, plan: plans[planIndex].name }),
      })
      const data = await res.json()
      if (!res.ok || !data.init_point) {
        setError(data.error ?? "Error al iniciar el pago")
        setLoadingPlan(null)
        return
      }
      window.location.href = data.init_point
    } catch {
      setError("Error de conexión")
      setLoadingPlan(null)
    }
  }

  async function handleTrialActivation() {
    if (!user) {
      router.push("/sign-in")
      return
    }
    setLoadingTrial(true)
    setError("")
    try {
      const res = await fetch("/api/auth/activate-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (data.success) {
        updateUser({
          subscription_active_until: data.result.subscription_active_until,
          current_plan: data.result.current_plan,
          trial_used: true,
        })
        router.push("/trial-activated")
      } else {
        setError(data.errors?.[0]?.message ?? "Error activando prueba gratuita")
      }
    } catch {
      setError("Error de conexión")
    }
    setLoadingTrial(false)
  }

  const particles = [
    { bottom: "18%", right: "12%", size: 4, anim: "particle-float-1", dur: "4s", delay: "0s" },
    { bottom: "35%", right: "22%", size: 3, anim: "particle-float-2", dur: "5s", delay: "0.8s" },
    { bottom: "55%", right: "8%", size: 5, anim: "particle-float-3", dur: "6s", delay: "1.5s" },
    { bottom: "25%", left: "15%", size: 3, anim: "particle-float-1", dur: "5.5s", delay: "2s" },
    { bottom: "45%", left: "8%", size: 4, anim: "particle-float-2", dur: "4.5s", delay: "0.5s" },
  ]

  const mobileParticles = [
    { bottom: "18%", right: "12%", size: 3, anim: "particle-float-1", dur: "4s", delay: "0s" },
    { bottom: "40%", right: "20%", size: 2, anim: "particle-float-2", dur: "5s", delay: "0.8s" },
    { bottom: "55%", right: "8%", size: 4, anim: "particle-float-3", dur: "6s", delay: "1.5s" },
    { bottom: "30%", left: "12%", size: 3, anim: "particle-float-1", dur: "5.5s", delay: "2s" },
  ]

  function renderParticles(plan: typeof plans[number], isMobileCard: boolean) {
    const pts = isMobileCard ? mobileParticles : particles
    return pts.map((p, j) => (
      <div key={j} className="absolute rounded-full pointer-events-none" style={{
        bottom: p.bottom, right: "right" in p ? p.right : undefined, left: "left" in p ? p.left : undefined,
        width: p.size, height: p.size,
        background: plan.glow.replace("0.25", "0.6"),
        animation: `${p.anim} ${p.dur} ease-in-out ${p.delay} infinite`,
        boxShadow: `0 0 ${p.size * 2}px ${plan.glow.replace("0.25", "0.4")}`,
      }} />
    ))
  }

  function renderPlanCard(plan: typeof plans[number], i: number, mobile: boolean) {
    const isLoading = loadingPlan === i
    return (
      <div
        key={i}
        onMouseEnter={!mobile ? () => setHoveredPlanIndex(i) : undefined}
        onMouseLeave={!mobile ? () => setHoveredPlanIndex(null) : undefined}
        className={`relative rounded-3xl overflow-hidden transition-all duration-300 flex flex-col
          ${!mobile ? "hover:scale-[1.02] hover:z-10" : ""}
          ${plan.popular
            ? `bg-slate-800/60 ${!mobile ? "-mt-6 min-h-[430px]" : ""} border-trail-card shadow-lg shadow-[#FF6B00]/15`
            : `bg-slate-800/60 ${!mobile ? "min-h-[380px]" : ""}`
          }`}
      >
        {plan.popular && (
          <div className="w-full text-center py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#CC5500]">
            <span className="text-white text-xs font-bold uppercase tracking-wider">MÁS POPULAR</span>
          </div>
        )}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ background: plan.glow }} />
        {renderParticles(plan, mobile)}
        <div className="flex flex-col flex-1 justify-between p-7 relative z-[1]">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
            <img src={plan.image} alt="" loading="lazy" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-white">
                ${(isAnnual ? Math.round(plan.price * 0.9) : plan.price).toLocaleString("es-AR")}
              </span>
              <span className="text-slate-400 text-sm">/mes</span>
            </div>
            {isAnnual && <p className="text-xs text-slate-500 line-through">${plan.price.toLocaleString("es-AR")}/mes</p>}
            {!isAnnual && <p className="text-xs text-slate-500 line-through">${plan.originalPrice.toLocaleString("es-AR")}/mes</p>}
          </div>
          <p className="text-sm text-slate-400">{plan.desc}</p>
          <button
            onClick={() => handleCheckout(i)}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 ${
              plan.popular
                ? "bg-gradient-to-r from-[#FF6B00] to-[#CC5500] text-white shadow-lg shadow-[#FF6B00]/30 hover:shadow-xl hover:shadow-[#FF6B00]/40 border border-[#FF6B00]/30"
                : "bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 border border-white/20"
            }`}
          >
            {isLoading ? "Redirigiendo..." : "Suscribirse"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-dvh relative overflow-hidden bg-slate-900">
      {/* Space Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/space-bg.webp)" }}
      />
      <div className="absolute inset-0 bg-slate-900/80" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Tu progreso, <span className="checkout-text-gradient-orange">tu plan</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-xl mx-auto">
            Elegí cómo querés que Rulo te ayude a romperla en el gimnasio.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10 md:mb-12">
          <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center border border-white/10 overflow-hidden">
            <div
              className={`absolute top-0 bottom-0 bg-slate-600 transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${isAnnual ? "left-[48%] w-[52%] rounded-r-full" : "left-0 w-[48%] rounded-l-full"}`}
            />
            <button
              onClick={() => setIsAnnual(false)}
              className="relative z-10 flex-1 px-6 py-2.5 text-sm font-medium transition-colors hover:text-white"
              style={{ color: !isAnnual ? "white" : "#94a3b8" }}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className="relative z-10 flex-1 px-6 py-2.5 text-sm font-medium transition-colors hover:text-white flex items-center justify-center gap-2"
              style={{ color: isAnnual ? "white" : "#94a3b8" }}
            >
              Anual
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">-10%</span>
            </button>
          </div>
        </div>

        {/* Trial banner */}
        {user && !user.trial_used && (
          <div className="max-w-md mx-auto mb-10 md:mb-12">
            <div className="relative rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm p-6 text-center">
              <h3 className="text-lg font-bold text-white mb-2">Probá Rulo 7 días gratis</h3>
              <p className="text-sm text-slate-300 mb-4">Sin tarjeta de crédito. Acceso completo a todas las funciones.</p>
              <button
                onClick={handleTrialActivation}
                disabled={loadingTrial}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-green-500 text-white hover:bg-green-400 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 shadow-lg shadow-green-500/30"
              >
                {loadingTrial ? "Activando..." : "Empezar prueba gratis"}
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop: grid de 3 planes */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, i) => renderPlanCard(plan, i, false))}
        </div>

        {/* Mobile: carrusel */}
        <div className="md:hidden -mx-4 w-[calc(100%+2rem)] min-w-0 overflow-visible">
          <div
            ref={plansScrollRef}
            className="flex gap-6 overflow-x-auto overflow-y-visible pb-4 snap-x snap-mandatory scroll-smooth pl-[calc(50%-140px)] pr-[calc(50%-140px)]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`min-w-[280px] w-[280px] min-h-[400px] shrink-0 snap-center transition-transform duration-300 ${i !== selectedPlanIndex ? "translate-y-4" : ""}`}
              >
                {renderPlanCard(plan, i, true)}
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {plans.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToPlan(i)}
                aria-label={`Ir al plan ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === selectedPlanIndex
                    ? "w-8 h-3 bg-white"
                    : "w-3 h-3 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-md mx-auto mt-6">
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-center text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Guarantee */}
        <div className="text-center max-md:mt-10 mb-12">
          <p className="text-green-400 text-sm inline-flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full">
            <Check className="w-4 h-4" />
            Cancelá cuando quieras. Sin permanencia.
          </p>
        </div>

        {/* Features Grid */}
        <div className="text-center mb-8">
          <p className="text-white text-lg transition-all duration-300">
            Todo lo que desbloqueás con{" "}
            <span className="checkout-text-gradient-orange font-bold">
              {plans[activePlan].name}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 pb-8">
          {allFeatures.map((feature, i) => {
            const included = plans[activePlan].featureIndices.includes(i)
            const Icon = feature.icon
            return (
              <div
                key={i}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 text-center transition-all duration-300 ${
                  included ? "opacity-100 scale-100" : "opacity-35 scale-95"
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${included ? "text-[#FF6B00]" : "text-slate-500"}`} />
                <p className={`text-xs ${included ? "text-slate-300" : "text-slate-500"}`}>{feature.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
