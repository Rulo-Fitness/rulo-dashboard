"use client"

import { useState, useRef, useEffect } from "react"
import { LayoutDashboard, Dumbbell, UtensilsCrossed, User } from "lucide-react"
import { useI18n, type TranslationKey } from "@/lib/i18n"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "dashboard", labelKey: "nav.home" as TranslationKey, icon: LayoutDashboard },
  { id: "training", labelKey: "nav.training" as TranslationKey, icon: Dumbbell },
  { id: "meals", labelKey: "nav.meals" as TranslationKey, icon: UtensilsCrossed },
  { id: "profile", labelKey: "nav.profile" as TranslationKey, icon: User },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n()
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevIndex = useRef(activeIndex)

  useEffect(() => {
    if (prevIndex.current !== activeIndex) {
      setIsAnimating(true)
      prevIndex.current = activeIndex
      const timer = setTimeout(() => setIsAnimating(false), 120)
      return () => clearTimeout(timer)
    }
  }, [activeIndex])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <nav
        role="tablist"
        aria-label="Main navigation"
        className="pointer-events-auto relative flex items-stretch rounded-full p-[3px] liquid-glass"
      >
        {/* Sliding pill indicator */}
        <div
          className="absolute top-[3px] rounded-full"
          style={{
            width: isAnimating ? "88px" : "68px",
            marginLeft: isAnimating ? "-10px" : "0px",
            height: isAnimating ? "calc(100% + 14px)" : "calc(100% - 6px)",
            top: isAnimating ? "-10px" : "3px",
            transform: `translateX(${activeIndex * 68}px)`,
            transition: "transform 280ms cubic-bezier(0, 0, 0.2, 1), width 150ms cubic-bezier(0, 0, 0.2, 1), margin-left 150ms cubic-bezier(0, 0, 0.2, 1), height 150ms cubic-bezier(0, 0, 0.2, 1), top 150ms cubic-bezier(0, 0, 0.2, 1)",
            background: "oklch(from var(--primary) l c h / 0.18)",
            boxShadow: "inset 0 1.5px 0 oklch(1 0 0 / 0.25), inset 0 -0.5px 0 oklch(0 0 0 / 0.06), 0 1px 4px oklch(0 0 0 / 0.06)",
          }}
        />

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
              className="relative z-10 flex w-[68px] flex-col items-center justify-center gap-0.5 rounded-full"
              style={{ height: "56px" }}
            >
              <tab.icon
                style={{
                  width: "20px",
                  height: "20px",
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  strokeWidth: isActive ? 2.2 : 1.6,
                  transition: "color 0.25s ease, stroke-width 0.25s ease",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  transition: "color 0.25s ease",
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
