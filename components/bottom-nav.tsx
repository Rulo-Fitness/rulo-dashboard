"use client"

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

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <nav
        role="tablist"
        aria-label="Main navigation"
        className="pointer-events-auto relative flex items-stretch rounded-full p-[3px]"
        style={{
          background: "linear-gradient(180deg, var(--glass-bg-from) 0%, var(--glass-bg-to) 100%)",
          backdropFilter: "blur(50px) saturate(200%) brightness(1.1)",
          WebkitBackdropFilter: "blur(50px) saturate(200%) brightness(1.1)",
          boxShadow: [
            "var(--glass-shadow-1)",
            "var(--glass-shadow-2)",
            "var(--glass-inset-top)",
            "var(--glass-inset-bottom)",
          ].join(", "),
          border: "0.5px solid var(--glass-border)",
        }}
      >
        {/* Sliding pill indicator */}
        <div
          className="absolute top-[3px] bottom-[3px] rounded-full transition-transform duration-300 ease-out"
          style={{
            width: "68px",
            transform: `translateX(${activeIndex * 68}px)`,
            background: "oklch(from var(--primary) l c h / 0.2)",
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
                  color: isActive ? "var(--primary)" : "var(--glass-inactive-text)",
                  strokeWidth: isActive ? 2.2 : 1.6,
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--primary)" : "var(--glass-inactive-text)",
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
