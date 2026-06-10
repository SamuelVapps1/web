import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  { name: 'Strihanie malý', basePrice: 40, baseDurationMin: 60 },
  { name: 'Strihanie stredný', basePrice: 50, baseDurationMin: 90 },
  { name: 'Strihanie veľký', basePrice: 60, baseDurationMin: 120 },
  { name: 'Kúpanie', basePrice: 15, baseDurationMin: 30 },
  { name: 'Pazúriky', basePrice: 5, baseDurationMin: 10 },
  { name: 'Čistenie uší', basePrice: 5, baseDurationMin: 10 },
];

async function main() {
  await prisma.service.deleteMany();
  await prisma.service.createMany({
    data: services,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
