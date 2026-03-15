"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import Image from "next/image"

export function UpdatePrompt() {
  const { t } = useI18n()
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // If there's already a waiting worker when we load
      if (registration.waiting) {
        setWaitingWorker(registration.waiting)
        setShow(true)
      }

      // Detect new SW installing and waiting
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker)
            setShow(true)
          }
        })
      })
    })

    // When the new SW takes over, reload
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  }, [])

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" })
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-24 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-sm animate-slide-up rounded-2xl border border-border bg-card p-5 card-warm"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Image src="/rulo-isotipo.png" alt="Rulo" width={24} height={24} className="rounded-md" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-foreground">{t("update.title")}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{t("update.description")}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => setShow(false)}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-[14px] font-medium text-muted-foreground transition-colors active:scale-[0.98]"
          >
            {t("update.later")}
          </button>
          <button
            onClick={handleUpdate}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-primary-foreground transition-colors active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            {t("update.now")}
          </button>
        </div>
      </div>
    </div>
  )
}
