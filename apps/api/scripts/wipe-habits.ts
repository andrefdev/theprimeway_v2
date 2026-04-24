import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const logs = await prisma.habitLog.deleteMany({})
  const habits = await prisma.habit.deleteMany({})
  console.log(`Deleted ${logs.count} habit logs, ${habits.count} habits`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
