# Deployment Guide: Crypto Portfolio Tracker

This guide details how to deploy the application to **Render** using **Docker** and **Infrastructure as Code (Blueprints)**. This is the recommended deployment method as it ensures environment consistency between development and production.

## 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed (for local testing).
- A [Render](https://render.com) account.
- Your code pushed to a **GitHub Repository**.
- **API Keys**:
  - CoinGecko (Optional, but recommended)
  - AlphaVantage (Required for Forex/Gold)

## 2. Project Structure for Deployment

The project is configured for Docker-based deployment with the following files:

- **`render.yaml`**: The Blueprint file that defines all services (Database, Redis, Backend, Frontend) and their relationships.
- **`backend/Dockerfile`**: Instructions to build the Node.js backend image.
- **`frontend/Dockerfile`**: Instructions to build the Next.js frontend image (using standalone output).
- **`docker-compose.yml`**: Configuration for running the entire stack locally.

## 3. Deploying to Render (Blueprint)

The easiest way to deploy is using a Render Blueprint. This will create the Database, Redis, Backend, and Frontend services automatically and link them together.

### Step 1: Create Blueprint

1.  Log in to the [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Blueprint**.
3.  Connect your **GitHub Repository**.
4.  Render will automatically detect the `render.yaml` file.
5.  Give your service stack a name (e.g., `crypto-tracker-production`).

### Step 2: Configure Environment

Render will show you the resources it's about to create:

- **`crypto-db`**: PostgreSQL Database.
- **`crypto-redis`**: Redis instance (for caching and job queues).
- **`crypto-backend`**: The Backend API service.
- **`crypto-frontend`**: The Frontend Web service.

**Important**: You will be prompted to enter values for:

- `COINGECKO_API_KEY`
- `ALPHA_VANTAGE_API_KEY`

Enter your keys here. The other variables (Database URL, Redis URL, Secrets) are handled automatically by the Blueprint.

### Step 3: Apply & Deploy

1.  Click **Apply**.
2.  Render will start deploying all services.
3.  The **Backend** will wait for the **Database** and **Redis** to be ready.

## 4. Post-Deployment Verification

Once all services show **Live**:

1.  **Check Backend**: Visit the Backend URL. It usually returns a 404 on root, but you can try `/api/health` or `/api/status` if implemented.
2.  **Check Frontend**: Visit the Frontend URL.
3.  **Test Login**: Try to register/login.
    - If you get a **CORS Error**: Check the Backend logs. Ensure `CORS_ORIGIN` is correctly set.
    - The `render.yaml` automatically sets `NEXT_PUBLIC_API_URL` for the frontend.

## 5. Local Development with Docker

To test the production build locally without deploying:

```bash
docker-compose up --build
```

This will spin up:

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Backend**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`

This is confirming that your Dockerfiles work correctly before pushing to Render.

## Troubleshooting

### Build Failures

- **Frontend**: One common issue is TypeScript/Lint errors preventing the build. The `next.config.ts` has been configured to ignore these during the Docker build (`ignoreDuringBuilds: true`), but you should fix them in your code for long-term stability.
- **Backend**: Ensure `prisma generate` runs before the code compiles. The Dockerfile handles this order correctly.
