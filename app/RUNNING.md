# Running the Crypto Portfolio Tracker Mobile App

This guide will help you set up and run both the backend server and mobile application.

## Prerequisites

### 1. System Requirements
- **Node.js** v18 or later (recommended v20)
- **npm** v9 or later
- **Git** for version control
- **Expo CLI** (optional, can use npx)

### 2. For iOS Development (macOS only)
- **Xcode** 15 or later (for iOS simulator)
- **CocoaPods** (installed via Xcode or Homebrew)

### 3. For Android Development
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 17 or later
- **Android Virtual Device (AVD)** for emulator

### 4. For Web Development
- **Chrome** or **Firefox** (modern browser)

## Quick Start

### Option 1: One-Command Setup (Recommended)
```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd crypto-portfolio-tracker

# Run setup script (if available)
# Or follow manual steps below
```

### Option 2: Manual Setup

## Step 1: Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/crypto_portfolio"
   PORT=3001
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   JWT_REFRESH_SECRET="your-refresh-secret-key-change-this"
   REDIS_URL="redis://localhost:6379"
   COINGECKO_API_KEY="your-coingecko-api-key"
   ALPHA_VANTAGE_API_KEY="your-alpha-vantage-api-key"
   CORS_ORIGIN="http://localhost:3000,http://localhost:3001,http://localhost:8081"
   ```

4. **Set up PostgreSQL database**
   - Install PostgreSQL (if not installed)
   - Create a database:
     ```sql
     CREATE DATABASE crypto_portfolio;
     ```
   - Or use Docker:
     ```bash
     docker run --name crypto-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=crypto_portfolio -p 5432:5432 -d postgres:15
     ```

5. **Set up Redis (optional, for jobs)**
   - Install Redis or use Docker:
     ```bash
     docker run --name crypto-redis -p 6379:6379 -d redis:7
     ```

6. **Run database migrations**
   ```bash
   npx prisma db push
   ```

7. **Seed database (optional)**
   ```bash
   npm run prisma:seed
   ```

8. **Start the backend server**
   ```bash
   npm run dev
   ```
   
   The backend should now be running at `http://localhost:3001`

## Step 2: Mobile App Setup

1. **Navigate to app directory**
   ```bash
   cd ../app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   If you encounter network issues:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   # Backend API URL
   EXPO_PUBLIC_API_URL=http://localhost:3001/api
   
   # For production:
   # EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
   
   # App Configuration
   EXPO_PUBLIC_APP_NAME="Crypto Portfolio Tracker"
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Install Expo CLI globally (optional)**
   ```bash
   npm install -g expo-cli
   ```

## Step 3: Running the Mobile App

### Development Mode

1. **Start the Expo development server**
   ```bash
   npm start
   ```
   
   **Note**: If you see a warning about deprecated global expo-cli, the project now uses the local Expo CLI via `npx expo`. The `npm start` command has been updated to use `npx expo start`.
   
   This will open Expo DevTools in your browser at `http://localhost:8081`

2. **Choose your platform:**

   #### For iOS Simulator (macOS only)
   ```bash
   npm run ios
   ```
   Or press `i` in the terminal after `npm start`

   #### For Android Emulator
   ```bash
   npm run android
   ```
   Or press `a` in the terminal after `npm start`

   #### For Web Browser
   ```bash
   npm run web
   ```
   Or press `w` in the terminal after `npm start`

   #### For Physical Device
   1. Install Expo Go app on your phone
   2. Scan the QR code from Expo DevTools
   3. Ensure your phone and computer are on the same network

### Production Build

#### For Android
```bash
npm run build:android
```

#### For iOS
```bash
npm run build:ios
```

Note: You need to configure EAS (Expo Application Services) for production builds.

## Step 4: Testing the Application

1. **Create an account** via the Register screen
2. **Login** with your credentials
3. **Create a portfolio** from the Dashboard or Portfolios screen
4. **Add transactions** to your portfolio
5. **Set up price alerts** for your assets

## Troubleshooting

### Common Issues

#### 0. Expo CLI Deprecated Warning
- **Error**: "The global expo-cli package has been deprecated" or "Unable to find expo in this project"
- **Solution**:
  - The project uses the local Expo CLI via `npx expo`
  - Ensure dependencies are installed: `npm install` or `npm install --legacy-peer-deps`
  - Use `npm start` which now runs `npx expo start`
  - If issues persist, run `npx expo start` directly

#### 1. Backend Connection Issues
- **Error**: "Network request failed" or "Cannot connect to backend"
- **Solution**: 
  - Ensure backend is running on port 3001: `curl http://localhost:3001/health`
  - Check CORS configuration in backend `src/app.ts`
  - Update `EXPO_PUBLIC_API_URL` in app `.env` file

#### 2. Database Connection Issues
- **Error**: "Failed to connect to database"
- **Solution**:
  - Verify PostgreSQL is running: `pg_isready`
  - Check DATABASE_URL in backend `.env` file
  - Run `npx prisma db push` to apply migrations

#### 3. Expo App Not Loading
- **Error**: "Could not load app" or blank screen
- **Solution**:
  - Clear Expo cache: `expo start -c`
  - Check for TypeScript errors: `npm run typecheck`
  - Restart Metro bundler: Press `r` in terminal

#### 4. iOS Simulator Issues
- **Error**: Simulator not opening
- **Solution**:
  - Ensure Xcode is installed: `xcode-select --install`
  - Open Simulator manually from Xcode
  - Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

#### 5. Android Emulator Issues
- **Error**: Emulator not found
- **Solution**:
  - Ensure Android Studio is installed
  - Create an AVD in Android Studio
  - Start emulator before running app

#### 6. TypeScript Errors
- **Error**: Type compilation errors
- **Solution**:
  ```bash
  npm run typecheck  # Check for TypeScript errors
  npm install --save-dev typescript  # Reinstall TypeScript if needed
  ```

## Development Workflow

### 1. Start both services (recommended)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Mobile App
cd app
npm start
```

### 2. Hot Reloading
- **React Native**: Save files to see changes immediately
- **Backend**: Uses nodemon for automatic restart on changes

### 3. Debugging
- **React Native Debugger**: Install standalone debugger
- **Expo DevTools**: Built-in debugging tools
- **React DevTools**: For React component inspection

## API Testing

You can test the backend API independently:

```bash
# Health check
curl http://localhost:3001/

# List portfolios (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/portfolios
```

## Need Help?

1. Check the existing `README.md` files in each directory
2. Review the code structure documentation
3. Check Expo documentation: https://docs.expo.dev
4. Check React Navigation documentation: https://reactnavigation.org

## Environment Summary

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Backend API | 3001 | http://localhost:3001 | REST API server |
| Expo DevTools | 8081 | http://localhost:8081 | Development interface |
| iOS Simulator | - | - | iOS testing |
| Android Emulator | 5554 | - | Android testing |
| Web Browser | 19006 | http://localhost:19006 | Web testing |

Enjoy tracking your crypto portfolio! 🚀