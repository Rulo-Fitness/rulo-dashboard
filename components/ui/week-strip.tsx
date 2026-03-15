"use client"

interface WeekStripProps {
  selectedDate: string
  dataMap: Record<string, { training: boolean; meals: boolean }>
  locale?: string
}

export function WeekStrip({ selectedDate, dataMap, locale = "en" }: WeekStripProps) {
  const loc = locale === "es" ? "es-ES" : "en-US"

  // Get Mon-Sun for the week containing selectedDate
  const d = new Date(selectedDate + "T12:00:00")
  const daysFromMonday = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - daysFromMonday)
  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    weekDates.push(day.toISOString().split("T")[0])
  }

  return (
    <div className="flex gap-1 py-2">
      {weekDates.map((dateStr) => {
        const isSelected = dateStr === selectedDate
        const data = dataMap[dateStr]
        const hasData = data?.training || data?.meals
        const dayLetter = new Date(dateStr + "T12:00:00")
          .toLocaleDateString(loc, { weekday: "narrow" })

        return (
          <div key={dateStr} className="flex flex-1 flex-col items-center gap-1">
            <span className={`text-[11px] font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
              {dayLetter}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              {new Date(dateStr + "T12:00:00").getDate()}
            </div>
            {hasData && (
              <div className="h-1 w-1 rounded-full bg-primary" />
            )}
            {!hasData && (
              <div className="h-1 w-1" />
            )}
          </div>
        )
      })}
    </div>
  )
}
