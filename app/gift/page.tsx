"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { useForceLightMode } from "@/lib/hooks/use-force-light-mode"
import { useDefaultSpanishLocale } from "@/lib/hooks/use-default-spanish-locale"

function hasActiveAccess(subscriptionActiveUntil?: string | null) {
  if (!subscriptionActiveUntil) return false
  const parsed = new Date(subscriptionActiveUntil)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getTime() > Date.now()
}

const confettiPieces = [
  { side: "left", top: "12%", size: 12, color: "#FFB703", delay: "0s", shape: "rect" },
  { side: "left", top: "18%", size: 7, color: "#FB7185", delay: "0.08s", shape: "dot" },
  { side: "left", top: "28%", size: 9, color: "#F97316", delay: "0.14s", shape: "rect" },
  { side: "left", top: "40%", size: 8, color: "#60A5FA", delay: "0.2s", shape: "dot" },
  { side: "left", top: "52%", size: 10, color: "#34D399", delay: "0.28s", shape: "rect" },
  { side: "left", top: "66%", size: 6, color: "#A78BFA", delay: "0.34s", shape: "dot" },
  { side: "right", top: "14%", size: 12, color: "#F43F5E", delay: "0.04s", shape: "rect" },
  { side: "right", top: "22%", size: 7, color: "#FBBF24", delay: "0.1s", shape: "dot" },
  { side: "right", top: "32%", size: 9, color: "#A78BFA", delay: "0.16s", shape: "rect" },
  { side: "right", top: "44%", size: 8, color: "#38BDF8", delay: "0.22s", shape: "dot" },
  { side: "right", top: "56%", size: 10, color: "#34D399", delay: "0.3s", shape: "rect" },
  { side: "right", top: "68%", size: 6, color: "#FB7185", delay: "0.36s", shape: "dot" },
] as const

export default function GiftPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { user, updateUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useForceLightMode()
  useDefaultSpanishLocale()

  const shouldSkipGift = useMemo(() => {
    if (!user) return false
    return Boolean(user.trial_used) || hasActiveAccess(user.subscription_active_until)
  }, [user])

  useEffect(() => {
    if (!user) return
    if (shouldSkipGift) {
      router.replace("/")
    }
  }, [router, shouldSkipGift, user])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previousHtmlBackground = html.style.background
    const previousBodyBackground = body.style.background
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    const previousThemeColor = themeColorMeta?.getAttribute("content") ?? null

    html.style.background = "#ffffff"
    body.style.background = "#ffffff"
    themeColorMeta?.setAttribute("content", "#ffffff")

    return () => {
      html.style.background = previousHtmlBackground
      body.style.background = previousBodyBackground
      if (themeColorMeta && previousThemeColor) {
        themeColorMeta.setAttribute("content", previousThemeColor)
      }
    }
  }, [])

  async function handleAcceptGift() {
    if (!user || isSubmitting) return

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/activate-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.errors?.[0]?.message ?? t("gift.error"))
        setIsSubmitting(false)
        return
      }

      updateUser({
        subscription_active_until: data.result.subscription_active_until,
        trial_used: true,
      })

      router.replace("/")
    } catch {
      setError(t("gift.error"))
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-[100lvh] flex-col overflow-hidden bg-white text-foreground">

      <section className="relative z-10 mx-auto flex min-h-[100lvh] w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 pt-4 text-center md:px-10 md:py-10">
        {confettiPieces.map((piece, index) => (
          <span
            key={`${piece.side}-${index}`}
            className={piece.side === "left" ? "absolute left-3 z-10 md:left-12" : "absolute right-3 z-10 md:right-12"}
            style={{
              animationName:
                piece.shape === "rect"
                  ? piece.side === "left"
                    ? "gift-confetti-left, gift-confetti-twinkle"
                    : "gift-confetti-right, gift-confetti-twinkle"
                  : piece.side === "left"
                    ? "gift-confetti-left"
                    : "gift-confetti-right",
              animationDuration: piece.shape === "rect" ? "1.2s, 1.1s" : "1.2s",
              animationTimingFunction:
                piece.shape === "rect"
                  ? "cubic-bezier(0.2, 0.8, 0.2, 1), ease-out"
                  : "cubic-bezier(0.2, 0.8, 0.2, 1)",
              animationDelay:
                piece.shape === "rect"
                  ? `${piece.delay}, calc(1.2s + ${index * 0.11}s)`
                  : piece.delay,
              animationIterationCount: piece.shape === "rect" ? "1, infinite" : "1",
              animationFillMode: piece.shape === "rect" ? "both, both" : "both",
              top: piece.top,
              width: `${piece.size}px`,
              height: piece.shape === "dot" ? `${piece.size}px` : `${piece.size * 1.7}px`,
              backgroundColor: piece.color,
              boxShadow: `0 0 18px ${piece.color}40`,
              borderRadius: piece.shape === "dot" ? "999px" : "2px",
            }}
            aria-hidden
          />
        ))}

        <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-1 flex-col items-center justify-start pt-6 text-center md:max-w-[560px] md:pt-10">
          <h1 className="mx-auto -mt-2 max-w-[30rem] text-balance text-3xl font-bold tracking-tight text-foreground md:-mt-1 md:max-w-[38rem] md:text-[3.1rem] md:leading-[1.02]">
            <span className="mr-2">🎉</span>
            {t("gift.title")}
            <span className="ml-2">🎁</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[30rem] text-[15px] font-medium leading-7 text-foreground/78 md:mt-5 md:text-[17px] md:leading-8">
            {t("gift.subtitle")}
          </p>

          <div className="relative mx-auto mt-8 flex w-full max-w-[340px] items-center justify-center overflow-visible pb-3 md:mt-10 md:max-w-[390px] md:pb-4">
            <div className="absolute inset-x-8 inset-y-10 bg-[radial-gradient(circle,rgba(255,214,10,0.28),rgba(255,255,255,0)_70%)] blur-3xl" aria-hidden />
            <div className="relative flex w-full justify-center overflow-visible">
              <img
                src="/rulo-gift.webp"
                alt="Rulo con un regalo"
                className="relative z-10 h-auto w-full object-contain drop-shadow-[0_22px_45px_rgba(34,34,34,0.18)]"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2 text-sm font-medium text-muted-foreground md:mt-5">
            <div className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{t("gift.noPaymentNow")}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{t("gift.allFeatures")}</span>
            </div>
          </div>

          <div className="mt-10 flex w-full flex-col items-center pt-2 md:mt-12 md:pt-4">
            {error && (
              <p className="mx-auto mb-4 max-w-sm bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button
              type="button"
              onClick={handleAcceptGift}
              disabled={isSubmitting}
              className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-full text-base font-semibold shadow-md md:h-14 md:text-lg"
            >
              {isSubmitting ? t("gift.activating") : t("gift.cta")}
            </Button>

            <div className="mt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
              <a
                href="https://www.rulofitness.com/#/terms"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t("gift.terms")}
              </a>
              <span>•</span>
              <a
                href="https://www.rulofitness.com/#/privacy"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t("gift.privacy")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
