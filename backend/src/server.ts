import 'dotenv/config';
import app from './app';
import { prisma } from './config/db';
import { initializeAllJobs } from './infrastructure/jobs/job-manager';

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    // Test database connection
    // await prisma.$connect();
    // console.log('Connected to database');

    // Initialize scheduled jobs (price updates, alert checks, etc.)
    initializeAllJobs();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
