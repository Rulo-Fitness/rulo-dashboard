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
    <div className="fixed inset-0 z-50 overflow-hidden text-white">
      <motion.div
        layoutId="training-recap-shell"
        transition={recapTransition}
        className="absolute inset-0 bg-[linear-gradient(180deg,#101010_0%,#171717_38%,#0f0f0f_100%)]"
      />
      <motion.div
        layoutId="training-recap-glow"
        transition={recapTransition}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_34%)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        animate={{
          x: [0, 24, -18, 0],
          y: [0, -22, 20, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 16,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
        }}
        className="absolute -left-20 top-[-10%] h-[280px] w-[280px] rounded-full bg-white/[0.07] blur-[90px]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        animate={{
          x: [0, -28, 20, 0],
          y: [0, 20, -16, 0],
          scale: [1, 0.94, 1.06, 1],
        }}
        transition={{
          duration: 20,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
        }}
        className="absolute bottom-[18%] right-[-18%] h-[320px] w-[320px] rounded-full bg-white/[0.05] blur-[110px]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        animate={{
          opacity: [0.16, 0.28, 0.18, 0.16],
          scale: [1, 1.04, 0.98, 1],
        }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.09),transparent_32%)]"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 overflow-y-auto"
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-[max(20px,env(safe-area-inset-top))]">
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              {t("analytics.recapMockEyebrow")}
            </span>
          </header>

          <section className="pt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              {t("analytics.recapMockWeek")}
            </div>
            <h1 className="mt-5 text-[34px] font-black leading-[0.95] tracking-[-0.04em] text-white">
              {t("analytics.recapMockTitle")}
            </h1>
            <p className="mt-4 max-w-[300px] text-sm leading-6 text-white/70">
              {t("analytics.recapMockSubtitle")}
            </p>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-3">
            {mockHighlights.map((item) => (
              <div
                key={item.labelKey}
                className="rounded-[26px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <item.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <div className="mt-6">
                  <p className="text-[28px] font-black tracking-[-0.04em] text-white">
                    {item.value}
                    {item.suffix && <span className="ml-1 text-sm font-semibold text-white/55">{item.suffix}</span>}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    {t(item.labelKey)}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {t("analytics.recapMockMomentEyebrow")}
            </p>
            <h2 className="mt-3 text-[22px] font-bold tracking-[-0.03em] text-white">
              {t("analytics.recapMockMomentTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {t("analytics.recapMockMomentBody")}
            </p>
          </section>

          <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {t("analytics.recapMockCloseEyebrow")}
            </p>
            <h2 className="mt-3 text-[24px] font-black tracking-[-0.04em] text-white">
              {t("analytics.recapMockCloseTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {t("analytics.recapMockCloseBody")}
            </p>
            <button
              type="button"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition-transform active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4" />
              {t("analytics.recapMockShare")}
            </button>
          </section>
        </div>
      </motion.div>
    </div>
  )
}
