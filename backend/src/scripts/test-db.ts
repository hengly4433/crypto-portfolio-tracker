import { PrismaClient } from '@prisma/client';

console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to database');
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
