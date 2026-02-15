import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { prisma } from './config/db';
import { initializeAllJobs } from './infrastructure/jobs/job-manager';
import { initializeWebSocket } from './infrastructure/websocket';
import { logger } from './common/logger/logger';

const PORT = process.env.PORT || 3001;

async function main() {
  try {
    // Create HTTP server from Express app
    const httpServer = createServer(app);

    // Initialize WebSocket
    initializeWebSocket(httpServer);

    // Initialize scheduled jobs (price updates, alert checks, etc.)
    initializeAllJobs();

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT} at 0.0.0.0`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
