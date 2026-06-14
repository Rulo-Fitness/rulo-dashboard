"use client"

import { useSubscription } from "@/lib/hooks/use-subscription"
import { useI18n } from "@/lib/i18n"
import { AlertTriangle } from "lucide-react"

export function SubscriptionBanner({ onUpgrade }: { onUpgrade?: () => void }) {
  const { isActive } = useSubscription()
  const { t } = useI18n()

  if (isActive) return null

  return (
    <div className="mx-6 mt-3 mb-4 rounded-[28px] bg-destructive px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
          <AlertTriangle className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white">
            {t("subscription.bannerTitle")}
          </p>
          <p className="mt-0.5 text-[13px] leading-5 text-white/85">
            {t("subscription.bannerDescription")}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-white px-5 text-[14px] font-bold text-destructive transition-transform active:scale-[0.99]"
      >
        {t("subscription.bannerCta")}
      </button>
    </div>
  )
}
