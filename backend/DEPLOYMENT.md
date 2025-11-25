# Deployment Guide (Render.com)

This project has been refactored into a separate `backend` service. Follow these steps to deploy.

## 1. Backend Deployment (Web Service)

1.  **Create a New Web Service** on Render.
2.  **Connect your Repository**.
3.  **Root Directory**: Set to `backend`.
4.  **Build Command**: `npm install && npx prisma generate && npx tsc`
5.  **Start Command**: `node dist/server.js` (or `npm start` if you add a start script)
6.  **Environment Variables**:
    - `DATABASE_URL`: Your PostgreSQL URL (Neon, Supabase, etc.)
    - `REDIS_URL`: Your Redis URL (Render Redis, Upstash, etc.)
    - `JWT_SECRET`: A strong secret key.
    - `VT_API_KEY`: VirusTotal API Key.

## 2. Redis (Background Worker)

To process background scans (BullMQ), you need a Redis instance.
1.  **Create a New Redis** on Render (or use an external provider).
2.  Copy the `REDIS_URL` to your Backend environment variables.

## 3. Frontend Deployment (Static Site)

1.  **Create a New Static Site** on Render.
2.  **Root Directory**: `.` (Root of repo).
3.  **Build Command**: `npm install && npm run build`.
4.  **Publish Directory**: `dist`.
5.  **Environment Variables**:
    - `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://my-backend.onrender.com`).

## 4. Local Development

1.  **Backend**:
    ```bash
    cd backend
    npm install
    npx prisma generate
    npm run dev
    ```
2.  **Frontend**:
    ```bash
    cd ..
    npm install
    npm run dev
    ```
