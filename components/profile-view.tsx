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
  Trash2,
  Sun,
  Moon,
  Monitor,
  Languages,
  LogOut,
  HelpCircle,
  ChevronRight,
  Check,
} from "lucide-react"

// ── iOS-style helpers ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="section-label px-4 pt-6 pb-2 select-none">
      {children}
    </p>
  )
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-card overflow-hidden divide-y divide-border/40 card-warm">
      {children}
    </div>
  )
}

function IconBadge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]"
      style={{ background: bg }}
    >
      {children}
    </div>
  )
}

function SettingsRow({
  iconBg,
  icon,
  label,
  value,
  chevron = false,
  destructive = false,
  onClick,
  children,
}: {
  iconBg: string
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
      className={`flex w-full items-center gap-3 px-4 min-h-[44px] py-2 text-left transition-colors active:bg-secondary/60 ${destructive ? "active:bg-destructive/10" : ""}`}
      onClick={onClick}
    >
      <IconBadge bg={iconBg}>{icon}</IconBadge>
      <span className={`flex-1 text-[15px] ${destructive ? "text-destructive" : "text-foreground"}`}>
        {label}
      </span>
      {children}
      {value && (
        <span className="text-[15px] text-muted-foreground mr-0.5">{value}</span>
      )}
      {chevron && (
        <ChevronRight className="h-[17px] w-[17px] text-muted-foreground/50 shrink-0" />
      )}
    </Tag>
  )
}

