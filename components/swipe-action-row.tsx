"use client"

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { Pencil, Trash, X } from "lucide-react"

const ACTION_WIDTH = 152

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

type SwipeActionRowProps = {
  children: ReactNode
  isOpen: boolean
  disabled?: boolean
  editLabel: string
  deleteLabel: string
  onOpen: () => void
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function SwipeActionRow({
  children,
  isOpen,
  disabled,
  editLabel,
  deleteLabel,
  onOpen,
  onClose,
  onEdit,
  onDelete,
}: SwipeActionRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const drag = useRef({
    active: false,
    horizontal: false,
    startX: 0,
    startY: 0,
    startOffset: 0,
  })

  const restingOffset = isOpen ? -ACTION_WIDTH : 0
  const offset = drag.current.active && drag.current.horizontal ? dragOffset : restingOffset

  useEffect(() => {
    if (!isOpen) return

    function handleOutsidePointerDown(event: globalThis.PointerEvent) {
      if (!rowRef.current?.contains(event.target as Node)) onClose()
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown)
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown)
  }, [isOpen, onClose])

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled) return
    drag.current = {
      active: true,
      horizontal: false,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: restingOffset,
    }
    setDragOffset(restingOffset)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active || disabled) return

    const dx = event.clientX - drag.current.startX
    const dy = event.clientY - drag.current.startY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (!drag.current.horizontal) {
      if (absDy > absDx && absDy > 8) return
      if (absDx < 8) return
      drag.current.horizontal = true
    }

    event.preventDefault()
    setDragOffset(clamp(drag.current.startOffset + dx, -ACTION_WIDTH, 0))
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return

    const wasHorizontal = drag.current.horizontal
    const finalOffset = wasHorizontal ? dragOffset : restingOffset
    drag.current.active = false
    drag.current.horizontal = false
    event.currentTarget.releasePointerCapture(event.pointerId)

    if (!wasHorizontal) {
      if (isOpen) onClose()
      return
    }

    if (finalOffset < -ACTION_WIDTH / 2) onOpen()
    else onClose()
  }

  return (
    <div ref={rowRef} className="relative overflow-hidden bg-card">
      <div className="absolute inset-y-0 right-0 flex w-[152px]">
        <button
          type="button"
          disabled={disabled}
          onClick={onEdit}
          className="flex w-[76px] flex-col items-center justify-center gap-1 bg-secondary text-foreground transition-colors active:brightness-95 disabled:opacity-40"
        >
          <Pencil className="h-5 w-5" strokeWidth={2.4} />
          <span className="text-[11px] font-semibold">{editLabel}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="flex w-[76px] flex-col items-center justify-center gap-1 bg-foreground/12 text-foreground transition-colors active:brightness-95 disabled:opacity-40 dark:bg-foreground/18"
        >
          <Trash className="h-5 w-5" strokeWidth={2.4} />
          <span className="text-[11px] font-semibold">{deleteLabel}</span>
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${offset}px)`,
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  )
}

type DeleteConfirmSheetProps = {
  open: boolean
  title: string
  itemName: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmSheet({
  open,
  title,
  itemName,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: DeleteConfirmSheetProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-end"
      style={{
        pointerEvents: open ? "auto" : "none",
        visibility: open ? "visible" : "hidden",
      }}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
        onClick={onCancel}
        aria-hidden
      />
      <div
        className="relative mx-auto flex w-full max-w-md flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <header className="flex shrink-0 items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
            aria-label={cancelLabel}
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </header>
        <div className="px-6 pb-8">
          <p className="text-center text-[15px] leading-6 text-muted-foreground">
            {itemName}
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={onConfirm}
              className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-4 text-[15px] font-semibold text-background active:scale-[0.99]"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-12 w-full items-center justify-center rounded-full bg-secondary px-4 text-[15px] font-semibold text-foreground active:scale-[0.99]"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
