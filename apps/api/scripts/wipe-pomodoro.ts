import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const stats = await prisma.pomodoroDailyStat.deleteMany({})
  const sessions = await prisma.pomodoroSession.deleteMany({})
  console.log(`Deleted ${stats.count} daily stats, ${sessions.count} pomodoro sessions`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
