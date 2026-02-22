"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import {
  getProfile,
  saveProfile,
  clearAllData,
  getTrainingSessions,
  getMeals,
  type UserProfile,
} from "@/lib/storage"
import {
  User,
  Ruler,
  Weight,
  Calendar,
  Target,
  Beef,
  Wheat,
  Droplets,
  Dumbbell,
  Flame,
  Trash2,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  HelpCircle,
  ChevronRight,
} from "lucide-react"

export function ProfileView() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    age: 0,
    sex: "male",
    weight: 0,
    height: 0,
    activityLevel: "moderate",
    goal: "maintain",
    weeklyRateKg: 0.25,
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 250,
    fatGoal: 65,
  })
  const [totalSessions, setTotalSessions] = useState(0)
  const [totalMeals, setTotalMeals] = useState(0)
  const [saved, setSaved] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProfile(getProfile())
    setTotalSessions(getTrainingSessions().length)
    setTotalMeals(getMeals().length)
  }, [])

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  function handleClearData() {
    clearAllData()
    setProfile({
      name: "",
      age: 0,
      sex: "male",
      weight: 0,
      height: 0,
      activityLevel: "moderate",
      goal: "maintain",
      weeklyRateKg: 0.25,
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 65,
    })
    setTotalSessions(0)
    setTotalMeals(0)
    setShowClearConfirm(false)
  }

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const themeOptions = [
    { id: "light", label: t("settings.light"), icon: Sun },
    { id: "dark", label: t("settings.dark"), icon: Moon },
    { id: "system", label: t("settings.system"), icon: Monitor },
  ] as const

  const languageOptions = [
    { id: "en" as const, label: t("settings.english") },
    { id: "es" as const, label: t("settings.spanish") },
  ]

  const supportEmail = "soporte@rulo.ai"
    const supportSubject = encodeURIComponent("Rulo Fitness - Soporte")
    const supportMailto = `mailto:${supportEmail}?subject=${supportSubject}`

    return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("nav.settings")}</h1>

      {/* 1. Cuenta: resumen con avatar, nombre y estadísticas */}
      <section aria-label={t("settings.account")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("settings.account")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {profile.name || user?.name || t("profile.yourProfile")}
              </p>
              {user?.phone && (
                <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Preferencias: idioma y tema */}
      <section aria-label={t("settings.preferences")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("settings.preferences")}
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t("settings.language")}</span>
            </div>
            <div className="flex gap-2">
              {languageOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocale(opt.id)}
                  className="flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                  style={
                    locale === opt.id
                      ? {
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                        }
                      : {
                          background: "var(--secondary)",
                          color: "var(--secondary-foreground)",
                        }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              {mounted && resolvedTheme === "dark" ? (
                <Moon className="h-4 w-4 text-primary" />
              ) : (
                <Sun className="h-4 w-4 text-primary" />
              )}
              <span className="text-sm font-medium text-foreground">{t("settings.theme")}</span>
            </div>
            <div className="flex gap-2">
              {themeOptions.map((opt) => {
                const isSelected = mounted && theme === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
                    style={
                      isSelected
                        ? {
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }
                        : {
                            background: "var(--secondary)",
                            color: "var(--secondary-foreground)",
                          }
                    }
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Perfil: info personal y metas diarias */}
      <section aria-label={t("profile.personalInfo")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("profile.personalInfo")}
        </h2>
        <div className="flex flex-col gap-2">
          <InputRow
            icon={User}
            label={t("profile.name")}
            value={profile.name}
            onChange={(v) => updateField("name", v)}
            type="text"
            placeholder={t("profile.yourName")}
          />
          <InputRow
            icon={Calendar}
            label={t("profile.age")}
            value={profile.age === 0 ? "" : profile.age.toString()}
            onChange={(v) => updateField("age", parseInt(v) || 0)}
            type="number"
            placeholder="25"
            suffix={t("unit.yrs")}
          />
          <InputRow
            icon={Weight}
            label={t("profile.weight")}
            value={profile.weight === 0 ? "" : profile.weight.toString()}
            onChange={(v) => updateField("weight", parseFloat(v) || 0)}
            type="number"
            placeholder="70"
            suffix={t("unit.kg")}
          />
          <InputRow
            icon={Ruler}
            label={t("profile.height")}
            value={profile.height === 0 ? "" : profile.height.toString()}
            onChange={(v) => updateField("height", parseInt(v) || 0)}
            type="number"
            placeholder="175"
            suffix={t("unit.cm")}
          />
        </div>
      </section>

      <section aria-label={t("profile.dailyGoals")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("profile.dailyGoals")}
        </h2>
        <div className="flex flex-col gap-2">
          <InputRow
            icon={Target}
            label={t("macro.calories")}
            value={profile.calorieGoal.toString()}
            onChange={(v) => updateField("calorieGoal", parseInt(v) || 0)}
            type="number"
            placeholder="2000"
            suffix={t("unit.kcal")}
          />
          <InputRow
            icon={Beef}
            label={t("macro.protein")}
            value={profile.proteinGoal.toString()}
            onChange={(v) => updateField("proteinGoal", parseInt(v) || 0)}
            type="number"
            placeholder="150"
            suffix={t("unit.g")}
          />
          <InputRow
            icon={Wheat}
            label={t("macro.carbs")}
            value={profile.carbsGoal.toString()}
            onChange={(v) => updateField("carbsGoal", parseInt(v) || 0)}
            type="number"
            placeholder="250"
            suffix={t("unit.g")}
          />
          <InputRow
            icon={Droplets}
            label={t("macro.fat")}
            value={profile.fatGoal.toString()}
            onChange={(v) => updateField("fatGoal", parseInt(v) || 0)}
            type="number"
            placeholder="65"
            suffix={t("unit.g")}
          />
        </div>
      </section>

      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98]"
      >
        <Save className="h-4 w-4 text-primary-foreground" />
        {saved ? t("profile.saved") : t("profile.saveProfile")}
      </button>

      {/* 4. Contactar soporte */}
      <section aria-label={t("settings.contactSupport")}>
        <a
          href={supportMailto}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors active:scale-[0.99] hover:bg-secondary/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{t("settings.contactSupport")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.contactSupportHint")}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
        </a>
      </section>

      {/* 5. Cerrar sesión */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4 text-primary" />
        {t("profile.logout")}
      </button>

      {/* 6. Zona peligrosa */}
      <section aria-label={t("profile.dangerZone")}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-destructive">
          {t("profile.dangerZone")}
        </h2>
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-all active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4 text-primary" />
            {t("profile.clearAllData")}
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-center text-sm text-destructive">
              {t("profile.clearConfirm")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground transition-all active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5 text-primary" />
                {t("profile.cancel")}
              </button>
              <button
                onClick={handleClearData}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 py-2.5 text-sm font-semibold text-destructive-foreground transition-all active:scale-[0.98]"
              >
                <Trash2 className="h-3.5 w-3.5 text-primary" />
                {t("profile.confirmDelete")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function InputRow({
  icon: Icon,
  label,
  value,
  onChange,
  type,
  placeholder,
  suffix,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  onChange: (value: string) => void
  type: "text" | "number"
  placeholder: string
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
      />
      {suffix && (
        <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>
      )}
    </div>
  )
}
