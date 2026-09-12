export type PlanTier = 'inicial' | 'premium' | 'pro'

export interface UserProfile {
  age?: number | null
  weight_kg?: number | null
  height_cm?: number | null
  goal?: string | null
  goals?: string[]
  primary_goal?: string
  activity_level?: string | null
  gender?: string | null
  target_weight_kg?: number | null
  imc?: number | null
  tdee?: number | null
  health_notes?: string | null
  onboarding_done?: boolean
}

export interface UserSession {
  id: number
  email: string
  name: string
  avatar_url?: string | null
  role?: string
  tier: PlanTier
  tier_price_usd?: number
  is_admin: boolean
  days_left: number
  onboarding_done?: boolean
  profile?: UserProfile | null
  access_token?: string
  token_type?: 'bearer'
  demo_mode?: boolean
  created_at?: string
  goal?: string | null
  weight_kg?: number | null
}

export interface DashboardStats {
  streak_days: number
  days_left?: number
  subscription_tier?: PlanTier
  subscription_price_usd?: number
  target_calories: number
  avg_weekly_calories: number
  current_weight: number
  workouts_this_week: number
  meditations_this_week: number
  target_protein: number
  target_carbs: number
  target_fat: number
  weight_progress: Array<{ date: string; weight: number }>
  macro_history?: Array<{ date: string; protein: number; carbs: number; fat: number; calories: number }>
}

export interface DailyLog {
  date: string
  calories_consumed: number
  protein_consumed: number
  carbs_consumed: number
  fat_consumed: number
  weight_kg: number | null
  workout_done: boolean
  meditation_done: boolean
  water_ml: number
  mood: number
}

export interface NutritionDay {
  day: number
  breakfast?: string
  lunch?: string
  dinner?: string
  snack?: string
}

export interface NutritionPlan {
  id: number
  title: string
  goal: string
  daily_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  days: NutritionDay[]
}

export interface WorkoutExercise {
  name: string
  sets: number
  reps: string | number
  rest_sec: number
  notes?: string
}

export interface WorkoutDay {
  day: string
  focus: string
  exercises: WorkoutExercise[]
}

export interface WorkoutWeek {
  week: number
  focus_description?: string
  days: WorkoutDay[]
}

export interface WorkoutPlan {
  title: string
  goal: string
  weeks: WorkoutWeek[]
}

export interface AdminMetrics {
  total_users: number
  tier_counts: Record<PlanTier, number>
  mrr_usd: number
  arr_usd: number
  total_posts: number
  total_daily_logs: number
  total_rsvps: number
  active_users_7d?: number
  active_rate_pct: number
}

export interface ChatReply {
  reply: string
  source: 'gemini' | 'fallback' | 'ratelimit' | 'langchain_agent' | string
  model?: string | null
  tools_used?: string[]
  tool_labels?: string[]
  data_changed?: boolean
  detail?: string | null
}
