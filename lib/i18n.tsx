"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type Locale = "en" | "es"

const translations = {
  // Bottom Nav
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.training": { en: "Training", es: "Entreno" },
  "nav.meals": { en: "Meals", es: "Comidas" },
  "nav.profile": { en: "Profile", es: "Perfil" },
  "nav.settings": { en: "Settings", es: "Ajustes" },

  // Greetings
  "greeting.morning": { en: "Good morning", es: "Buenos días" },
  "greeting.afternoon": { en: "Good afternoon", es: "Buenas tardes" },
  "greeting.evening": { en: "Good evening", es: "Buenas noches" },

  // Dashboard
  "dashboard.todayNutrition": { en: "Today's Nutrition", es: "Nutrición de hoy" },
  "dashboard.caloriesToday": { en: "calories today", es: "calorías hoy" },
  "dashboard.todayTraining": { en: "Today's Training", es: "Entreno de hoy" },
  "dashboard.sessions": { en: "Sessions", es: "Sesiones" },
  "dashboard.exercises": { en: "exercises", es: "ejercicios" },
  "dashboard.duration": { en: "Duration", es: "Duración" },
  "dashboard.totalTime": { en: "total time", es: "tiempo total" },
  "dashboard.thisWeek": { en: "This Week", es: "Esta semana" },
  "dashboard.workouts": { en: "Workouts", es: "Entrenos" },
  "dashboard.minTotal": { en: "min total", es: "min total" },
  "dashboard.avgCalories": { en: "Avg Calories", es: "Calorías prom." },
  "dashboard.perDay": { en: "per day", es: "por día" },
  "dashboard.recentActivity": { en: "Recent Activity", es: "Actividad reciente" },
  "dashboard.noActivity": { en: "No activity logged today", es: "Sin actividad registrada hoy" },
  "dashboard.startAdding": { en: "Start by adding a training session or meal", es: "Comienza agregando un entreno o comida" },
  "dashboard.todayProgress": { en: "Today's progress", es: "Progreso de hoy" },
  "dashboard.remaining": { en: "remaining", es: "restantes" },
  "dashboard.over": { en: "over", es: "de más" },
  "dashboard.youTrained": { en: "You trained", es: "Entrenaste" },
  "dashboard.noTrainingYet": { en: "No training yet", es: "Aún no entrenaste" },
  "dashboard.addExercise": { en: "Add exercise", es: "Agregar ejercicio" },
  "dashboard.addMeal": { en: "Log meal", es: "Registrar comida" },
  "dashboard.weekTraining": { en: "Training", es: "Entrenos" },
  "dashboard.weekMeals": { en: "Meals", es: "Comidas" },
  "dashboard.quickLog": { en: "Quick log", es: "Registro rápido" },
  "dashboard.caloriesRemaining": { en: "remaining", es: "restantes" },
  "dashboard.caloriesOver": { en: "over goal", es: "de más" },
  "dashboard.todayVolume": { en: "volume", es: "volumen" },
  "dashboard.totalExercises": { en: "exercises", es: "ejercicios" },
  "dashboard.eaten": { en: "eaten", es: "ingeridas" },
  "dashboard.goalLabel": { en: "goal", es: "meta" },
  "dashboard.boxPlan": { en: "Beast plan", es: "Plan Bestia" },
  "dashboard.boxPlanHint": { en: "Daily goals", es: "Tus metas diarias" },
  "dashboard.boxInstall": { en: "Download the app", es: "Descarga la app" },
  "dashboard.boxInstallHint": { en: "Use it from your home screen", es: "Úsala desde tu pantalla de inicio" },
  "dashboard.boxReport": { en: "Weekly recap", es: "Resumen de la semana" },
  "dashboard.boxReportHint": { en: "See your progress", es: "Mira tu progreso" },
  "dashboard.recapTitle": { en: "Your week", es: "Tu semana" },
  "dashboard.recapSubtitle": { en: "Weekly progress recap", es: "Resumen de tu progreso" },
  "dashboard.recapSessions": { en: "Training sessions", es: "Sesiones de entreno" },
  "dashboard.recapExercises": { en: "Exercises logged", es: "Ejercicios registrados" },
  "dashboard.recapMeals": { en: "Meals logged", es: "Comidas registradas" },
  "dashboard.recapCalories": { en: "Total calories", es: "Calorías totales" },
  "dashboard.planTitle": { en: "Your plan", es: "Tu plan" },
  "dashboard.planSubtitle": { en: "Daily goals", es: "Metas diarias" },
  "dashboard.plansIntro": { en: "Rulo has 3 plans. Each one includes more features.", es: "Rulo tiene 3 planes. Cada uno incluye más features." },
  "dashboard.plansFeaturesTitle": { en: "Features", es: "Features" },
  "plan.maquina.name": { en: "Máquina", es: "Máquina" },
  "plan.maquina.subtitle": { en: "The affordable one", es: "El económico" },
  "plan.fiera.name": { en: "Fiera", es: "Fiera" },
  "plan.fiera.subtitle": { en: "Standard / best value", es: "El estándar / rentable" },
  "plan.bestia.name": { en: "Bestia", es: "Bestia" },
  "plan.bestia.subtitle": { en: "Premium / power user", es: "El premium / power user" },
  "plan.featureVoice": { en: "Unlimited Voice-to-Data", es: "Voice-to-Data ilimitado" },
  "plan.featureSnapshot": { en: "Snapshot Nutrition", es: "Snapshot Nutrition" },
  "plan.featureDashboard": { en: "Metrics dashboard", es: "Dashboard de métricas" },
  "plan.featureProgression": { en: "Auto progression", es: "Progresión automática" },
  "plan.featureNudging": { en: "Smart nudging", es: "Nudging inteligente" },
  "plan.featureHeatmap": { en: "Consistency heatmap", es: "Heatmap de consistencia" },
  "plan.featureVolume": { en: "Volume analysis", es: "Análisis de volumen" },
  "plan.featureHistory": { en: "Full history", es: "Historial completo" },
  "plan.featureVoiceFix": { en: "Voice corrections", es: "Correcciones por voz" },
  "plan.featureApp": { en: "Mobile app", es: "App móvil" },
  "plan.featureExport": { en: "Data export", es: "Exportación de datos" },
  "plan.featureAdvanced": { en: "Advanced analysis", es: "Análisis avanzado" },
  "plan.featureSupport": { en: "Priority support", es: "Soporte prioritario" },
  "dashboard.installTitle": { en: "Install Rulo Fitness", es: "Instalar Rulo Fitness" },
  "dashboard.installSubtitle": { en: "Use it like an app from your home screen", es: "Úsala como una app desde tu pantalla de inicio" },
  "dashboard.reportTitle": { en: "Send a report", es: "Enviar un reporte" },
  "dashboard.reportSubtitle": { en: "Bug, suggestion or feedback", es: "Error, sugerencia o comentario" },
  "dashboard.reportPlaceholder": { en: "Describe your report...", es: "Describe tu reporte..." },
  "dashboard.reportSent": { en: "Thank you! We'll read it.", es: "¡Gracias! Lo leeremos." },
  "dashboard.send": { en: "Send", es: "Enviar" },
  "install.subtitle": { en: "Use Rulo Fitness like an app", es: "Usa Rulo Fitness como una app" },
  "install.iosStep1": { en: "Tap ... then Share", es: "Toca ... y Compartir" },
  "install.iosStep2": { en: "Find and tap \"Add to Home Screen\"", es: "Busca y toca \"Agregar a pantalla de inicio\"" },
  "install.iosStep3": { en: "Make sure \"Open as a web app\" is enabled", es: "Que esté activado \"Abrir como app web\"" },
  "install.androidStep1": { en: "Tap the menu (⋮)", es: "Toca el menú (⋮)" },
  "install.androidStep2": { en: "Tap \"Install app\" or \"Add to Home Screen\"", es: "Toca \"Instalar aplicación\" o \"Agregar a pantalla de inicio\"" },

  // Macros
  "macro.protein": { en: "Protein", es: "Proteína" },
  "macro.carbs": { en: "Carbs", es: "Carbos" },
  "macro.fat": { en: "Fat", es: "Grasa" },
  "macro.calories": { en: "Calories", es: "Calorías" },

  // Training
  "training.title": { en: "Training", es: "Entrenos" },
  "training.subtitle": { en: "Your workouts", es: "Tus entrenos" },
  "training.noTrainings": { en: "No workouts yet", es: "Sin entrenos aún" },
  "training.tapToLog": { en: "Tap + to create your first workout", es: "Toca + para crear tu primer entreno" },
  "training.newTraining": { en: "New Workout", es: "Nuevo entreno" },
  "training.editTraining": { en: "Edit Workout", es: "Editar entreno" },
  "training.deleteTraining": { en: "Delete workout", es: "Eliminar entreno" },
  "training.deleteExerciseConfirm": { en: "Delete this exercise?", es: "¿Eliminar este ejercicio?" },
  "training.trainingName": { en: "Day", es: "Día" },
  "training.dayMonday": { en: "Monday", es: "Lunes" },
  "training.dayTuesday": { en: "Tuesday", es: "Martes" },
  "training.dayWednesday": { en: "Wednesday", es: "Miércoles" },
  "training.dayThursday": { en: "Thursday", es: "Jueves" },
  "training.dayFriday": { en: "Friday", es: "Viernes" },
  "training.daySaturday": { en: "Saturday", es: "Sábado" },
  "training.daySunday": { en: "Sunday", es: "Domingo" },
  "training.exercises": { en: "Exercises", es: "Ejercicios" },
  "training.addExercise": { en: "Add exercise", es: "Agregar ejercicio" },
  "training.exerciseName": { en: "Exercise name", es: "Nombre del ejercicio" },
  "training.sets": { en: "Sets", es: "Series" },
  "training.reps": { en: "Reps", es: "Reps" },
  "training.weightKg": { en: "Weight (kg)", es: "Peso (kg)" },
  "training.saveTraining": { en: "Save Workout", es: "Guardar entreno" },
  "training.saveChanges": { en: "Save changes", es: "Guardar cambios" },
  "training.saveExercise": { en: "Save Exercise", es: "Guardar ejercicio" },
  "training.editExercise": { en: "Edit Exercise", es: "Editar ejercicio" },
  "training.noExercises": { en: "No exercises yet", es: "Sin ejercicios aún" },
  "training.tapToAdd": { en: "Tap + to add your first exercise", es: "Toca + para agregar tu primer ejercicio" },
  "training.today": { en: "Today", es: "Hoy" },

  // Meals
  "meals.title": { en: "Meals", es: "Comidas" },
  "meals.subtitle": { en: "Track calories & macros", es: "Registra calorías y macros" },
  "meals.todayTotals": { en: "Today's Totals", es: "Totales de hoy" },
  "meals.totalCalories": { en: "total calories", es: "calorías totales" },
  "meals.noMeals": { en: "No meals logged", es: "Sin comidas registradas" },
  "meals.tapToLog": { en: "Tap + to log your first meal", es: "Toca + para registrar tu primera comida" },
  "meals.logMeal": { en: "Log Meal", es: "Registrar comida" },
  "meals.editMeal": { en: "Edit meal", es: "Editar comida" },
  "meals.mealName": { en: "Meal name (e.g., Grilled Chicken)", es: "Nombre (ej., Pollo a la plancha)" },
  "meals.macrosGrams": { en: "Macros (grams)", es: "Macros (gramos)" },
  "meals.saveMeal": { en: "Save Meal", es: "Guardar comida" },
  "meals.calorieGoal": { en: "Daily Goal", es: "Meta diaria" },
  "meals.remaining": { en: "remaining", es: "restantes" },
  "meals.over": { en: "over", es: "de más" },
  "meals.ofGoal": { en: "of", es: "de" },

  // Profile
  "profile.yourProfile": { en: "Your Profile", es: "Tu perfil" },
  "profile.sessionsCount": { en: "sessions", es: "sesiones" },
  "profile.mealsLogged": { en: "meals logged", es: "comidas registradas" },
  "profile.personalInfo": { en: "Personal Info", es: "Info personal" },
  "profile.name": { en: "Name", es: "Nombre" },
  "profile.yourName": { en: "Your name", es: "Tu nombre" },
  "profile.age": { en: "Age", es: "Edad" },
  "profile.weight": { en: "Weight", es: "Peso" },
  "profile.height": { en: "Height", es: "Altura" },
  "profile.dailyGoals": { en: "Daily Goals", es: "Metas diarias" },
  "profile.saveProfile": { en: "Save Profile", es: "Guardar perfil" },
  "profile.saved": { en: "Saved!", es: "¡Guardado!" },
  "profile.allTimeStats": { en: "All-Time Stats", es: "Estadísticas totales" },
  "profile.dangerZone": { en: "Danger Zone", es: "Zona peligrosa" },
  "profile.clearAllData": { en: "Clear All Data", es: "Borrar todos los datos" },
  "profile.clearConfirm": {
    en: "This will delete all your training sessions, meals, and profile data. This cannot be undone.",
    es: "Esto eliminará todas tus sesiones, comidas y datos de perfil. No se puede deshacer.",
  },
  "profile.logout": { en: "Log out", es: "Cerrar sesión" },
  "profile.loggedOut": { en: "Logged out", es: "Sesión cerrada" },
  "profile.cancel": { en: "Cancel", es: "Cancelar" },
  "profile.confirmDelete": { en: "Confirm Delete", es: "Confirmar" },

  // Settings
  "settings.title": { en: "Settings", es: "Ajustes" },
  "settings.language": { en: "Language", es: "Idioma" },
  "settings.theme": { en: "Theme", es: "Tema" },
  "settings.light": { en: "Light", es: "Claro" },
  "settings.dark": { en: "Dark", es: "Oscuro" },
  "settings.system": { en: "System", es: "Sistema" },
  "settings.english": { en: "English", es: "English" },
  "settings.spanish": { en: "Español", es: "Español" },
  "settings.preferences": { en: "Preferences", es: "Preferencias" },
  "settings.account": { en: "Account", es: "Cuenta" },
  "settings.contactSupport": { en: "Contact support", es: "Contactar soporte" },
  "settings.contactSupportHint": { en: "Get help or send feedback", es: "Obtén ayuda o envía comentarios" },

  // Register (onboarding)
  "register.title": { en: "Create your profile", es: "Creá tu perfil" },
  "register.mascotMessage": { en: "Let's go! Tell me a bit about you and I'll set up your plan.", es: "¡Vamos! Contáme un poco de vos y armo tu plan." },
  "register.mascotStep1": { en: "Age, sex, weight and height — I use these to calculate your daily needs.", es: "Edad, sexo, peso y altura — los uso para calcular tu gasto diario." },
  "register.mascotStep2": { en: "How active you are during the week — from sedentary to very active.", es: "Qué tan activo sos en la semana — de sedentario a muy activo." },
  "register.mascotStep3": { en: "Your goal: lose fat, maintain, or gain mass. I'll adjust your plan.", es: "Tu objetivo: bajar grasa, mantener o subir masa. Ajusto tu plan." },
  "register.mascotStep4": { en: "How many kilos per week you want to change — e.g. 0.25 or 0.5.", es: "Cuántos kilos por semana querés cambiar — ej. 0,25 o 0,5." },
  "register.mascotCreateAccount": { en: "Almost there! Phone and password to create your account.", es: "Casi listo. Teléfono y contraseña para crear tu cuenta." },
  "register.step1": { en: "Basic data", es: "Datos básicos" },
  "register.step2": { en: "Activity", es: "Actividad" },
  "register.step3": { en: "Goal", es: "Objetivo" },
  "register.step4": { en: "Pace", es: "Ritmo" },
  "register.age": { en: "Age", es: "Edad" },
  "register.sex": { en: "Sex", es: "Sexo" },
  "register.male": { en: "Male", es: "Hombre" },
  "register.female": { en: "Female", es: "Mujer" },
  "register.weight": { en: "Current weight", es: "Peso actual" },
  "register.height": { en: "Height", es: "Altura" },
  "register.step1Hint": { en: "Used to calculate your BMR (basal metabolic rate).", es: "Con esto se calcula tu BMR (metabolismo basal)." },
  "register.activityLevel": { en: "Activity level", es: "Nivel de actividad" },
  "register.sedentary": { en: "Sedentary", es: "Sedentario" },
  "register.light": { en: "Light (1–3 days)", es: "Ligero (1–3 días)" },
  "register.moderate": { en: "Moderate (3–5 days)", es: "Moderado (3–5 días)" },
  "register.high": { en: "High (6–7 days)", es: "Alto (6–7 días)" },
  "register.veryHigh": { en: "Very high (intense / physical work)", es: "Muy alto (entrenos intensos / trabajo físico)" },
  "register.step2Hint": { en: "Multiplies BMR to get your TDEE (total daily expenditure).", es: "Multiplica el BMR para obtener tu TDEE (gasto diario total)." },
  "register.goal": { en: "Goal", es: "Objetivo" },
  "register.loseFat": { en: "Lose fat", es: "Bajar grasa" },
  "register.maintain": { en: "Maintain", es: "Mantener" },
  "register.gainMass": { en: "Gain mass", es: "Subir masa" },
  "register.step3Hint": { en: "Deficit or surplus of 300–500 kcal.", es: "Déficit o superávit de 300–500 kcal." },
  "register.weeklyRate": { en: "Weekly rate (kg)", es: "Ritmo por semana (kg)" },
  "register.weeklyRateHint": { en: "How much you want to gain or lose per week (e.g. 0.25 or 1).", es: "Cuánto querés subir o bajar por semana (ej: 0,25 o 1)." },
  "register.next": { en: "Next", es: "Siguiente" },
  "register.back": { en: "Back", es: "Atrás" },
  "register.finish": { en: "Finish", es: "Finalizar" },
  "register.save": { en: "Save", es: "Guardar" },
  "register.select": { en: "Select", es: "Seleccionar" },
  "register.done": { en: "Profile saved. You can log in.", es: "Perfil guardado. Ya podés iniciar sesión." },
  "register.validationAge": { en: "Age must be between 1 and 119", es: "La edad debe ser entre 1 y 119" },
  "register.validationWeight": { en: "Weight between 1 and 300 kg", es: "Peso entre 1 y 300 kg" },
  "register.validationHeight": { en: "Height between 50 and 250 cm", es: "Altura entre 50 y 250 cm" },
  "register.validationWeeklyRate": { en: "Weekly rate between 0.25 and 2 kg/week", es: "Ritmo entre 0,25 y 2 kg/semana" },
  "register.createAccountTitle": { en: "Create your account", es: "Crear tu cuenta" },
  "register.createAccountPhone": { en: "Phone number", es: "Número de teléfono" },
  "register.createAccountPassword": { en: "Password", es: "Contraseña" },
  "register.createAccountPasswordPlaceholder": { en: "At least 4 characters", es: "Mínimo 4 caracteres" },
  "register.createAccountConfirmPassword": { en: "Confirm password", es: "Confirmar contraseña" },
  "register.createAccountConfirmPlaceholder": { en: "Repeat your password", es: "Repetí tu contraseña" },
  "register.createAccountSubmit": { en: "Create account", es: "Crear cuenta" },
  "register.createAccountSubmitting": { en: "Creating…", es: "Creando…" },
  "register.createAccountInvalidPhone": { en: "Enter a valid phone number", es: "Introduce un número de teléfono válido" },
  "register.createAccountPasswordShort": { en: "Password must be at least 4 characters", es: "La contraseña debe tener al menos 4 caracteres" },
  "register.createAccountPasswordMismatch": { en: "Passwords do not match", es: "Las contraseñas no coinciden" },
  "register.createAccountError": { en: "Could not create account. Try again.", es: "No se pudo crear la cuenta. Intentá de nuevo." },

  // Date navigation
  "date.today": { en: "Today", es: "Hoy" },
  "date.yesterday": { en: "Yesterday", es: "Ayer" },

  // Units
  "unit.min": { en: "min", es: "min" },
  "unit.kcal": { en: "kcal", es: "kcal" },
  "unit.g": { en: "g", es: "g" },
  "unit.kg": { en: "kg", es: "kg" },
  "unit.cm": { en: "cm", es: "cm" },
  "unit.yrs": { en: "yrs", es: "años" },
  "unit.cal": { en: "cal", es: "cal" },
} as const

export type TranslationKey = keyof typeof translations


interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const saved = localStorage.getItem("fittrack-locale") as Locale | null
    if (saved && (saved === "en" || saved === "es")) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("fittrack-locale", newLocale)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[key]?.[locale] ?? key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
