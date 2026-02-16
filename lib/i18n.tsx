"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type Locale = "en" | "es"

const translations = {
  // Bottom Nav
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.training": { en: "Training", es: "Entreno" },
  "nav.meals": { en: "Meals", es: "Comidas" },
  "nav.profile": { en: "Profile", es: "Perfil" },

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
  "training.trainingName": { en: "Day", es: "Día" },
  "training.dayMonday": { en: "Monday", es: "Lunes" },
  "training.dayTuesday": { en: "Tuesday", es: "Martes" },
  "training.dayWednesday": { en: "Wednesday", es: "Miércoles" },
  "training.dayThursday": { en: "Thursday", es: "Jueves" },
  "training.dayFriday": { en: "Friday", es: "Viernes" },
  "training.daySaturday": { en: "Saturday", es: "Sábado" },
  "training.daySunday": { en: "Sunday", es: "Domingo" },
  "training.exercises": { en: "Exercises", es: "Ejercicios" },
  "training.addExercise": { en: "+ Add exercise", es: "+ Agregar ejercicio" },
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

  // Date navigation
  "date.today": { en: "Today", es: "Hoy" },

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
