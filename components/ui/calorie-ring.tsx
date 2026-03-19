"use client"

interface CalorieRingProps {
  current: number
  goal: number
  size?: number
  label?: string
}

export function CalorieRing({ current, goal, size = 200, label }: CalorieRingProps) {
  const strokeWidth = size >= 150 ? 12 : 8
  const radius = (size - strokeWidth) / 2 - 4
  const circumference = 2 * Math.PI * radius
  const percent = Math.min((current / goal) * 100, 120)
  const isOver = current > goal
  const diff = isOver ? current - goal : goal - current
  const offset = circumference * (1 - Math.min(percent, 100) / 100)

  const cx = size / 2
  const cy = size / 2
  const fontSize = size >= 150 ? "text-[36px]" : "text-[22px]"
  const subSize = size >= 150 ? "text-[13px]" : "text-[11px]"

  return (
    <div className="relative flex items-center justify-center calorie-ring-bg" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={isOver ? "var(--destructive)" : "var(--foreground)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-ring-fill"
          style={{
            "--ring-circumference": circumference,
            "--ring-offset": offset,
          } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${fontSize} font-black text-foreground tracking-tighter leading-none`} style={{ fontVariantNumeric: "tabular-nums" }}>
          {diff.toLocaleString()}
        </span>
        <span className={`${subSize} text-muted-foreground mt-1 font-medium`}>
          {label}
        </span>
      </div>
    </div>
  )
}
