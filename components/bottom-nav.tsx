"use client"

import { useState, useRef, useEffect } from "react"
import { LayoutDashboard, Dumbbell, UtensilsCrossed, Settings } from "lucide-react"
import { useI18n, type TranslationKey } from "@/lib/i18n"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  /** 0 = full size, 1 = max shrink (scroll down) */
  scrollShrink?: number
  /** Si true, la nav se oculta con animación (slide down) */
  hidden?: boolean
}

const TAB_W_FULL = 82
const TAB_H_FULL = 66
const TAB_W_COMPACT = 62
const TAB_H_COMPACT = 58

const tabs = [
  { id: "dashboard", labelKey: "nav.home" as TranslationKey, icon: LayoutDashboard },
  { id: "training", labelKey: "nav.training" as TranslationKey, icon: Dumbbell },
  { id: "meals", labelKey: "nav.meals" as TranslationKey, icon: UtensilsCrossed },
  { id: "settings", labelKey: "nav.settings" as TranslationKey, icon: Settings },
]

const SHRINK_MAX = 0.03
const SCROLL_ICONS_ONLY_THRESHOLD = 0.2
const EASE_BOUNCE = "cubic-bezier(0.34, 1.42, 0.64, 1)"
const EASE_SMOOTH = "cubic-bezier(0.33, 1, 0.68, 1)"
const EASE_SHRINK = "cubic-bezier(0.32, 0.72, 0, 1)"
const DUR = "0.65s"
const DUR_M = "0.42s"
const DUR_SHRINK = "0.5s"

const HIDE_DUR = "0.3s"
const HIDE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function BottomNav({ activeTab, onTabChange, scrollShrink = 0, hidden = false }: BottomNavProps) {
  const { t } = useI18n()
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const prevIndex = useRef(activeIndex)
  const scale = 1 - scrollShrink * SHRINK_MAX
  const iconsOnly = scrollShrink >= SCROLL_ICONS_ONLY_THRESHOLD
  const tabW = lerp(TAB_W_FULL, TAB_W_COMPACT, scrollShrink)
  const tabH = lerp(TAB_H_FULL, TAB_H_COMPACT, scrollShrink)
  const labelOpacity = scrollShrink <= 0.15 ? 1 : scrollShrink >= 0.35 ? 0 : (0.35 - scrollShrink) / 0.2

  useEffect(() => {
    if (prevIndex.current !== activeIndex) {
      setIsAnimating(true)
      setIsBouncing(true)
      prevIndex.current = activeIndex
      const t1 = setTimeout(() => setIsAnimating(false), 120)
      const t2 = setTimeout(() => setIsBouncing(false), 420)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [activeIndex])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none origin-bottom"
      style={{
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        transform: `scale(${scale}) translateY(${hidden ? "100%" : "0"})`,
        opacity: hidden ? 0 : 1,
        transition: `transform ${DUR_SHRINK} ${EASE_SHRINK}, opacity ${HIDE_DUR} ${HIDE_EASE}`,
      }}
    >
      <nav
        role="tablist"
        aria-label="Main navigation"
        className={`pointer-events-auto relative flex items-stretch rounded-full p-[5px] liquid-glass ${isBouncing ? "nav-container-bounce" : ""}`}
      >
        {/* Sliding pill indicator: sin tinte (nav-pill), icon/tag sí llevan primary */}
        <div
          className="nav-pill absolute rounded-full"
          style={{
            width: isAnimating ? `${tabW + (iconsOnly ? 14 : 18)}px` : `${tabW}px`,
            marginLeft: isAnimating ? (iconsOnly ? "-7px" : "-9px") : "0px",
            height: isAnimating ? "calc(100% + 12px)" : "calc(100% - 10px)",
            top: isAnimating ? "-6px" : "5px",
            transform: `translateX(${activeIndex * tabW}px)`,
            transition: `transform ${DUR_SHRINK} ${EASE_SHRINK}, width ${DUR_M} ${EASE_SMOOTH}, margin-left ${DUR_M} ${EASE_SMOOTH}, height ${DUR_M} ${EASE_SMOOTH}, top ${DUR_M} ${EASE_SMOOTH}`,
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
              className={`relative z-10 flex rounded-full overflow-hidden ${iconsOnly ? "items-center justify-center" : "flex-col items-center justify-center gap-0.5"}`}
              style={{
                width: `${tabW}px`,
                height: `${tabH}px`,
                transition: `width ${DUR_SHRINK} ${EASE_SHRINK}, height ${DUR_SHRINK} ${EASE_SHRINK}`,
              }}
            >
              <span className="flex shrink-0 items-center justify-center">
                <tab.icon
                  style={{
                    width: iconsOnly ? "24px" : "23px",
                    height: iconsOnly ? "24px" : "23px",
                    color: isActive ? "var(--primary)" : "var(--nav-inactive)",
                    strokeWidth: isActive ? 2.2 : 1.6,
                    transition: `color ${DUR_M} ${EASE_SMOOTH}, stroke-width ${DUR_M} ${EASE_SMOOTH}`,
                  }}
                />
              </span>
              <span
                aria-hidden
                className="block w-full text-center"
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 600 : 700,
                  color: isActive ? "var(--primary)" : "var(--nav-inactive)",
                  opacity: labelOpacity,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  transition: `opacity ${DUR_SHRINK} ${EASE_SHRINK}`,
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
