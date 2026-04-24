import { commandsRepo } from '../repositories/commands.repo'
import { commandManager } from './scheduling/CommandManager'

export type UndoResult =
  | { ok: true; undone: number }
  | { ok: false; reason: 'not_found' | 'already_undone' | 'error'; message?: string }

class CommandsService {
  async listRecent(userId: string, limit: number) {
    return commandsRepo.findRecent(userId, Math.min(Math.max(limit, 1), 200))
  }

  async undo(userId: string, commandId: string): Promise<UndoResult> {
    const cmd = await commandsRepo.findByIdAndUser(commandId, userId)
    if (!cmd) return { ok: false, reason: 'not_found' }
    if (cmd.isUndone) return { ok: false, reason: 'already_undone' }
    try {
      const result = await commandManager.undo(commandId)
      return { ok: true, undone: result.undone }
    } catch (err) {
      return { ok: false, reason: 'error', message: (err as Error).message }
    }
  }
}

export const commandsService = new CommandsService()
