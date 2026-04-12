/**
 * User Service — Business logic layer
 *
 * Responsibilities:
 * - Orchestrate repository calls
 * - Default value logic (settings, work prefs, currency)
 * - Cross-field mapping
 * - NO Prisma queries, NO HTTP concerns
 */
import { userRepository } from '../repositories/user.repo'
import type { UserSettings, UserProfile, UserWorkPreferences, UserCurrencySettings } from '@prisma/client'

type SettingsModel = UserSettings
type ProfileModel = UserProfile
type WorkPreferencesModel = UserWorkPreferences
type CurrencySettingsModel = UserCurrencySettings

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface UpdateSettingsInput {
  locale?: string
  theme?: string
  timezone?: string
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  displayName?: string
  profilePicture?: string
  bio?: string
  primaryGoal?: string
}

export interface UpdateWorkPreferencesInput {
  timeZone?: string
  workStartHour?: number
  workEndHour?: number
  workDays?: number[]
  defaultTaskDurationMinutes?: number
  maxTasksPerDay?: number
  overflowStrategy?: string
}

export interface UpdateCurrencyInput {
  baseCurrency?: string
  preferredCurrencies?: string[]
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  userId: '',
  locale: 'en',
  theme: 'system',
  timezone: 'UTC',
} as SettingsModel

const DEFAULT_WORK_PREFERENCES = {
  id: 'default',
  userId: '',
  timeZone: 'America/New_York',
  workStartHour: 9,
  workEndHour: 17,
  workDays: [1, 2, 3, 4, 5],
  defaultTaskDurationMinutes: 30,
  maxTasksPerDay: 10,
  overflowStrategy: 'backlog',
} as WorkPreferencesModel

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
class UserService {
  // ── Settings ────────────────────────────────────────────────────────────

  async getSettings(userId: string): Promise<SettingsModel> {
    const settings = await userRepository.findSettings(userId)
    if (!settings) {
      return { ...DEFAULT_SETTINGS, userId } as SettingsModel
    }
    return settings
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<SettingsModel> {
    return userRepository.upsertSettings(userId, input)
  }

  // ── Profile ─────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<ProfileModel | null> {
    return userRepository.findProfile(userId)
  }

  async upsertProfile(userId: string, input: UpdateProfileInput): Promise<ProfileModel> {
    return userRepository.upsertProfile(userId, input as Record<string, unknown>)
  }

  // ── Work Preferences ───────────────────────────────────────────────────

  async getWorkPreferences(userId: string): Promise<WorkPreferencesModel> {
    const prefs = await userRepository.findWorkPreferences(userId)
    if (!prefs) {
      return { ...DEFAULT_WORK_PREFERENCES, userId } as WorkPreferencesModel
    }
    return prefs
  }

  async updateWorkPreferences(
    userId: string,
    input: UpdateWorkPreferencesInput,
  ): Promise<WorkPreferencesModel> {
    return userRepository.upsertWorkPreferences(userId, input as Record<string, any>)
  }

  // ── Currency Settings ──────────────────────────────────────────────────

  async getCurrencySettings(userId: string): Promise<CurrencySettingsModel | null> {
    const settings = await userRepository.findCurrencySettings(userId)
    if (settings) return settings

    // No settings exist — verify user exists before creating defaults
    const exists = await userRepository.userExists(userId)
    if (!exists) return null // signal 404

    // Create default settings
    return userRepository.upsertCurrencySettings(userId, {
      baseCurrency: 'USD',
      preferredCurrencies: ['USD', 'PEN'],
    })
  }

  async updateCurrencySettings(
    userId: string,
    input: UpdateCurrencyInput,
  ): Promise<CurrencySettingsModel> {
    return userRepository.upsertCurrencySettings(userId, {
      baseCurrency: input.baseCurrency,
      preferredCurrencies: input.preferredCurrencies,
    })
  }

  async deleteCurrencySettings(userId: string): Promise<void> {
    await userRepository.deleteCurrencySettings(userId)
  }

  // ── Delete User ────────────────────────────────────────────────────────

  async deleteUser(userId: string): Promise<void> {
    console.log(`[USER_DELETE] Deleting user ${userId} and cascading entities...`)
    await userRepository.deleteUser(userId)
  }
}

export const userService = new UserService()
