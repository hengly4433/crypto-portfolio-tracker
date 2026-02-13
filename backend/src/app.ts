import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './common/middlewares/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import assetRoutes from './modules/assets/asset.routes';
import portfolioRoutes from './modules/portfolios/portfolio.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import priceRoutes from './modules/price/price.routes';
import alertRoutes from './modules/alerts/alert.routes';
import exchangeRoutes from './modules/exchanges/exchange.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.CORS_ORIGIN
  ].filter(Boolean) as string[],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/portfolios/:portfolioId/transactions', transactionRoutes); // Nested route
app.use('/api/prices', priceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/exchanges', exchangeRoutes);

// Error Middleware
app.use(errorMiddleware);

export default app;
