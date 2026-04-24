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
import { channelsService } from './channels.service'
import { workingHoursService } from './working-hours.service'
import type { UserSettings, UserProfile, UserCurrencySettings } from '@prisma/client'

type SettingsModel = UserSettings
type ProfileModel = UserProfile
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

  // ── Onboarding ─────────────────────────────────────────────────────────

  async completeOnboarding(
    userId: string,
    input: { locale?: string; timezone?: string },
  ): Promise<{ settings: SettingsModel; seeded: { workingHours: number } }> {
    const settings = await userRepository.upsertSettings(userId, {
      locale: input.locale,
      timezone: input.timezone,
    })
    await channelsService.seedDefaults(userId)
    const whCount = await workingHoursService.seedDefaults(userId)
    return { settings, seeded: { workingHours: whCount } }
  }

  async deleteUser(userId: string): Promise<void> {
    console.log(`[USER_DELETE] Deleting user ${userId} and cascading entities...`)
    await userRepository.deleteUser(userId)
  }

  // ── Section customizations ─────────────────────────────────────────────

  listSectionCustomizations(userId: string) { return userRepository.listSectionCustomizations(userId) }

  upsertSectionCustomization(userId: string, sectionId: string, fields: Record<string, unknown>) {
    return userRepository.upsertSectionCustomization(userId, sectionId, fields)
  }

  deleteSectionCustomization(userId: string, sectionId: string) {
    return userRepository.deleteSectionCustomization(userId, sectionId)
  }
}

export const userService = new UserService()
