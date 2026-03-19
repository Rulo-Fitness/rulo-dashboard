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
  getWeekSessions,
  getWeekMeals,
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
  Trash2,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  HelpCircle,
  ChevronRight,
  Check,
  Smartphone,
  BarChart3,
  Share,
  X,
  Dumbbell,
  UtensilsCrossed,
  Flame,
} from "lucide-react"

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// ── Pulse 2 style helpers ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-[13px] font-semibold tracking-wide pl-[44px] pr-6 pt-8 pb-3 select-none">
      {children}
    </p>
  )
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children]
  return (
    <div className="rounded-[32px] bg-card overflow-hidden card-shadow">
      {items.map((child, i) => (
        <div key={i}>
          {i > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
          {child}
        </div>
      ))}
    </div>
  )
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
      {children}
    </div>
  )
}

function SettingsRow({
  icon,
  label,
  value,
  chevron = false,
  destructive = false,
  onClick,
  children,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  chevron?: boolean
  destructive?: boolean
  onClick?: () => void
  children?: React.ReactNode
}) {
  const Tag = onClick ? "button" : ("div" as "div")
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`flex w-full items-center gap-4 px-5 min-h-[56px] py-3 text-left transition-colors active:bg-secondary/60 ${destructive ? "active:bg-destructive/10" : ""}`}
      onClick={onClick}
    >
      <IconBox>{icon}</IconBox>
      <span className={`flex-1 text-[15px] font-bold ${destructive ? "text-destructive" : "text-foreground"}`}>
        {label}
      </span>
      {children}
      {value && (
        <span className="text-[13px] text-muted-foreground">{value}</span>
      )}
      {chevron && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
    </Tag>
  )
}

