"use client"

interface MacroRingCardProps {
  label: string
  current: number
  goal: number
  color: string
}

export function MacroRingCard({ label, current, goal, color }: MacroRingCardProps) {
  const size = 50
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = Math.min((current / goal) * 100, 100)
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="macro-ring-card card-warm">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="var(--secondary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-mini-ring-fill"
            style={{
              "--mini-ring-circumference": circumference,
              "--mini-ring-offset": offset,
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {Math.round(percent)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[14px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          {current}<span className="text-[11px] text-muted-foreground font-normal">/{goal}g</span>
        </span>
      </div>
    </div>
  )
}
