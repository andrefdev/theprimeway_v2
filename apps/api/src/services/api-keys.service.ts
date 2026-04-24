import { apiKeysRepo } from '../repositories/api-keys.repo'
import { generateApiKey, hashApiKey, hashesMatch } from '../lib/api-key'

class ApiKeysService {
  list(userId: string) { return apiKeysRepo.list(userId) }

  async create(userId: string, name: string) {
    const { plaintext, prefix, hash } = generateApiKey()
    const record = await apiKeysRepo.create(userId, { name, prefix, hashedKey: hash })
    // plaintext returned ONCE — never stored or retrievable again.
    return {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      createdAt: record.createdAt,
      plaintext,
    }
  }

  revoke(userId: string, id: string) { return apiKeysRepo.revoke(id, userId) }

  /**
   * Verify a plaintext key and return the owning userId, or null if invalid/revoked.
   * Side-effect: updates `lastUsedAt`.
   */
  async verifyKey(plaintext: string): Promise<string | null> {
    if (plaintext.length < 12) return null
    const prefix = plaintext.slice(0, 12)
    const record = await apiKeysRepo.findByPrefix(prefix)
    if (!record || record.revokedAt) return null
    const candidate = hashApiKey(plaintext)
    if (!hashesMatch(candidate, record.hashedKey)) return null
    apiKeysRepo.markUsed(record.id).catch(() => undefined)
    return record.userId
  }
}

export const apiKeysService = new ApiKeysService()