function InputRow({
  icon,
  label,
  value,
  onChange,
  type,
  placeholder,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  type: "text" | "number"
  placeholder: string
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-4 px-5 min-h-[56px] py-3 bg-card">
      <IconBox>{icon}</IconBox>
      <span className="w-24 shrink-0 text-[15px] font-bold text-foreground">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[15px] text-right text-foreground outline-none placeholder:text-muted-foreground/30"
      />
      {suffix && (
        <span className="shrink-0 text-[13px] text-muted-foreground">{suffix}</span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const [saved, setSaved] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [openInstall, setOpenInstall] = useState(false)
  const [openReport, setOpenReport] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProfile(getProfile())
  }, [])

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogout() {
    logout()
    router.replace("/sign-in")
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
    setShowClearConfirm(false)
  }

  function updateField<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const currentThemeLabel =
    !mounted ? "" : theme === "dark" ? t("settings.dark") : theme === "light" ? t("settings.light") : t("settings.system")

  const currentLangLabel = locale === "es" ? t("settings.spanish") : t("settings.english")

  const themeOptions = [
    { id: "light" as const, label: t("settings.light"), icon: Sun },
    { id: "dark" as const, label: t("settings.dark"), icon: Moon },
    { id: "system" as const, label: t("settings.system"), icon: Monitor },
  ]

  const supportEmail = "soporte@rulo.ai"
  const supportSubject = encodeURIComponent("Rulo Fitness - Soporte")
  const supportMailto = `mailto:${supportEmail}?subject=${supportSubject}`

  return (
    <div className="flex flex-col pb-10">
      {/* Large title */}
      <h1 className="px-6 pt-2 pb-2 text-[28px] font-black tracking-tight text-foreground">
        {t("nav.settings")}
      </h1>

      {/* ── Account card ── */}
      <div className="px-6 pt-4">
        <div className="rounded-[32px] bg-card overflow-hidden card-shadow">
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary">
              <User className="h-7 w-7 text-foreground" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-bold text-foreground truncate">
                {profile.name || user?.name || t("profile.yourProfile")}
              </p>
              {user?.phone && (
                <p className="text-[13px] text-muted-foreground truncate">{user.phone}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <SectionLabel>{t("settings.preferences")}</SectionLabel>
      <div className="px-6">
        <SettingsGroup>
          {/* Language row */}
          <SettingsRow
            icon={<Languages className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("settings.language")}
            value={currentLangLabel}
            chevron
            onClick={() => { setShowLangPicker((v) => !v); setShowThemePicker(false) }}
          />
          {showLangPicker && (
            <div>
              {([{ id: "es" as const, label: t("settings.spanish") }, { id: "en" as const, label: t("settings.english") }]).map((opt, i) => (
                <div key={opt.id}>
                  {i > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
                  <button
                    type="button"
                    onClick={() => { setLocale(opt.id); setShowLangPicker(false) }}
                    className="flex w-full items-center gap-3 pl-[62px] pr-5 py-3 min-h-[48px] text-left active:bg-secondary/60 transition-colors"
                  >
                    <span className="flex-1 text-[15px] text-foreground">{opt.label}</span>
                    {locale === opt.id && <Check className="h-5 w-5 text-foreground shrink-0" strokeWidth={2.2} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Theme row */}
          <SettingsRow
            icon={
              mounted && resolvedTheme === "dark"
                ? <Moon className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                : <Sun className="h-5 w-5 text-foreground" strokeWidth={2.2} />
            }
            label={t("settings.theme")}
            value={currentThemeLabel}
            chevron
            onClick={() => { setShowThemePicker((v) => !v); setShowLangPicker(false) }}
          />
          {showThemePicker && (
            <div>
              {themeOptions.map((opt, i) => (
                <div key={opt.id}>
                  {i > 0 && <div className="ml-[76px] mr-5 h-px bg-border" />}
                  <button
                    type="button"
                    onClick={() => { setTheme(opt.id); setShowThemePicker(false) }}
                    className="flex w-full items-center gap-3 pl-[62px] pr-5 py-3 min-h-[48px] text-left active:bg-secondary/60 transition-colors"
                  >
                    <opt.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-[15px] text-foreground">{opt.label}</span>
                    {mounted && theme === opt.id && <Check className="h-5 w-5 text-foreground shrink-0" strokeWidth={2.2} />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Install app */}
          <SettingsRow
            icon={<Smartphone className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("dashboard.boxInstall")}
            chevron
            onClick={() => setOpenInstall(true)}
          />

          {/* Weekly report */}
          <SettingsRow
            icon={<BarChart3 className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("dashboard.boxReport")}
            chevron
            onClick={() => setOpenReport(true)}
          />
        </SettingsGroup>
      </div>

      {/* ── Personal info ── */}
      <SectionLabel>{t("profile.personalInfo")}</SectionLabel>
      <div className="px-6">
        <SettingsGroup>
          <InputRow
            icon={<User className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.name")}
            value={profile.name}
            onChange={(v) => updateField("name", v)}
            type="text"
            placeholder={t("profile.yourName")}
          />
          <InputRow
            icon={<Calendar className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.age")}
            value={profile.age === 0 ? "" : profile.age.toString()}
            onChange={(v) => updateField("age", parseInt(v) || 0)}
            type="number"
            placeholder="25"
            suffix={t("unit.yrs")}
          />
          <InputRow
            icon={<Weight className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.weight")}
            value={profile.weight === 0 ? "" : profile.weight.toString()}
            onChange={(v) => updateField("weight", parseFloat(v) || 0)}
            type="number"
            placeholder="70"
            suffix={t("unit.kg")}
          />
          <InputRow
            icon={<Ruler className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.height")}
            value={profile.height === 0 ? "" : profile.height.toString()}
            onChange={(v) => updateField("height", parseInt(v) || 0)}
            type="number"
            placeholder="175"
            suffix={t("unit.cm")}
          />
        </SettingsGroup>
      </div>

      {/* ── Daily goals ── */}
      <SectionLabel>{t("profile.dailyGoals")}</SectionLabel>
      <div className="px-6">
        <SettingsGroup>
          <InputRow
            icon={<Target className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("macro.calories")}
            value={profile.calorieGoal.toString()}
            onChange={(v) => updateField("calorieGoal", parseInt(v) || 0)}
            type="number"
            placeholder="2000"
            suffix={t("unit.kcal")}
          />
          <InputRow
            icon={<Beef className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("macro.protein")}
            value={profile.proteinGoal.toString()}
            onChange={(v) => updateField("proteinGoal", parseInt(v) || 0)}
            type="number"
            placeholder="150"
            suffix={t("unit.g")}
          />
          <InputRow
            icon={<Wheat className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("macro.carbs")}
            value={profile.carbsGoal.toString()}
            onChange={(v) => updateField("carbsGoal", parseInt(v) || 0)}
            type="number"
            placeholder="250"
            suffix={t("unit.g")}
          />
          <InputRow
            icon={<Droplets className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("macro.fat")}
            value={profile.fatGoal.toString()}
            onChange={(v) => updateField("fatGoal", parseInt(v) || 0)}
            type="number"
            placeholder="65"
            suffix={t("unit.g")}
          />
        </SettingsGroup>
      </div>

      {/* Save button */}
      <div className="px-6 pt-6">
        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-4 text-[15px] font-bold text-background transition-all active:scale-[0.98] active:opacity-85"
        >
          {saved ? t("profile.saved") : t("profile.saveProfile")}
        </button>
      </div>

      {/* ── Support ── */}
      <SectionLabel>{t("settings.contactSupport")}</SectionLabel>
      <div className="px-6">
        <SettingsGroup>
          <a
            href={supportMailto}
            className="flex items-center gap-4 px-5 min-h-[56px] py-3 active:bg-secondary/60 transition-colors"
          >
            <IconBox>
              <HelpCircle className="h-5 w-5 text-foreground" strokeWidth={2.2} />
            </IconBox>
            <span className="flex-1 text-[15px] font-bold text-foreground">{t("settings.contactSupport")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </a>
        </SettingsGroup>
      </div>

      {/* ── Logout ── */}
      <div className="px-6 pt-6">
        <SettingsGroup>
          <SettingsRow
            icon={<LogOut className="h-5 w-5 text-destructive" strokeWidth={2.2} />}
            label={t("profile.logout")}
            destructive
            onClick={handleLogout}
          />
        </SettingsGroup>
      </div>

      {/* ── Danger zone ── */}
      <SectionLabel>{t("profile.dangerZone")}</SectionLabel>
      <div className="px-6">
        <SettingsGroup>
          {!showClearConfirm ? (
            <SettingsRow
              icon={<Trash2 className="h-5 w-5 text-destructive" strokeWidth={2.2} />}
              label={t("profile.clearAllData")}
              destructive
              onClick={() => setShowClearConfirm(true)}
            />
          ) : (
            <div className="px-5 py-5 flex flex-col gap-3">
              <p className="text-[14px] text-center text-muted-foreground">
                {t("profile.clearConfirm")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-2xl bg-secondary py-3 text-[15px] font-bold text-foreground active:opacity-75"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="flex-1 rounded-2xl bg-destructive py-3 text-[15px] font-bold text-white active:opacity-75"
                >
                  {t("profile.confirmDelete")}
                </button>
              </div>
            </div>
          )}
        </SettingsGroup>
      </div>

      {/* ── Install App Panel ── */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: openInstall ? "auto" : "none",
          visibility: openInstall ? "visible" : "hidden",
        }}
        aria-hidden={!openInstall}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: openInstall ? 1 : 0 }}
          onClick={() => setOpenInstall(false)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: openInstall ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <h2 className="text-xl font-bold text-foreground">{t("dashboard.installTitle")}</h2>
            <button
              type="button"
              onClick={() => setOpenInstall(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <p className="text-sm text-muted-foreground mb-5">{t("install.subtitle")}</p>
            <ol className="space-y-3 text-sm text-foreground">
              {isIOS() ? (
                <>
                  <li className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">1</span>
                    <span className="font-medium">{t("install.iosStep1")}</span>
                    <Share className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </li>
                  <li className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">2</span>
                    <span className="font-medium">{t("install.iosStep2")}</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">3</span>
                    <span className="font-medium">{t("install.iosStep3")}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">1</span>
                    <span className="font-medium">{t("install.androidStep1")}</span>
                  </li>
                  <li className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">2</span>
                    <span className="font-medium">{t("install.androidStep2")}</span>
                  </li>
                </>
              )}
            </ol>
          </div>
        </div>
      </div>

      {/* ── Weekly Report Panel ── */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: openReport ? "auto" : "none",
          visibility: openReport ? "visible" : "hidden",
        }}
        aria-hidden={!openReport}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: openReport ? 1 : 0 }}
          onClick={() => setOpenReport(false)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: openReport ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("dashboard.recapTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("dashboard.recapSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpenReport(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {openReport && (() => {
              const weekSessions = getWeekSessions()
              const weekMeals = getWeekMeals()
              const totalExercises = weekSessions.reduce((sum, s) => sum + s.exercises.length, 0)
              const totalCalories = weekMeals.reduce((sum, m) => sum + m.calories, 0)
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[24px] bg-secondary p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{weekSessions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.recapSessions")}</p>
                  </div>
                  <div className="rounded-[24px] bg-secondary p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{totalExercises}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.recapExercises")}</p>
                  </div>
                  <div className="rounded-[24px] bg-secondary p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{weekMeals.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.recapMeals")}</p>
                  </div>
                  <div className="rounded-[24px] bg-secondary p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                    </div>
                    <p className="text-2xl font-black text-foreground">{totalCalories.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("dashboard.recapCalories")}</p>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
