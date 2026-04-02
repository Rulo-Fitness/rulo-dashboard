"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ChevronLeft, MessageCircle } from "lucide-react"
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

const WHATSAPP_RULO_URL = "https://wa.me/5492236660910"

export function BottomNav({ activeTab, onTabChange, hidden = false }: BottomNavProps) {
  const { t } = useI18n()
  const [chatOpen, setChatOpen] = useState(false)
  const trendingRef = useRef<TrendingIconHandle>(null)
  const bicepsRef = useRef<BicepsFlexedIconHandle>(null)
  const bananaRef = useRef<BananaIconHandle>(null)
  const settingsRef = useRef<SettingsIconHandle>(null)

  const handleTabClick = async (tabId: string) => {
    onTabChange(tabId)
    if (tabId === "analytics") trendingRef.current?.startAnimation()
    if (tabId === "training") bicepsRef.current?.startAnimation()
    if (tabId === "meals") bananaRef.current?.startAnimation()
    if (tabId === "settings") {
      settingsRef.current?.resetAndAnimate()
    }
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
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-[132%]">
        <div className="pointer-events-auto flex items-center justify-end overflow-hidden rounded-l-2xl border border-r-0 border-white/20 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 shadow-[0_8px_24px_rgba(168,85,247,0.24)] dark:border-[#CC5500]/40 dark:from-[#FF6B00] dark:via-[#FF8C33] dark:to-[#CC5500] dark:shadow-[0_8px_24px_rgba(255,107,0,0.24)]">
          <Link
            href={WHATSAPP_RULO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t("nav.chatRulo")}
            className={`flex items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] font-medium text-white transition-all duration-300 ease-out ${
              chatOpen
                ? "max-w-[190px] px-3 py-3 opacity-100 translate-x-0"
                : "max-w-0 px-0 py-3 opacity-0 translate-x-4 pointer-events-none"
            }`}
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>{t("nav.chatRulo")}</span>
          </Link>
          <button
            type="button"
            aria-label={t("nav.chatRulo")}
            onClick={() => setChatOpen((open) => !open)}
            className="inline-flex items-center px-3 py-3 text-white"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${chatOpen ? "rotate-180" : ""}`}
              strokeWidth={2.2}
            />
          </button>
        </div>
      </div>
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
