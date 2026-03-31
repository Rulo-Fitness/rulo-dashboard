"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { ArrowLeft, Share2, Trophy, Flame, Activity, Sparkles, Dumbbell } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface TrainingRecapMockProps {
  onClose: () => void
}

const recapTransition = {
  type: "spring",
  stiffness: 230,
  damping: 28,
  mass: 1,
} as const

const mockHighlights = [
  { icon: Flame, value: "18,420", suffix: "kg", labelKey: "analytics.recapMockVolume" },
  { icon: Activity, value: "4", suffix: "/7", labelKey: "analytics.recapMockFrequency" },
  { icon: Trophy, value: "92.5", suffix: "kg", labelKey: "analytics.recapMockPr" },
  { icon: Dumbbell, value: "Push Day", suffix: "", labelKey: "analytics.recapMockTopDay" },
] as const

export function TrainingRecapMock({ onClose }: TrainingRecapMockProps) {
  const { t } = useI18n()

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow
    const htmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = htmlOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Base gradient — purple→pink light / orange dark */}
      <motion.div
        layoutId="training-recap-shell"
        transition={recapTransition}
        className="absolute inset-0 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 dark:from-[#FF6B00] dark:via-[#FF8C33] dark:to-[#CC5500]"
      />
      {/* Dark overlay for depth */}
      <motion.div
        layoutId="training-recap-glow"
        transition={recapTransition}
        className="absolute inset-0 bg-black/40"
      />

      {/* Static blobs for depth — no animation */}
      <div className="absolute -left-16 top-[10%] h-[300px] w-[300px] rounded-full bg-pink-400/40 dark:bg-[#FF6B00]/40 blur-[100px]" />
      <div className="absolute -right-20 top-[35%] h-[350px] w-[350px] rounded-full bg-purple-600/30 dark:bg-[#CC5500]/30 blur-[120px]" />
      <div className="absolute bottom-[10%] left-[20%] h-[250px] w-[250px] rounded-full bg-pink-500/20 dark:bg-[#FF6B00]/20 blur-[100px]" />

      {/* Content */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-5">
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-colors active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-sm">
              {t("analytics.recapMockEyebrow")}
            </span>
          </header>

          <section className="pt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t("analytics.recapMockWeek")}
            </div>
            <h1 className="mt-5 text-[34px] font-black leading-[0.95] tracking-[-0.04em] text-white">
              {t("analytics.recapMockTitle")}
            </h1>
            <p className="mt-4 max-w-[300px] text-sm leading-6 text-white/60">
              {t("analytics.recapMockSubtitle")}
            </p>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-3">
            {mockHighlights.map((item) => (
              <div
                key={item.labelKey}
                className="rounded-[26px] border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <item.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="mt-6">
                  <p className="text-[28px] font-black tracking-[-0.04em] text-white">
                    {item.value}
                    {item.suffix && <span className="ml-1 text-sm font-semibold text-white/50">{item.suffix}</span>}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                    {t(item.labelKey)}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-[32px] border border-white/15 bg-white/[0.08] p-6 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              {t("analytics.recapMockMomentEyebrow")}
            </p>
            <h2 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-white">
              {t("analytics.recapMockMomentTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {t("analytics.recapMockMomentBody")}
            </p>
          </section>

          <section className="mt-6 rounded-[32px] border border-white/15 bg-white/[0.08] p-6 backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
              {t("analytics.recapMockCloseEyebrow")}
            </p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.04em] text-white">
              {t("analytics.recapMockCloseTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {t("analytics.recapMockCloseBody")}
            </p>
            <button
              type="button"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg transition-all active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4" />
              {t("analytics.recapMockShare")}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
