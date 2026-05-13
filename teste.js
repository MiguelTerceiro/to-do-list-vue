import pkg from '@prisma/client'

const { PrismaClient } = pkg
const prisma = new PrismaClient()

async function main() {
  const tarefas = await prisma.tarefas.findMany()
  console.log(tarefas)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })