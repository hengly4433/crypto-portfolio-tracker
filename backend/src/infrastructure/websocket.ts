import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../common/utils/jwt';
import { createModuleLogger } from '../common/logger/logger';

const log = createModuleLogger('websocket');

let io: Server | null = null;

export const initializeWebSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:8081',
        process.env.NEXT_PUBLIC_APP_URL || '',
        process.env.CORS_ORIGIN || '',
      ].filter(Boolean),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    log.info({ userId, socketId: socket.id }, 'Client connected');

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join portfolio rooms
    socket.on('join:portfolio', (portfolioId: string) => {
      socket.join(`portfolio:${portfolioId}`);
      log.debug({ userId, portfolioId }, 'Joined portfolio room');
    });

    socket.on('leave:portfolio', (portfolioId: string) => {
      socket.leave(`portfolio:${portfolioId}`);
    });

    socket.on('disconnect', () => {
      log.info({ userId, socketId: socket.id }, 'Client disconnected');
    });
  });

  log.info('WebSocket server initialized');
  return io;
};

export const getIO = (): Server | null => io;

/**
 * Emit a price update event
 */
export const emitPriceUpdate = (data: { assetId: string; symbol: string; price: number; change24h?: number }) => {
  io?.emit('price:update', data);
};

/**
 * Emit a portfolio update to a specific portfolio room
 */
export const emitPortfolioUpdate = (portfolioId: string, data: any) => {
  io?.to(`portfolio:${portfolioId}`).emit('portfolio:update', data);
};

/**
 * Emit an alert trigger to a specific user
 */
export const emitAlertTriggered = (userId: string, data: any) => {
  io?.to(`user:${userId}`).emit('alert:triggered', data);
};
