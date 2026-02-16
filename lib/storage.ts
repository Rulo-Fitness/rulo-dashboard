export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface TrainingSession {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
}

export interface Meal {
  id: string;
  date: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Training Sessions
export function getTrainingSessions(): TrainingSession[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('fittrack-training');
  return data ? JSON.parse(data) : [];
}

export function saveTrainingSession(session: Omit<TrainingSession, 'id'>): TrainingSession {
  const sessions = getTrainingSessions();
  const newSession = { ...session, id: generateId() };
  sessions.unshift(newSession);
  localStorage.setItem('fittrack-training', JSON.stringify(sessions));
  return newSession;
}

export function updateTrainingSession(session: TrainingSession): void {
  const sessions = getTrainingSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index === -1) return;
  sessions[index] = session;
  localStorage.setItem('fittrack-training', JSON.stringify(sessions));
}

export function deleteTrainingSession(id: string): void {
  const sessions = getTrainingSessions().filter((s) => s.id !== id);
  localStorage.setItem('fittrack-training', JSON.stringify(sessions));
}

// Meals
export function getMeals(): Meal[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('fittrack-meals');
  return data ? JSON.parse(data) : [];
}

export function saveMeal(meal: Omit<Meal, 'id'>): Meal {
  const meals = getMeals();
  const newMeal = { ...meal, id: generateId() };
  meals.unshift(newMeal);
  localStorage.setItem('fittrack-meals', JSON.stringify(meals));
  return newMeal;
}

export function deleteMeal(id: string): void {
  const meals = getMeals().filter((m) => m.id !== id);
  localStorage.setItem('fittrack-meals', JSON.stringify(meals));
}

// Stats helpers
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTodayMeals(): Meal[] {
  const today = getTodayString();
  return getMeals().filter((m) => m.date === today);
}

export function getTodaySessions(): TrainingSession[] {
  const today = getTodayString();
  return getTrainingSessions().filter((s) => s.date === today);
}

export function getWeekSessions(): TrainingSession[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  return getTrainingSessions().filter((s) => s.date >= weekAgoStr);
}

export function getWeekMeals(): Meal[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  return getMeals().filter((m) => m.date >= weekAgoStr);
}

// Profile
export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

const defaultProfile: UserProfile = {
  name: '',
  age: 0,
  weight: 0,
  height: 0,
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
};

export function getProfile(): UserProfile {
  if (typeof window === 'undefined') return defaultProfile;
  const data = localStorage.getItem('fittrack-profile');
  return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem('fittrack-profile', JSON.stringify(profile));
}

export function clearAllData(): void {
  localStorage.removeItem('fittrack-training');
  localStorage.removeItem('fittrack-meals');
  localStorage.removeItem('fittrack-profile');
}
