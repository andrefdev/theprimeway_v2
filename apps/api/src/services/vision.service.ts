import { visionRepo, type VisionUpsert } from '../repositories/vision.repo'

interface ChainNode {
  id: string
  horizon: string
  title: string
}

class VisionService {
  get(userId: string) {
    return visionRepo.findByUser(userId)
  }

  upsert(userId: string, data: VisionUpsert) {
    return visionRepo.upsert(userId, data)
  }

  delete(userId: string) {
    return visionRepo.deleteByUser(userId)
  }

  /**
   * Vision-thread for a task: for each goal the task is linked to,
   * walk Goal.parentGoalId upward until root. Returns one chain per link.
   */
  async thread(userId: string, taskId: string) {
    const links = await visionRepo.findTaskGoalLinks(taskId, userId)
    const chains: ChainNode[][] = []
    for (const link of links) {
      const chain: ChainNode[] = []
      let current: any = link.goal
      const seen = new Set<string>()
      while (current && !seen.has(current.id)) {
        seen.add(current.id)
        chain.push({ id: current.id, horizon: current.horizon, title: current.title })
        if (!current.parentGoalId) break
        current = await visionRepo.findGoalById(current.parentGoalId)
      }
      chains.push(chain)
    }
    const vision = await visionRepo.findByUser(userId)
    return { vision, chains }
  }
}

export const visionService = new VisionService()
