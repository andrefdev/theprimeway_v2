import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = process.argv[2]?.toLowerCase().trim()
  const password = process.argv[3]
  const name = process.argv[4] ?? 'Admin'

  if (!email || !password) {
    console.error('Usage: tsx scripts/create-admin.ts <email> <password> [name]')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { email, name, passwordHash, role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  })

  console.log('Admin user ready:', user)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
