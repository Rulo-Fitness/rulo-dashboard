"use client"

import { useState, useRef, useEffect } from "react"
import { LayoutDashboard, Dumbbell, UtensilsCrossed, User } from "lucide-react"
import { useI18n, type TranslationKey } from "@/lib/i18n"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  /** 0 = full size, 1 = max shrink (scroll down) */
  scrollShrink?: number
}

const TAB_W_FULL = 82
const TAB_H_FULL = 66
const TAB_W_COMPACT = 56
const TAB_H_COMPACT = 52

const tabs = [
  { id: "dashboard", labelKey: "nav.home" as TranslationKey, icon: LayoutDashboard },
  { id: "training", labelKey: "nav.training" as TranslationKey, icon: Dumbbell },
  { id: "meals", labelKey: "nav.meals" as TranslationKey, icon: UtensilsCrossed },
  { id: "profile", labelKey: "nav.profile" as TranslationKey, icon: User },
]

const SHRINK_MAX = 0.22
const SCROLL_ICONS_ONLY_THRESHOLD = 0.2
const EASE_BOUNCE = "cubic-bezier(0.34, 1.42, 0.64, 1)"
const EASE_SMOOTH = "cubic-bezier(0.33, 1, 0.68, 1)"
const DUR = "0.42s"
const DUR_M = "0.28s"

export function BottomNav({ activeTab, onTabChange, scrollShrink = 0 }: BottomNavProps) {
  const { t } = useI18n()
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevIndex = useRef(activeIndex)
  const scale = 1 - scrollShrink * SHRINK_MAX
  const iconsOnly = scrollShrink >= SCROLL_ICONS_ONLY_THRESHOLD
  const tabW = iconsOnly ? TAB_W_COMPACT : TAB_W_FULL
  const tabH = iconsOnly ? TAB_H_COMPACT : TAB_H_FULL

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
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none origin-bottom"
      style={{
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        transform: `scale(${scale})`,
        transition: `transform ${DUR} ${EASE_BOUNCE}`,
      }}
    >
      <nav
        role="tablist"
        aria-label="Main navigation"
        className="pointer-events-auto relative flex items-stretch rounded-full p-[5px] liquid-glass"
      >
        {/* Sliding pill indicator */}
        <div
          className="absolute rounded-full"
          style={{
            width: isAnimating ? `${tabW + (iconsOnly ? 14 : 18)}px` : `${tabW}px`,
            marginLeft: isAnimating ? (iconsOnly ? "-7px" : "-9px") : "0px",
            height: isAnimating ? "calc(100% + 12px)" : "calc(100% - 10px)",
            top: isAnimating ? "-6px" : "5px",
            transform: `translateX(${activeIndex * tabW}px)`,
            transition: `transform 380ms ${EASE_BOUNCE}, width ${DUR_M} ${EASE_SMOOTH}, margin-left ${DUR_M} ${EASE_SMOOTH}, height ${DUR_M} ${EASE_SMOOTH}, top ${DUR_M} ${EASE_SMOOTH}`,
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
              className={`relative z-10 flex rounded-full overflow-hidden ${iconsOnly ? "items-center justify-center" : "flex-col items-center justify-center gap-1"}`}
              style={{
                width: `${tabW}px`,
                height: `${tabH}px`,
                transition: `width ${DUR} ${EASE_BOUNCE}, height ${DUR} ${EASE_BOUNCE}`,
              }}
            >
              <tab.icon
                style={{
                  width: iconsOnly ? "24px" : "23px",
                  height: iconsOnly ? "24px" : "23px",
                  flexShrink: 0,
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  strokeWidth: isActive ? 2.2 : 1.6,
                  transition: `color ${DUR_M} ${EASE_SMOOTH}, stroke-width ${DUR_M} ${EASE_SMOOTH}`,
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  maxWidth: iconsOnly ? 0 : 64,
                  maxHeight: iconsOnly ? 0 : "none",
                  opacity: iconsOnly ? 0 : 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  lineHeight: iconsOnly ? 0 : undefined,
                  transition: `max-width ${DUR} ${EASE_BOUNCE}, max-height ${DUR_M} ${EASE_SMOOTH}, opacity ${DUR_M} ${EASE_SMOOTH}`,
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
