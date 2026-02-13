# Crypto Portfolio Tracker - Mobile App

A React Native Expo mobile application for tracking cryptocurrency portfolios across multiple exchanges.

## Features

- 📊 Portfolio tracking and performance analytics
- 🔐 User authentication (login/register)
- 📱 Cross-platform (iOS, Android, Web)
- 💼 Multiple portfolio management
- 📈 Real-time price updates
- 🔔 Price alerts and notifications

## Project Structure

```
app/
├── assets/                 # Images, icons, fonts
├── components/            # Reusable UI components
├── screens/              # App screens (Login, Dashboard, etc.)
├── lib/                  # API client, utilities
├── store/                # State management (Zustand stores)
├── hooks/                # Custom React hooks
├── utils/                # Helper functions
├── App.tsx               # Main app component
├── index.js              # App entry point
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── app.json              # Expo configuration
└── babel.config.js       # Babel configuration
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Volumes/Macintosh/Projects/crypto-portfolio-tracker/app
npm install
```

If you encounter network issues, try:
```bash
npm install --legacy-peer-deps
```

### 2. Start the Development Server

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### 3. Backend Setup

Ensure the backend server is running:

```bash
cd /Volumes/Macintosh/Projects/crypto-portfolio-tracker/backend
npm install
npm run dev
```

The backend should run on `http://localhost:3001`

### 4. Configure Environment

Update API base URL in `lib/api-client.ts` if needed:
```typescript
const API_BASE_URL = 'http://localhost:3001/api'; // Change to your backend URL
```

## Key Implementation Details

### Authentication
- Uses Expo Secure Store for token storage
- Zustand for state management
- JWT-based authentication with backend

### Navigation
- Tab-based navigation for main app
- Stack navigation for auth flows
- React Navigation library

### API Integration
- Axios for HTTP requests
- Automatic token injection
- Error handling and response parsing
- BigInt serialization support

### State Management
- Zustand stores for global state
- Async storage persistence
- Type-safe store definitions

## Available Screens

1. **Login Screen** - User authentication
2. **Dashboard** - Portfolio overview
3. **Portfolios** - Portfolio management
4. **Transactions** - Transaction history
5. **Alerts** - Price alerts management
6. **Profile** - User settings

## Development Notes

- The app uses TypeScript for type safety
- Expo SDK 51 with React Native 0.74
- React Navigation for routing
- Zustand for state management
- Axios for API communication

## Next Steps

1. Complete remaining screens (PortfolioDetail, TransactionForm, etc.)
2. Add real-time price updates via WebSocket
3. Implement push notifications for alerts
4. Add chart visualizations for portfolio performance
5. Implement offline data persistence
6. Add exchange API integration (Binance, OKX, etc.)

## Troubleshooting

### Common Issues

1. **Network errors during npm install**
   - Check internet connection
   - Try `npm cache clean --force`
   - Use `npm install --legacy-peer-deps`

2. **Backend connection issues**
   - Ensure backend is running on port 3001
   - Check CORS settings in backend
   - Update API_BASE_URL in api-client.ts

3. **TypeScript errors**
   - Run `npm run typecheck` to see all TypeScript errors
   - Ensure all dependencies are installed
   - Check tsconfig.json configuration

4. **Expo build issues**
   - Clear Expo cache: `expo start -c`
   - Update Expo CLI: `npm install -g expo-cli`
   - Check Expo SDK version compatibility