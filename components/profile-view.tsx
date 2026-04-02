"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/lib/hooks/use-subscription"
import {
  getProfile,
  saveProfile,
  clearAllData,
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
  Trophy,
  Share,
  X,
} from "lucide-react"
import { AppSignature } from "@/components/app-signature"

type SettingsPicker = "language" | "theme" | null
type ProfileFieldKey =
  | "name"
  | "age"
  | "weight"
  | "height"
  | "calorieGoal"
  | "proteinGoal"
  | "carbsGoal"
  | "fatGoal"
  | null

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// ── Pulse 2 style helpers ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-[13px] font-semibold tracking-wide pl-5 pt-5 pb-2 select-none">
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
      <span className="flex-1 text-[15px] font-medium text-foreground">
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

function FieldRow({
  icon,
  label,
  value,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-4 px-5 min-h-[56px] py-3 bg-card text-left transition-colors active:bg-secondary/60 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <IconBox>{icon}</IconBox>
      <span className="w-32 shrink-0 text-[15px] font-medium leading-tight text-foreground">{label}</span>
      <div className="ml-auto w-[96px] shrink-0">
        <span className="block w-full text-[15px] text-right text-muted-foreground">
          {value}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileView({
  onOverlayChange,
  onOpenRecap,
  recapOpen,
  recapSource,
}: {
  onOverlayChange?: (open: boolean) => void
  onOpenRecap: () => void
  recapOpen: boolean
  recapSource: "analytics" | "settings" | null
}) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { isActive: subActive } = useSubscription()
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
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [openPicker, setOpenPicker] = useState<SettingsPicker>(null)
  const [openField, setOpenField] = useState<ProfileFieldKey>(null)
  const [fieldValue, setFieldValue] = useState("")
  const [openInstall, setOpenInstall] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProfile(getProfile())
  }, [])

  useEffect(() => {
    onOverlayChange?.(Boolean(openPicker || openField || openInstall || showClearConfirm || showLogoutConfirm))
  }, [onOverlayChange, openPicker, openField, openInstall, showClearConfirm, showLogoutConfirm])

  function getFieldLabel(field: Exclude<ProfileFieldKey, null>) {
    if (field === "name") return t("profile.name")
    if (field === "age") return t("profile.age")
    if (field === "weight") return `${t("profile.weight")} (${t("unit.kg")})`
    if (field === "height") return `${t("profile.height")} (${t("unit.cm")})`
    if (field === "calorieGoal") return `${t("macro.calories")} (${t("unit.kcal")})`
    if (field === "proteinGoal") return `${t("macro.protein")} (${t("unit.g")})`
    if (field === "carbsGoal") return `${t("macro.carbs")} (${t("unit.g")})`
    return `${t("macro.fat")} (${t("unit.g")})`
  }

  function openFieldEditor(field: Exclude<ProfileFieldKey, null>) {
    const value = profile[field]
    setOpenField(field)
    setFieldValue(typeof value === "string" ? value : String(value || ""))
  }

  function handleFieldSave() {
    if (!openField) return

    if (openField === "name") {
      const nextValue = fieldValue.trim()
      updateField("name", nextValue)
      saveProfile({ ...profile, name: nextValue })
    } else {
      const parsed = Number(fieldValue)
      if (Number.isNaN(parsed)) return
      updateField(openField, parsed as UserProfile[typeof openField])
      saveProfile({ ...profile, [openField]: parsed })
    }

    setOpenField(null)
    setFieldValue("")
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
  const recapMorphEnabled = recapSource === "settings" || (recapOpen && recapSource === "settings")

  return (
    <div className="flex flex-col gap-4 pb-10 px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("nav.settings")}
        </h1>
      </div>

      {/* ── Profile header ── */}
      <div className="pt-2">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm">
            <User className="h-10 w-10 text-foreground" strokeWidth={2.2} />
          </div>
          <p className="mt-4 text-[24px] font-bold tracking-tight text-foreground">
            {profile.name || user?.name || t("profile.yourProfile")}
          </p>
          {user?.phone && (
            <p className="mt-1 text-[14px] text-muted-foreground">{user.phone}</p>
          )}
        </div>
      </div>

      {/* ── Preferences ── */}
      <SectionLabel>{t("settings.preferences")}</SectionLabel>
      <div>
        <SettingsGroup>
          {/* Language row */}
          <SettingsRow
            icon={<Languages className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("settings.language")}
            value={currentLangLabel}
            chevron
            onClick={() => setOpenPicker("language")}
          />

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
            onClick={() => setOpenPicker("theme")}
          />

          {/* Install app */}
          <SettingsRow
            icon={<Smartphone className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("dashboard.boxInstall")}
            chevron
            onClick={() => setOpenInstall(true)}
          />

          <button
            type="button"
            onClick={onOpenRecap}
            className="relative isolate flex w-full items-center gap-4 overflow-hidden px-5 min-h-[56px] py-3 text-left transition-colors active:bg-secondary/60"
          >
            {recapMorphEnabled ? (
              <>
                <motion.div
                  layoutId="training-recap-shell"
                  className="absolute inset-0 bg-[linear-gradient(135deg,#1f2937_0%,#0f172a_42%,#111827_100%)] opacity-[0.14]"
                  transition={{
                    type: "spring",
                    stiffness: 230,
                    damping: 28,
                    mass: 1,
                  }}
                />
                <motion.div
                  layoutId="training-recap-glow"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%)] opacity-60"
                  transition={{
                    type: "spring",
                    stiffness: 230,
                    damping: 28,
                    mass: 1,
                  }}
                  aria-hidden
                />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-card" />
              </>
            )}
            <div className="relative z-10 flex w-full items-center gap-4">
              <IconBox>
                <Trophy className="h-5 w-5 text-foreground" strokeWidth={2.2} />
              </IconBox>
              <span className="flex-1 text-[15px] font-medium text-foreground">{t("analytics.recapMockCta")}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </div>
          </button>
        </SettingsGroup>
      </div>

      {/* ── Personal info ── */}
      <SectionLabel>{t("profile.personalInfo")}</SectionLabel>
      <div>
        <SettingsGroup>
          <FieldRow
            icon={<User className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.name")}
            value={profile.name || t("profile.yourName")}
            onClick={() => openFieldEditor("name")}
            disabled={!subActive}
          />
          <FieldRow
            icon={<Calendar className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.age")}
            value={profile.age === 0 ? "25" : profile.age.toString()}
            onClick={() => openFieldEditor("age")}
            disabled={!subActive}
          />
          <FieldRow
            icon={<Weight className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={`${t("profile.weight")} (${t("unit.kg")})`}
            value={profile.weight === 0 ? "70" : profile.weight.toString()}
            onClick={() => openFieldEditor("weight")}
            disabled={!subActive}
          />
          <FieldRow
            icon={<Ruler className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={`${t("profile.height")} (${t("unit.cm")})`}
            value={profile.height === 0 ? "175" : profile.height.toString()}
            onClick={() => openFieldEditor("height")}
            disabled={!subActive}
          />
        </SettingsGroup>
      </div>

      {/* ── Daily goals ── */}
      <SectionLabel>{t("profile.dailyGoals")}</SectionLabel>
      <div>
        <SettingsGroup>
          <FieldRow
            icon={<Target className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={`${t("macro.calories")} (${t("unit.kcal")})`}
            value={profile.calorieGoal.toString()}
            onClick={() => openFieldEditor("calorieGoal")}
            disabled={!subActive}
          />
          <FieldRow
            icon={<Beef className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={`${t("macro.protein")} (${t("unit.g")})`}
            value={profile.proteinGoal.toString()}
            onClick={() => openFieldEditor("proteinGoal")}
            disabled={!subActive}
          />
          <FieldRow
            icon={<Wheat className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={`${t("macro.carbs")} (${t("unit.g")})`}
            value={profile.carbsGoal.toString()}
            onClick={() => openFieldEditor("carbsGoal")}
            disabled={!subActive}
          />
          <FieldRow
            icon={<Droplets className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={`${t("macro.fat")} (${t("unit.g")})`}
            value={profile.fatGoal.toString()}
            onClick={() => openFieldEditor("fatGoal")}
            disabled={!subActive}
          />
        </SettingsGroup>
      </div>

      <SectionLabel>{t("settings.account")}</SectionLabel>
      <div>
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

          <SettingsRow
            icon={<LogOut className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.logout")}
            destructive
            onClick={() => setShowLogoutConfirm(true)}
          />

          <SettingsRow
            icon={<Trash2 className="h-5 w-5 text-foreground" strokeWidth={2.2} />}
            label={t("profile.clearAllData")}
            destructive
            onClick={() => setShowClearConfirm(true)}
          />
        </SettingsGroup>
      </div>

      <AppSignature className="pt-6" />

      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: showLogoutConfirm ? "auto" : "none",
          visibility: showLogoutConfirm ? "visible" : "hidden",
        }}
        aria-hidden={!showLogoutConfirm}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: showLogoutConfirm ? 1 : 0 }}
          onClick={() => setShowLogoutConfirm(false)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: showLogoutConfirm ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("profile.logout")}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <p className="text-[14px] text-center text-muted-foreground">
              {t("profile.logoutConfirm")}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-2xl bg-secondary py-3 text-[15px] font-bold text-foreground active:opacity-75"
              >
                {t("profile.cancel")}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-2xl bg-destructive py-3 text-[15px] font-bold text-white active:opacity-75"
              >
                {t("profile.confirmLogout")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: showClearConfirm ? "auto" : "none",
          visibility: showClearConfirm ? "visible" : "hidden",
        }}
        aria-hidden={!showClearConfirm}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: showClearConfirm ? 1 : 0 }}
          onClick={() => setShowClearConfirm(false)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: showClearConfirm ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("profile.clearAllData")}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <p className="text-[14px] text-center text-muted-foreground">
              {t("profile.clearConfirm")}
            </p>
            <div className="mt-6 flex gap-3">
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
        </div>
      </div>

      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: openField ? "auto" : "none",
          visibility: openField ? "visible" : "hidden",
        }}
        aria-hidden={!openField}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: openField ? 1 : 0 }}
          onClick={() => setOpenField(null)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: openField ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {openField ? getFieldLabel(openField) : ""}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpenField(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <div className="mx-auto w-full max-w-xs">
              <input
                type={openField === "name" ? "text" : "number"}
                inputMode={openField === "name" ? "text" : "decimal"}
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder={openField === "name" ? t("profile.yourName") : ""}
                className="h-12 w-full rounded-2xl bg-secondary px-4 text-center text-base text-foreground outline-none placeholder:text-muted-foreground/40"
                autoFocus
              />
              <button
                type="button"
                onClick={handleFieldSave}
                className="mt-10 flex h-12 w-full items-center justify-center rounded-full bg-secondary px-4 text-[15px] font-semibold text-foreground transition-colors active:scale-[0.99] active:opacity-85"
              >
                {t("profile.saveProfile")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Settings Picker Panel ── */}
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        style={{
          pointerEvents: openPicker ? "auto" : "none",
          visibility: openPicker ? "visible" : "hidden",
        }}
        aria-hidden={!openPicker}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: openPicker ? 1 : 0 }}
          onClick={() => setOpenPicker(null)}
          aria-hidden
        />
        <div
          className="relative mx-auto flex w-full max-w-md max-h-[85dvh] flex-col rounded-t-[32px] bg-card shadow-xl transition-transform duration-300 ease-out"
          style={{ transform: openPicker ? "translateY(0)" : "translateY(100%)" }}
        >
          <header className="flex shrink-0 items-center justify-between px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {openPicker === "language" ? t("settings.language") : t("settings.theme")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {openPicker === "language" ? currentLangLabel : currentThemeLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenPicker(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground active:scale-95"
              aria-label={t("profile.cancel")}
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <div className="overflow-hidden">
              {openPicker === "language" &&
                ([{ id: "es" as const, label: t("settings.spanish") }, { id: "en" as const, label: t("settings.english") }]).map((opt, i) => (
                  <div key={opt.id}>
                    {i > 0 && <div className="ml-[68px] mr-5 h-px bg-border" />}
                    <button
                      type="button"
                      onClick={() => {
                        setLocale(opt.id)
                        setOpenPicker(null)
                      }}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors active:bg-secondary/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card">
                        <Languages className="h-5 w-5 text-foreground" strokeWidth={2.2} />
                      </div>
                      <span className="flex-1 text-[15px] font-medium text-foreground">{opt.label}</span>
                      {locale === opt.id && <Check className="h-5 w-5 text-foreground shrink-0" strokeWidth={2.2} />}
                    </button>
                  </div>
                ))}

              {openPicker === "theme" &&
                themeOptions.map((opt, i) => (
                  <div key={opt.id}>
                    {i > 0 && <div className="ml-[68px] mr-5 h-px bg-border" />}
                    <button
                      type="button"
                      onClick={() => {
                        setTheme(opt.id)
                        setOpenPicker(null)
                      }}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors active:bg-secondary/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card">
                        <opt.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="flex-1 text-[15px] font-medium text-foreground">{opt.label}</span>
                      {mounted && theme === opt.id && <Check className="h-5 w-5 text-foreground shrink-0" strokeWidth={2.2} />}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
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
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("dashboard.boxInstall")}</h2>
              <p className="mt-1 max-w-[240px] text-sm leading-5 text-muted-foreground">
                {t("install.subtitle")}
              </p>
            </div>
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
            <ol className="mx-auto w-full max-w-[320px] overflow-hidden text-sm text-foreground">
              {isIOS() ? (
                <>
                  <li className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-bold">1</span>
                    <div className="min-w-0 flex flex-1 items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{t("install.iosStep1")}</p>
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-secondary px-3 text-sm font-semibold text-foreground">
                        ...
                      </span>
                    </div>
                  </li>
                  <div className="h-px bg-border" />
                  <li className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-bold">2</span>
                    <div className="min-w-0 flex flex-1 items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{t("install.iosStep2")}</p>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                        <Share className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </div>
                  </li>
                  <div className="h-px bg-border" />
                  <li className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-bold">3</span>
                    <div className="min-w-0 flex flex-1 items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{t("install.iosStep3")}</p>
                      <span className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary/80 px-3 py-2 text-sm font-semibold text-muted-foreground">
                        <span className="inline-flex items-center justify-center px-0.5 text-[16px] leading-none text-muted-foreground">
                          +
                        </span>
                        {t("install.addToHomeLabel")}
                      </span>
                    </div>
                  </li>
                  <div className="h-px bg-border" />
                  <li className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-bold">4</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{t("install.iosStep4")}</p>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-bold">1</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{t("install.androidStep1")}</p>
                    </div>
                  </li>
                  <div className="h-px bg-border" />
                  <li className="flex items-start gap-3 py-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-bold">2</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{t("install.androidStep2")}</p>
                    </div>
                  </li>
                </>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
