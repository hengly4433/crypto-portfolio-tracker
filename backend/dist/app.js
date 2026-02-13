"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_middleware_1 = require("./common/middlewares/error.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const asset_routes_1 = __importDefault(require("./modules/assets/asset.routes"));
const portfolio_routes_1 = __importDefault(require("./modules/portfolios/portfolio.routes"));
const transaction_routes_1 = __importDefault(require("./modules/transactions/transaction.routes"));
const price_routes_1 = __importDefault(require("./modules/price/price.routes"));
const alert_routes_1 = __importDefault(require("./modules/alerts/alert.routes"));
const exchange_routes_1 = __importDefault(require("./modules/exchanges/exchange.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/assets', asset_routes_1.default);
app.use('/api/portfolios', portfolio_routes_1.default);
app.use('/api/portfolios/:portfolioId/transactions', transaction_routes_1.default); // Nested route
app.use('/api/prices', price_routes_1.default);
app.use('/api/alerts', alert_routes_1.default);
app.use('/api/exchanges', exchange_routes_1.default);
// Error Middleware
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
