import { workingHoursRepo, type WorkingHoursInput } from '../repositories/working-hours.repo'

class WorkingHoursService {
  list(userId: string, channelFilter: string | null) {
    return workingHoursRepo.findMany(userId, channelFilter)
  }

  create(userId: string, input: WorkingHoursInput) {
    return workingHoursRepo.create(userId, input)
  }

  update(userId: string, id: string, input: Partial<WorkingHoursInput>) {
    return workingHoursRepo.updateByIdAndUser(id, userId, input)
  }

  delete(userId: string, id: string) {
    return workingHoursRepo.deleteByIdAndUser(id, userId)
  }

  bulkReplace(userId: string, channelFilter: string | null, rows: WorkingHoursInput[]) {
    return workingHoursRepo.bulkReplace(userId, channelFilter, rows)
  }

  seedDefaults(userId: string) {
    return workingHoursRepo.seedDefaults(userId)
  }
}

export const workingHoursService = new WorkingHoursService()
