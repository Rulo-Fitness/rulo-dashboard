"use client"

import { useEffect, useState } from "react"
import {
  getTodayMeals,
  getTodayString,
  getExercisesForDate,
  getMeals,
  getProfile,
  getWeekSessions,
  getWeekMeals,
} from "@/lib/storage"
import { useI18n } from "@/lib/i18n"
import { Dumbbell, Flame, UtensilsCrossed, Plus, Check, Circle, X, Target, Smartphone, MessageCircle, Share, Mic, Camera, BarChart3, TrendingUp, Bell, Activity, Calendar, Zap, Lock } from "lucide-react"

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function getWeekDates(centerDate: string): string[] {
  const d = new Date(centerDate + "T12:00:00")
  const daysFromMonday = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  const out: string[] = []
  for (let i = 0; i < 6; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    out.push(day.toISOString().split("T")[0])
  }
  return out
}

interface DashboardViewProps {
  refreshKey: number
  onNavigate?: (tab: string) => void
  /** Llamado cuando se abre o cierra el modal de instalar o el de resumen semanal (para esconder la nav) */
  onDashboardModalChange?: (open: boolean) => void
}

export function DashboardView({ refreshKey, onNavigate, onDashboardModalChange }: DashboardViewProps) {
  const { t, locale } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [todayMeals, setTodayMeals] = useState<ReturnType<typeof getTodayMeals>>([])
  const [allMeals, setAllMeals] = useState<ReturnType<typeof getMeals>>([])
  const [greeting, setGreeting] = useState("")
  const [dateStr, setDateStr] = useState("")
  const [openPlan, setOpenPlan] = useState(false)
  const [openInstall, setOpenInstall] = useState(false)
  const [openReport, setOpenReport] = useState(false)
  const [cardsCarouselIndex, setCardsCarouselIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setCardsCarouselIndex((i) => (i + 1) % 4)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!mounted) return
    setTodayMeals(getTodayMeals())
    setAllMeals(getMeals())
    const now = new Date()
    const hour = now.getHours()
    setGreeting(
      hour < 12 ? t("greeting.morning") : hour < 18 ? t("greeting.afternoon") : t("greeting.evening")
    )
    setDateStr(
      now.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    )
  }, [mounted, refreshKey, t, locale])

  const today = getTodayString()
  const profile = getProfile()
  const calGoal = profile.calorieGoal || 2000
  const protGoal = profile.proteinGoal || 150
  const carbsGoal = profile.carbsGoal || 250
  const fatGoal = profile.fatGoal || 65

  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  const todayProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0)
  const todayCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0)
  const todayFat = todayMeals.reduce((sum, m) => sum + m.fat, 0)

  const todayExercises = getExercisesForDate(today)
  const weekDates = getWeekDates(today)
  const loc = locale === "es" ? "es-ES" : "en-US"

  const calPercent = Math.min((todayCalories / calGoal) * 100, 120)
  const isOverCal = todayCalories > calGoal
  const calDiff = isOverCal ? todayCalories - calGoal : calGoal - todayCalories

  const modalOverlayClass =
    "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-opacity duration-300 ease-out"
  const modalContentClass =
    "w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-300 ease-out slide-in-from-bottom-4 sm:slide-in-from-none"

  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 px-4 pb-6 animate-pulse">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-48 rounded-md bg-secondary" />
          <div className="h-4 w-32 rounded-md bg-secondary" />
        </div>
        <div className="h-28 rounded-xl bg-secondary" />
        <div className="h-24 rounded-xl bg-secondary" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-secondary" />
          <div className="h-20 rounded-xl bg-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
          <button
            type="button"
            onClick={() => setOpenPlan(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#CC5500] px-3 py-2 text-left transition-transform active:scale-[0.98] shadow-md shadow-orange-500/20"
          >
            <Target className="h-5 w-5 text-white/95 shrink-0" />
            <span className="font-semibold text-white text-[13px] leading-tight whitespace-nowrap">{t("dashboard.boxPlan")}</span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>

      {/* Carrusel de cards: Descarga la app, Resumen, Tu plan, Habla con Rulo */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${cardsCarouselIndex * 100}%)` }}
        >
          {[
            {
              Icon: Smartphone,
              titleKey: "dashboard.boxInstall",
              hintKey: "dashboard.boxInstallHint",
              className: "from-purple-500/90 to-pink-500/90 shadow-purple-500/20",
              onClick: () => { setOpenInstall(true); onDashboardModalChange?.(true) },
            },
            {
              Icon: BarChart3,
              titleKey: "dashboard.boxReport",
              hintKey: "dashboard.boxReportHint",
              className: "from-purple-600 to-purple-700 shadow-purple-500/20",
              onClick: () => { setOpenReport(true); onDashboardModalChange?.(true) },
            },
            {
              Icon: Target,
              titleKey: "dashboard.carouselYourPlan",
              hintKey: "dashboard.carouselYourPlanHint",
              className: "from-amber-500/90 to-orange-600 shadow-orange-500/20",
              onClick: () => setOpenPlan(true),
            },
            {
              Icon: MessageCircle,
              titleKey: "dashboard.carouselTalkToRulo",
              hintKey: "dashboard.carouselTalkToRuloHint",
              className: "from-violet-600 to-purple-700 shadow-purple-500/20",
              onClick: () => onNavigate?.("profile"),
            },
          ].map((card, i) => (
            <button
              key={i}
              type="button"
              onClick={card.onClick}
              className={`aspect-[4/3] w-full min-w-full flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br p-2.5 text-center transition-transform active:scale-[0.98] shadow-lg ${card.className}`}
            >
              <card.Icon className="h-5 w-5 text-white/95 shrink-0" />
              <p className="font-semibold text-white text-[12px] leading-tight line-clamp-2">{t(card.titleKey as Parameters<typeof t>[0])}</p>
              <p className="text-[9px] text-white/80 line-clamp-2">{t(card.hintKey as Parameters<typeof t>[0])}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCardsCarouselIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === cardsCarouselIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
              aria-label={t((i === 0 ? "dashboard.boxInstall" : i === 1 ? "dashboard.boxReport" : i === 2 ? "dashboard.carouselYourPlan" : "dashboard.carouselTalkToRulo") as Parameters<typeof t>[0])}
            />
          ))}
        </div>
      </div>

      {/* Modal: Tu plan — estilo rulo (space-bg + 3 planes) */}
      {openPlan && (() => {
        const allFeaturesList = [
          { icon: Mic, key: "plan.featureVoice" },
          { icon: Camera, key: "plan.featureSnapshot" },
          { icon: BarChart3, key: "plan.featureDashboard" },
          { icon: TrendingUp, key: "plan.featureProgression" },
          { icon: Bell, key: "plan.featureNudging" },
          { icon: Target, key: "plan.featureHeatmap" },
          { icon: Activity, key: "plan.featureVolume" },
          { icon: Calendar, key: "plan.featureHistory" },
          { icon: Zap, key: "plan.featureVoiceFix" },
          { icon: Smartphone, key: "plan.featureApp" },
          { icon: Lock, key: "plan.featureExport" },
        ] as const
        const plansList = [
          { nameKey: "plan.maquina.name", subtitleKey: "plan.maquina.subtitle", featureIndices: [0, 6, 8, 9], image: "/images/rulo-happy.png", popular: false },
          { nameKey: "plan.fiera.name", subtitleKey: "plan.fiera.subtitle", featureIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], image: "/images/rulo-lifting.png", popular: true },
          { nameKey: "plan.bestia.name", subtitleKey: "plan.bestia.subtitle", featureIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], image: "/images/rulo-celebration.png", popular: false },
        ]
        return (
          <div className={modalOverlayClass} style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setOpenPlan(false)} role="dialog" aria-modal="true" aria-label={t("dashboard.planTitle")}>
            <div className={`${modalContentClass} relative overflow-hidden bg-slate-900 border-slate-700`} onClick={(e) => e.stopPropagation()}>
              {/* Misma imagen de fondo que rulo precios */}
              <div className="absolute inset-0 bg-cover bg-center rounded-t-2xl sm:rounded-2xl" style={{ backgroundImage: "url(/images/space-bg.jpg)" }} />
              <div className="absolute inset-0 bg-slate-900/85 rounded-t-2xl sm:rounded-2xl" />
              <div className="relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3 shrink-0">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t("dashboard.planTitle")}</h2>
                    <p className="text-xs text-slate-400">{t("dashboard.planSubtitle")}</p>
                  </div>
                  <button type="button" onClick={() => setOpenPlan(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10" aria-label={t("profile.cancel")}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  <p className="text-sm text-slate-300">{t("dashboard.plansIntro")}</p>
                  {/* Features — cards tipo rulo */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t("dashboard.plansFeaturesTitle")}</h3>
                    <ul className="space-y-2">
                      {allFeaturesList.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 px-3 py-2.5 text-sm text-white">
                          <f.icon className="h-4 w-4 shrink-0 text-purple-400" />
                          <span>{t(f.key as Parameters<typeof t>[0])}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Los 3 planes — estilo cards rulo */}
                  <div className="space-y-3">
                    {plansList.map((plan, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-2xl overflow-hidden p-4 ${
                          plan.popular
                            ? "bg-gradient-to-br from-purple-500/90 to-pink-500/90 border border-purple-400/30"
                            : "bg-slate-800/80 backdrop-blur-sm border border-slate-700"
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-b-lg">
                            Más popular
                          </div>
                        )}
                        <div className={`flex items-center justify-between gap-3 ${plan.popular ? "pt-5" : ""}`}>
                          <div>
                            <p className={`text-[10px] uppercase tracking-wider ${plan.popular ? "text-white/70" : "text-slate-400"}`}>{t(plan.subtitleKey as Parameters<typeof t>[0])}</p>
                            <h4 className="text-lg font-bold text-white">{t(plan.nameKey as Parameters<typeof t>[0])}</h4>
                          </div>
                          <img src={plan.image} alt="" className="w-14 h-14 object-contain shrink-0" />
                        </div>
                        <ul className="mt-3 space-y-1">
                          {plan.featureIndices.map((fi) => (
                            <li key={fi} className="flex items-center gap-2 text-xs text-white/80">
                              <Check className="h-3.5 w-3.5 shrink-0 text-white" />
                              {t(allFeaturesList[fi].key as Parameters<typeof t>[0])}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {/* Tus metas diarias */}
                  <div className="rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t("dashboard.planSubtitle")}</p>
                    <div className="flex items-baseline gap-2 flex-wrap text-sm text-white">
                      <span className="font-medium">{calGoal.toLocaleString()} {t("unit.kcal")}</span>
                      <span className="text-slate-500">·</span>
                      <span>{protGoal}g {t("macro.protein")}</span>
                      <span className="text-slate-500">·</span>
                      <span>{carbsGoal}g {t("macro.carbs")}</span>
                      <span className="text-slate-500">·</span>
                      <span>{fatGoal}g {t("macro.fat")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Panel: Descarga la app (mismo diseño/animación que trains y meals) */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: openInstall ? "auto" : "none",
          visibility: openInstall ? "visible" : "hidden",
        }}
        aria-hidden={!openInstall}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-300"
          style={{ opacity: openInstall ? 1 : 0 }}
          onClick={() => { setOpenInstall(false); onDashboardModalChange?.(false) }}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-lg max-h-[85dvh] flex-col rounded-t-2xl bg-background shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: openInstall ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-lg font-semibold text-foreground">{t("dashboard.installTitle")}</h2>
            <button
              type="button"
              onClick={() => { setOpenInstall(false); onDashboardModalChange?.(false) }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
            <div className="flex gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{t("install.subtitle")}</p>
            </div>
            <ol className="space-y-3 text-sm text-foreground">
              {isIOS() ? (
                <>
                  <li className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                    <span>{t("install.iosStep1")}</span>
                    <Share className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    <span>{t("install.iosStep2")}</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                    <span>{t("install.iosStep3")}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                    <span>{t("install.androidStep1")}</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    <span>{t("install.androidStep2")}</span>
                  </li>
                </>
              )}
            </ol>
          </div>
        </div>
      </div>

      {/* Panel: Resumen de la semana (mismo diseño/animación que trains y meals) */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: openReport ? "auto" : "none",
          visibility: openReport ? "visible" : "hidden",
        }}
        aria-hidden={!openReport}
      >
        <div
          className="absolute inset-0 bg-black/40 transition-opacity duration-300"
          style={{ opacity: openReport ? 1 : 0 }}
          onClick={() => { setOpenReport(false); onDashboardModalChange?.(false) }}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-lg max-h-[85dvh] flex-col rounded-t-2xl bg-background shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: openReport ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("dashboard.recapTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("dashboard.recapSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => { setOpenReport(false); onDashboardModalChange?.(false) }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
            {openReport && (() => {
              const weekSessions = getWeekSessions()
              const weekMeals = getWeekMeals()
              const totalExercises = weekSessions.reduce((sum, s) => sum + s.exercises.length, 0)
              const totalCalories = weekMeals.reduce((sum, m) => sum + m.calories, 0)
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("dashboard.recapSessions")}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{weekSessions.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("dashboard.recapExercises")}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalExercises}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("dashboard.recapMeals")}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{weekMeals.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("dashboard.recapCalories")}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalCalories.toLocaleString()}</p>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Today's calories vs goal */}
      <section aria-label={t("dashboard.todayProgress")}>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {todayCalories.toLocaleString()} / {calGoal.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t("unit.kcal")}</p>
              </div>
            </div>
            <p
              className={`text-sm font-semibold ${isOverCal ? "text-destructive" : "text-primary"}`}
            >
              {calDiff.toLocaleString()} {isOverCal ? t("dashboard.over") : t("dashboard.remaining")}
            </p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(calPercent, 100)}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-semibold text-foreground">{todayProtein}</p>
              <p className="text-[10px] text-muted-foreground">{t("macro.protein")} (meta {protGoal})</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{todayCarbs}</p>
              <p className="text-[10px] text-muted-foreground">{t("macro.carbs")} (meta {carbsGoal})</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{todayFat}</p>
              <p className="text-[10px] text-muted-foreground">{t("macro.fat")} (meta {fatGoal})</p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's training */}
      <section aria-label={t("dashboard.todayTraining")}>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                {todayExercises.length > 0 ? (
                  <>
                    <p className="font-semibold text-foreground">{t("dashboard.youTrained")}</p>
                    <p className="text-sm text-muted-foreground">
                      {todayExercises.length} {t("dashboard.exercises")}
                      {todayExercises.length <= 3
                        ? ` · ${todayExercises.map((e) => e.name).join(", ")}`
                        : ` · ${todayExercises.slice(0, 2).map((e) => e.name).join(", ")}...`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">{t("dashboard.noTrainingYet")}</p>
                    <p className="text-sm text-muted-foreground">{t("dashboard.addExercise")}</p>
                  </>
                )}
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("training")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-95"
                aria-label={t("dashboard.addExercise")}
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Week at a glance: Training + Meals */}
      <section aria-label={t("dashboard.thisWeek")}>
        <div className="rounded-xl border border-border bg-card px-2 py-3">
          <div className="mb-2 flex gap-4 px-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.weekTraining")}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.weekMeals")}
            </span>
          </div>
          <div className="flex gap-1">
            {weekDates.map((dateStr) => {
              const hasTraining = getExercisesForDate(dateStr).length > 0
              const hasMeals = allMeals.some((m) => m.date === dateStr)
              const isToday = dateStr === today
              return (
                <div
                  key={dateStr}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg py-1"
                >
                  <span
                    className={`text-[11px] font-medium uppercase ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {new Date(dateStr + "T12:00:00").toLocaleDateString(loc, { weekday: "short" }).charAt(0)}
                  </span>
                  <div className="flex flex-col items-center gap-0.5">
                    {hasTraining ? (
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-2 w-2 text-primary-foreground" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} />
                    )}
                    {hasMeals ? (
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-chart-3">
                        <Check className="h-2 w-2 text-primary-foreground" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/40" strokeWidth={2} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick log */}
      {onNavigate && (
        <section aria-label={t("dashboard.quickLog")}>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate("meals")}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/15">
                <UtensilsCrossed className="h-5 w-5 text-chart-3" />
              </div>
              <span className="font-semibold text-foreground">{t("dashboard.addMeal")}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("training")}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("dashboard.addExercise")}</span>
            </button>
          </div>
        </section>
      )}

      {/* Recent today */}
      {(todayMeals.length > 0 || todayExercises.length > 0) && (
        <section aria-label={t("dashboard.recentActivity")}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.recentActivity")}
          </h2>
          <div className="flex flex-col gap-2">
            {todayExercises.slice(0, 3).map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets}×{ex.reps} @ {ex.weight}
                    {t("unit.kg")}
                  </p>
                </div>
              </div>
            ))}
            {todayMeals.slice(0, 3).map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-chart-3/15">
                  <Flame className="h-4 w-4 text-chart-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{meal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {meal.calories} {t("unit.cal")} · {meal.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
