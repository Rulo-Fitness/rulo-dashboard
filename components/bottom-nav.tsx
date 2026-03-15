"use client"

import { useEffect, useRef, useState } from "react"
import { LayoutDashboard, Dumbbell, UtensilsCrossed, Settings } from "lucide-react"
import { useI18n, type TranslationKey } from "@/lib/i18n"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hidden?: boolean
}

const tabs = [
  { id: "dashboard", labelKey: "nav.home" as TranslationKey, icon: LayoutDashboard },
  { id: "training", labelKey: "nav.training" as TranslationKey, icon: Dumbbell },
  { id: "meals", labelKey: "nav.meals" as TranslationKey, icon: UtensilsCrossed },
  { id: "settings", labelKey: "nav.settings" as TranslationKey, icon: Settings },
]

export function BottomNav({ activeTab, onTabChange, hidden = false }: BottomNavProps) {
  const { t } = useI18n()
  const [scrollHidden, setScrollHidden] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastScrollY.current && y > 60) {
        setScrollHidden(true)
      } else {
        setScrollHidden(false)
      }
      lastScrollY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const isHidden = hidden || scrollHidden

  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border transition-transform duration-300 ease-out"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        transform: isHidden ? "translateY(100%)" : "translateY(0)",
      }}
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const label = t(tab.labelKey)
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 select-none active:opacity-70"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <tab.icon
                style={{
                  width: "22px",
                  height: "22px",
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  strokeWidth: isActive ? 2.2 : 1.7,
                }}
              />
              <span
                aria-hidden
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
