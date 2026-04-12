export interface TimeSlot {
  start: string // HH:MM format
  end: string // HH:MM format
  duration: number // minutes
  available: boolean
}

export interface ScheduleSuggestion {
  start: string // ISO datetime
  end: string // ISO datetime
}

interface PlannedTask {
  scheduledDate?: string
  scheduledStart?: string
  scheduledEnd?: string
}

interface CalendarEvent {
  start: string // ISO datetime
  end: string // ISO datetime
  title: string
}

export class ScheduleOptimizer {
  private readonly WORK_START_TIME = '09:00'
  private readonly WORK_END_TIME = '18:00'
  private readonly SLOT_DURATION = 30 // minutes
  private readonly MIN_TASK_DURATION = 15 // minutes

  /**
   * Find optimal time slots for a task in a given day
   */
  findOptimalSlots(
    tasks: PlannedTask[],
    calendarEvents: CalendarEvent[],
    targetDate: string, // YYYY-MM-DD
    taskDuration: number = 30,
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ): TimeSlot[] {
    // Filter tasks scheduled for this day
    const dayTasks = tasks.filter(
      (task) =>
        task.scheduledDate === targetDate &&
        task.scheduledStart &&
        task.scheduledEnd,
    )

    // Filter calendar events for this day
    const dayEvents = calendarEvents.filter((event) => {
      const eventDate = event.start.split('T')[0]
      return eventDate === targetDate
    })

    // Build occupied slots from tasks
    const taskOccupiedSlots = dayTasks.map((task) => ({
      start: task.scheduledStart!,
      end: task.scheduledEnd!,
      title: 'Task',
    }))

    // Build occupied slots from calendar events
    const eventOccupiedSlots = dayEvents.map((event) => {
      const startTime = new Date(event.start).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      const endTime = new Date(event.end).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      return {
        start: startTime,
        end: endTime,
        title: event.title,
      }
    })

    const occupiedSlots = [...taskOccupiedSlots, ...eventOccupiedSlots]
    const allSlots = this.generateTimeSlots(targetDate, occupiedSlots)
    const availableSlots = allSlots.filter((slot) => slot.available)

    // Filter by duration requirement
    const suitableSlots = availableSlots.filter(
      (slot) => slot.duration >= Math.max(taskDuration, this.MIN_TASK_DURATION),
    )

    // Sort by preference and quality
    return this.sortSlotsByPreference(suitableSlots, preferredTime)
  }

  /**
   * Find the best single slot for a task
   */
  findBestSlot(
    tasks: PlannedTask[],
    calendarEvents: CalendarEvent[],
    targetDate: string,
    taskDuration: number = 30,
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ): TimeSlot | null {
    const optimalSlots = this.findOptimalSlots(
      tasks,
      calendarEvents,
      targetDate,
      taskDuration,
      preferredTime,
    )
    return optimalSlots.length > 0 ? optimalSlots[0] : null
  }

  /**
   * Get schedule suggestion as ISO datetime strings
   */
  getSuggestion(
    tasks: PlannedTask[],
    calendarEvents: CalendarEvent[],
    targetDate: string,
    taskDuration: number = 30,
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ): ScheduleSuggestion | null {
    const bestSlot = this.findBestSlot(
      tasks,
      calendarEvents,
      targetDate,
      taskDuration,
      preferredTime,
    )

    if (!bestSlot) {
      return null
    }

    // Convert to ISO datetime
    const [startHours, startMinutes] = bestSlot.start.split(':').map(Number)
    const [endHours, endMinutes] = bestSlot.end.split(':').map(Number)

    const startDt = new Date(`${targetDate}T${bestSlot.start}:00`)
    const endDt = new Date(`${targetDate}T${bestSlot.end}:00`)

    return {
      start: startDt.toISOString(),
      end: endDt.toISOString(),
    }
  }

  /**
   * Generate all possible time slots for a day
   */
  private generateTimeSlots(
    date: string,
    occupiedSlots: Array<{ start: string; end: string }>,
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const workStart = this.timeToMinutes(this.WORK_START_TIME)
    const workEnd = this.timeToMinutes(this.WORK_END_TIME)

    // Generate slots in 30-minute increments
    for (let time = workStart; time < workEnd; time += this.SLOT_DURATION) {
      const slotStart = this.minutesToTime(time)
      const slotEnd = this.minutesToTime(time + this.SLOT_DURATION)

      // Check if this slot overlaps with any occupied slot
      const isOccupied = occupiedSlots.some((occupied) =>
        this.isTimeOverlap(slotStart, slotEnd, occupied.start, occupied.end),
      )

      // Check if this is a reasonable time
      const isReasonableTime = this.isReasonableTime(slotStart)

      slots.push({
        start: slotStart,
        end: slotEnd,
        duration: this.SLOT_DURATION,
        available: !isOccupied && isReasonableTime,
      })
    }

    return slots
  }

  /**
   * Sort slots by preference and quality
   */
  private sortSlotsByPreference(
    slots: TimeSlot[],
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ): TimeSlot[] {
    return slots.sort((a, b) => {
      const scoreA = this.scoreTimeSlot(a, preferredTime)
      const scoreB = this.scoreTimeSlot(b, preferredTime)
      return scoreB - scoreA
    })
  }

  /**
   * Score a time slot based on various factors
   */
  private scoreTimeSlot(
    slot: TimeSlot,
    preferredTime?: 'morning' | 'afternoon' | 'evening',
  ): number {
    let score = 0
    const startHour = this.timeToMinutes(slot.start) / 60

    // Preference scoring
    if (preferredTime) {
      switch (preferredTime) {
        case 'morning':
          if (startHour >= 9 && startHour < 12) score += 100
          break
        case 'afternoon':
          if (startHour >= 13 && startHour < 17) score += 100
          break
        case 'evening':
          if (startHour >= 17 && startHour < 19) score += 100
          break
      }
    }

    // Peak productivity hours (10am - 12pm, 2pm - 4pm)
    if (
      (startHour >= 10 && startHour < 12) ||
      (startHour >= 14 && startHour < 16)
    ) {
      score += 50
    }

    // Good working hours
    if (startHour >= 10 && startHour < 17) {
      score += 30
    }

    // Prefer starting at natural boundaries (hour, half-hour)
    const [_, minutes] = slot.start.split(':').map(Number)
    if (minutes === 0 || minutes === 30) {
      score += 20
    }

    return score
  }

  /**
   * Check if time is reasonable
   */
  private isReasonableTime(time: string): boolean {
    const hour = this.timeToMinutes(time) / 60
    return hour >= 8 && hour < 20
  }

  /**
   * Check if two time ranges overlap
   */
  private isTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const s1 = this.timeToMinutes(start1)
    const e1 = this.timeToMinutes(end1)
    const s2 = this.timeToMinutes(start2)
    const e2 = this.timeToMinutes(end2)

    return s1 < e2 && e1 > s2
  }

  /**
   * Convert time string (HH:MM) to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }
}

export const scheduleOptimizer = new ScheduleOptimizer()
