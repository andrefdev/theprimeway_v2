// Zod schemas shared between web, api, and mobile
// Single source of truth for request/response validation

export {
  loginSchema,
  registerSchema,
  oauthSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth'
export type {
  LoginInput,
  RegisterInput,
  OAuthInput,
  VerifyEmailInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth'

export { createTaskSchema, updateTaskSchema, taskBucketSchema, TASK_BUCKETS } from './task'
export type { CreateTaskInput, UpdateTaskInput } from './task'

export { createHabitSchema, updateHabitSchema, upsertHabitLogSchema } from './habit'
export type { CreateHabitInput, UpdateHabitInput, UpsertHabitLogInput } from './habit'

export { updateCalendarSchema, googleCallbackSchema, syncCalendarSchema } from './calendar'
export type { UpdateCalendarInput, GoogleCallbackInput, SyncCalendarInput } from './calendar'

export { chatMessageSchema } from './chat'
export type { ChatMessageInput } from './chat'

export {
  updateGamificationSettingsSchema,
  awardXpSchema,
  streakCheckInSchema,
  challengeProgressSchema,
} from './gamification'
export type {
  UpdateGamificationSettingsInput,
  AwardXpInput,
  StreakCheckInInput,
  ChallengeProgressInput,
} from './gamification'

export { createPomodoroSessionSchema, updatePomodoroSessionSchema } from './pomodoro'
export type { CreatePomodoroSessionInput, UpdatePomodoroSessionInput } from './pomodoro'

export { registerDeviceSchema, updatePreferencesSchema, sendPushSchema } from './notifications'
export type { RegisterDeviceInput, UpdatePreferencesInput, SendPushInput } from './notifications'

export { subscriptionActionSchema, checkoutSchema } from './subscriptions'
export type { SubscriptionActionInput, CheckoutInput } from './subscriptions'

export {
  createGoalSchema,
  updateGoalSchema,
  createVisionSchema,
  updateVisionSchema,
  createPillarSchema,
  updatePillarSchema,
  createOutcomeSchema,
  updateOutcomeSchema,
  createQuarterFocusSchema,
  updateQuarterFocusSchema,
  createFocusLinkSchema,
} from './goals'
export type {
  CreateGoalInput,
  UpdateGoalInput,
  CreateVisionInput,
  CreatePillarInput,
  CreateOutcomeInput,
  CreateQuarterFocusInput,
  CreateFocusLinkInput,
} from './goals'

export {
  updateProfileSchema,
  updateSettingsSchema,
  updateWorkPreferencesSchema,
} from './user'
export type {
  UpdateProfileInput,
  UpdateSettingsInput,
  UpdateWorkPreferencesInput,
} from './user'
