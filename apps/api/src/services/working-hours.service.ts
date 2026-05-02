import {
  workingHoursRepo,
  workingHoursOverrideRepo,
  type WorkingHoursInput,
  type WorkingHoursOverrideInput,
} from '../repositories/working-hours.repo'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

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

class WorkingHoursOverrideService {
  find(userId: string, date: string) {
    return workingHoursOverrideRepo.findByDate(userId, date)
  }

  upsert(userId: string, date: string, input: WorkingHoursOverrideInput) {
    if (timeToMinutes(input.startTime) >= timeToMinutes(input.endTime)) {
      throw new Error('startTime must be before endTime')
    }
    return workingHoursOverrideRepo.upsert(userId, date, input)
  }

  delete(userId: string, date: string) {
    return workingHoursOverrideRepo.deleteByDate(userId, date)
  }
}

export const workingHoursOverrideService = new WorkingHoursOverrideService()
