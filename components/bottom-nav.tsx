"use client"

import { LayoutDashboard, Dumbbell, UtensilsCrossed, User } from "lucide-react"
import { useI18n, type TranslationKey } from "@/lib/i18n"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "dashboard", labelKey: "nav.home" as TranslationKey, icon: LayoutDashboard, hue: "180" },
  { id: "training", labelKey: "nav.training" as TranslationKey, icon: Dumbbell, hue: "280" },
  { id: "meals", labelKey: "nav.meals" as TranslationKey, icon: UtensilsCrossed, hue: "25" },
  { id: "profile", labelKey: "nav.profile" as TranslationKey, icon: User, hue: "260" },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useI18n()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      <nav
        role="tablist"
        aria-label="Main navigation"
        className="liquid-glass-nav pointer-events-auto relative flex items-stretch rounded-full p-[3px]"
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
        {/* Specular highlight overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(180deg, var(--glass-highlight) 0%, transparent 50%, oklch(0 0 0 / 0.03) 100%)",
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
              className="relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-500 ease-out"
              style={{
                width: isActive ? "80px" : "60px",
                height: "56px",
                ...(isActive
                  ? {
                      background: [
                        `linear-gradient(180deg,`,
                        `oklch(0.45 0.12 ${tab.hue} / 0.45) 0%,`,
                        `oklch(0.30 0.10 ${tab.hue} / 0.55) 100%)`,
                      ].join(" "),
                      boxShadow: [
                        `0 0 20px oklch(0.55 0.15 ${tab.hue} / 0.25)`,
                        `0 0 40px oklch(0.55 0.15 ${tab.hue} / 0.08)`,
                        `inset 0 1px 0 oklch(1 0 0 / 0.15)`,
                        `inset 0 -1px 0 oklch(0 0 0 / 0.1)`,
                      ].join(", "),
                      border: `0.5px solid oklch(0.65 0.12 ${tab.hue} / 0.3)`,
                    }
                  : {
                      background: "transparent",
                    }),
              }}
            >
              {/* Active tab glass shine */}
              {isActive && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, oklch(1 0 0 / 0.1) 0%, transparent 40%)`,
                  }}
                />
              )}

              <tab.icon
                className="relative z-10 transition-all duration-400 ease-out"
                style={{
                  width: isActive ? "22px" : "20px",
                  height: isActive ? "22px" : "20px",
                  color: isActive
                    ? `oklch(0.88 0.14 ${tab.hue})`
                    : "var(--glass-inactive-text)",
                  strokeWidth: isActive ? 2.2 : 1.6,
                  filter: isActive
                    ? `drop-shadow(0 0 6px oklch(0.7 0.15 ${tab.hue} / 0.5))`
                    : "none",
                }}
              />
              <span
                className="relative z-10 leading-none transition-all duration-400 ease-out"
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: isActive ? "0.01em" : "0",
                  color: isActive
                    ? `oklch(0.88 0.14 ${tab.hue})`
                    : "var(--glass-inactive-text)",
                  textShadow: isActive
                    ? `0 0 8px oklch(0.7 0.15 ${tab.hue} / 0.4)`
                    : "none",
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
