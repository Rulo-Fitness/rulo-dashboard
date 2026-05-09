"use client"

import { useRef } from "react"
import { motion } from "motion/react"
import { useI18n, type TranslationKey } from "@/lib/i18n"
import { SettingsIcon, type SettingsIconHandle } from "@/components/ui/settings-icon"
import { TrendingIcon, type TrendingIconHandle } from "@/components/ui/trending-icon"
import { BananaIcon, type BananaIconHandle } from "@/components/ui/banana-icon"
import { BicepsFlexedIcon, type BicepsFlexedIconHandle } from "@/components/ui/biceps-icon"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hidden?: boolean
}

const tabs = [
  { id: "analytics", labelKey: "nav.analytics" as TranslationKey },
  { id: "training", labelKey: "nav.training" as TranslationKey },
  { id: "meals", labelKey: "nav.meals" as TranslationKey },
  { id: "settings", labelKey: "nav.settings" as TranslationKey },
]

export function BottomNav({ activeTab, onTabChange, hidden = false }: BottomNavProps) {
  const { t } = useI18n()
  const trendingRef = useRef<TrendingIconHandle>(null)
  const bicepsRef = useRef<BicepsFlexedIconHandle>(null)
  const bananaRef = useRef<BananaIconHandle>(null)
  const settingsRef = useRef<SettingsIconHandle>(null)
  const animationLocks = useRef<Record<string, number | undefined>>({})

  const runTabAnimation = (tabId: string) => {
    const now = window.performance.now()
    const lockedUntil = animationLocks.current[tabId] ?? 0
    if (now < lockedUntil) return

    animationLocks.current[tabId] = now + 700
    if (tabId === "analytics") trendingRef.current?.startAnimation()
    if (tabId === "training") bicepsRef.current?.startAnimation()
    if (tabId === "meals") bananaRef.current?.startAnimation()
    if (tabId === "settings") settingsRef.current?.resetAndAnimate()
  }

  const handleTabClick = async (tabId: string) => {
    if (tabId === activeTab) return
    onTabChange(tabId)
    runTabAnimation(tabId)
  }

  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="fixed bottom-3 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-out"
      style={{
        transform: hidden ? "translateY(calc(100% + 40px))" : "translateY(0)",
        opacity: hidden ? 0 : 1,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-full nav-glass">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const label = t(tab.labelKey)

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 group outline-none"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-secondary shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                    mass: 1,
                  }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center">
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  className="flex items-center justify-center"
                  style={{ color: isActive ? "var(--foreground)" : "#737373" }}
                >
                  {tab.id === "analytics" && <TrendingIcon ref={trendingRef} size={28} />}
                  {tab.id === "training" && <BicepsFlexedIcon ref={bicepsRef} size={28} />}
                  {tab.id === "meals" && <BananaIcon ref={bananaRef} size={28} />}
                  {tab.id === "settings" && <SettingsIcon ref={settingsRef} size={28} />}
                </motion.div>
              </div>

              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-black/5 dark:bg-white/5 transition-opacity duration-300 -z-10" />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