function InputRow({
  iconBg,
  icon,
  label,
  value,
  onChange,
  type,
  placeholder,
  suffix,
}: {
  iconBg: string
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  type: "text" | "number"
  placeholder: string
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 min-h-[44px] py-2 bg-card">
      <IconBadge bg={iconBg}>{icon}</IconBadge>
      <span className="w-24 shrink-0 text-[15px] text-foreground">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[15px] text-right text-foreground outline-none placeholder:text-muted-foreground/30"
      />
      {suffix && (
        <span className="shrink-0 text-[15px] text-muted-foreground ml-1">{suffix}</span>
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
      <h1 className="px-4 pt-2 pb-4 text-[28px] font-bold tracking-tight text-foreground">
        {t("nav.settings")}
      </h1>

      {/* ── Account card ── */}
      <div className="px-4">
        <div className="rounded-[16px] bg-card overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 min-h-[76px]">
            <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-secondary">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-semibold text-foreground truncate">
                {profile.name || user?.name || t("profile.yourProfile")}
              </p>
              {user?.phone && (
                <p className="text-[13px] text-muted-foreground truncate">{user.phone}</p>
              )}
            </div>
            <ChevronRight className="h-[17px] w-[17px] text-muted-foreground/50 shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <SectionLabel>{t("settings.preferences")}</SectionLabel>
      <div className="px-4">
        <SettingsGroup>
          {/* Language row */}
          <SettingsRow
            iconBg="#3B82F6"
            icon={<Languages className="h-4 w-4 text-white" />}
            label={t("settings.language")}
            value={currentLangLabel}
            chevron
            onClick={() => { setShowLangPicker((v) => !v); setShowThemePicker(false) }}
          />
          {showLangPicker && (
            <div className="divide-y divide-border/50">
              {([{ id: "es" as const, label: t("settings.spanish") }, { id: "en" as const, label: t("settings.english") }]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setLocale(opt.id); setShowLangPicker(false) }}
                  className="flex w-full items-center gap-3 pl-[60px] pr-4 py-2 min-h-[44px] text-left active:bg-secondary/60 transition-colors"
                >
                  <span className="flex-1 text-[15px] text-foreground">{opt.label}</span>
                  {locale === opt.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Theme row */}
          <SettingsRow
            iconBg={mounted && resolvedTheme === "dark" ? "#636366" : "#F59E0B"}
            icon={
              mounted && resolvedTheme === "dark"
                ? <Moon className="h-4 w-4 text-white" />
                : <Sun className="h-4 w-4 text-white" />
            }
            label={t("settings.theme")}
            value={currentThemeLabel}
            chevron
            onClick={() => { setShowThemePicker((v) => !v); setShowLangPicker(false) }}
          />
          {showThemePicker && (
            <div className="divide-y divide-border/50">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setTheme(opt.id); setShowThemePicker(false) }}
                  className="flex w-full items-center gap-3 pl-[60px] pr-4 py-2 min-h-[44px] text-left active:bg-secondary/60 transition-colors"
                >
                  <opt.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-[15px] text-foreground">{opt.label}</span>
                  {mounted && theme === opt.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </SettingsGroup>
      </div>

      {/* ── Personal info ── */}
      <SectionLabel>{t("profile.personalInfo")}</SectionLabel>
      <div className="px-4">
        <SettingsGroup>
          <InputRow
            iconBg="#10B981"
            icon={<User className="h-4 w-4 text-white" />}
            label={t("profile.name")}
            value={profile.name}
            onChange={(v) => updateField("name", v)}
            type="text"
            placeholder={t("profile.yourName")}
          />
          <InputRow
            iconBg="#F59E0B"
            icon={<Calendar className="h-4 w-4 text-white" />}
            label={t("profile.age")}
            value={profile.age === 0 ? "" : profile.age.toString()}
            onChange={(v) => updateField("age", parseInt(v) || 0)}
            type="number"
            placeholder="25"
            suffix={t("unit.yrs")}
          />
          <InputRow
            iconBg="#AF52DE"
            icon={<Weight className="h-4 w-4 text-white" />}
            label={t("profile.weight")}
            value={profile.weight === 0 ? "" : profile.weight.toString()}
            onChange={(v) => updateField("weight", parseFloat(v) || 0)}
            type="number"
            placeholder="70"
            suffix={t("unit.kg")}
          />
          <InputRow
            iconBg="#5856D6"
            icon={<Ruler className="h-4 w-4 text-white" />}
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
      <div className="px-4">
        <SettingsGroup>
          <InputRow
            iconBg="#DC2626"
            icon={<Target className="h-4 w-4 text-white" />}
            label={t("macro.calories")}
            value={profile.calorieGoal.toString()}
            onChange={(v) => updateField("calorieGoal", parseInt(v) || 0)}
            type="number"
            placeholder="2000"
            suffix={t("unit.kcal")}
          />
          <InputRow
            iconBg="#FF6B35"
            icon={<Beef className="h-4 w-4 text-white" />}
            label={t("macro.protein")}
            value={profile.proteinGoal.toString()}
            onChange={(v) => updateField("proteinGoal", parseInt(v) || 0)}
            type="number"
            placeholder="150"
            suffix={t("unit.g")}
          />
          <InputRow
            iconBg="#FFB300"
            icon={<Wheat className="h-4 w-4 text-white" />}
            label={t("macro.carbs")}
            value={profile.carbsGoal.toString()}
            onChange={(v) => updateField("carbsGoal", parseInt(v) || 0)}
            type="number"
            placeholder="250"
            suffix={t("unit.g")}
          />
          <InputRow
            iconBg="#32ADE6"
            icon={<Droplets className="h-4 w-4 text-white" />}
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
      <div className="px-4 pt-6">
        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground transition-all active:scale-[0.98] active:opacity-85"
        >
          {saved ? t("profile.saved") : t("profile.saveProfile")}
        </button>
      </div>

      {/* ── Support ── */}
      <SectionLabel>{t("settings.contactSupport")}</SectionLabel>
      <div className="px-4">
        <SettingsGroup>
          <a
            href={supportMailto}
            className="flex items-center gap-3 px-4 min-h-[44px] py-2 active:bg-secondary/60 transition-colors"
          >
            <IconBadge bg="#10B981">
              <HelpCircle className="h-4 w-4 text-white" />
            </IconBadge>
            <span className="flex-1 text-[15px] text-foreground">{t("settings.contactSupport")}</span>
            <span className="text-[15px] text-muted-foreground mr-0.5 text-right text-[13px] truncate max-w-[120px]">
              {t("settings.contactSupportHint")}
            </span>
            <ChevronRight className="h-[17px] w-[17px] text-muted-foreground/50 shrink-0" />
          </a>
        </SettingsGroup>
      </div>

      {/* ── Logout ── */}
      <div className="px-4 pt-6">
        <SettingsGroup>
          <SettingsRow
            iconBg="#DC2626"
            icon={<LogOut className="h-4 w-4 text-white" />}
            label={t("profile.logout")}
            destructive
            onClick={handleLogout}
          />
        </SettingsGroup>
      </div>

      {/* ── Danger zone ── */}
      <SectionLabel>{t("profile.dangerZone")}</SectionLabel>
      <div className="px-4">
        <SettingsGroup>
          {!showClearConfirm ? (
            <SettingsRow
              iconBg="#DC2626"
              icon={<Trash2 className="h-4 w-4 text-white" />}
              label={t("profile.clearAllData")}
              destructive
              onClick={() => setShowClearConfirm(true)}
            />
          ) : (
            <div className="px-4 py-4 flex flex-col gap-3">
              <p className="text-[14px] text-center text-muted-foreground">
                {t("profile.clearConfirm")}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-[8px] bg-secondary py-2.5 text-[15px] font-medium text-foreground active:opacity-75"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="flex-1 rounded-[8px] bg-destructive py-2.5 text-[15px] font-semibold text-white active:opacity-75"
                >
                  {t("profile.confirmDelete")}
                </button>
              </div>
            </div>
          )}
        </SettingsGroup>
      </div>
    </div>
  )
}
