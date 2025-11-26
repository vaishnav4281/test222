# 🚀 DomainScope Deployment Guide

Welcome to the **DomainScope** deployment guide! This document is designed to be **simple and easy** to follow, whether you are running the project locally for development or deploying it to a production environment.

---

## 📋 Table of Contents
1. [Local Development Setup](#1-local-development-setup) (The Easy Way)
2. [Production Deployment](#2-production-deployment) (Render & Docker)
3. [Environment Variables](#3-environment-variables)
4. [Troubleshooting](#4-troubleshooting)

---

## 1. Local Development Setup

Follow these steps to get DomainScope running on your machine in minutes.

### ✅ Prerequisites
Before you start, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Redis** (Running locally or via a cloud provider)
- **PostgreSQL** (Running locally or via a cloud provider)

### 🛠️ Step 1: Backend Setup

The backend handles all the logic, database connections, and scanning tasks.

1.  **Navigate to the backend folder**:
    ```bash
    cd backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the `backend/` directory:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and fill in your `DATABASE_URL` and `REDIS_URL`.*

4.  **Initialize Database**:
    This command creates the necessary tables in your PostgreSQL database.
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Start the Server**:
    ```bash
    npm run dev
    ```
    🎉 The backend is now running at `http://localhost:3001`.

### 🎨 Step 2: Frontend Setup

The frontend is the user interface where you interact with the system.

1.  **Open a new terminal** and go to the project root (if you are in `backend/`, type `cd ..`).

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the UI**:
    ```bash
    npm run dev
    ```
    🎉 The frontend is now running at `http://localhost:5173`.

---

## 2. Production Deployment

Ready to go live? We support **Render** and **Docker** out of the box.

### ☁️ Option A: Deploy to Render (Recommended)

We have included a `render.yaml` file for "Infrastructure as Code" deployment.

1.  **Push your code** to a GitHub repository.
2.  **Create a Render account** at [render.com](https://render.com).
3.  **Connect your repository**:
    - Go to "Blueprints" in Render.
    - Select "New Blueprint Instance".
    - Connect your DomainScope repo.
4.  **Configure Environment**:
    - Render will detect the `render.yaml`.
    - You will be prompted to input your `DATABASE_URL`, `REDIS_URL`, and `VT_API_KEY`.
5.  **Deploy**: Click "Apply" and Render will build and deploy your backend automatically.

### 🐳 Option B: Docker Deployment

You can containerize the application for deployment on AWS ECS, DigitalOcean, or any VPS.

**Build the Backend Image:**
```bash
cd backend
docker build -t domainscope-backend .
```

**Run the Container:**
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e JWT_SECRET="secret" \
  domainscope-backend
```

---

## 3. Environment Variables

These are the keys you need to configure in your `.env` file or deployment platform.

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | ✅ Yes | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | ✅ Yes | Secret key for signing session tokens | `my_super_secure_secret_123` |
| `VT_API_KEY` | ❌ No | VirusTotal API Key (for threat intel) | `abc12345...` |
| `PORT` | ❌ No | Port for the backend server (default: 3001) | `3001` |
| `NODE_ENV` | ❌ No | Environment mode (`development` or `production`) | `production` |

---

## 4. Troubleshooting

**❌ Issue: "Prisma Client could not be initialized"**
*   **Fix**: Run `npx prisma generate` in the `backend/` folder to regenerate the client.

**❌ Issue: "Redis connection failed"**
*   **Fix**: Ensure your Redis server is running and the `REDIS_URL` in your `.env` is correct. If using Docker, ensure the containers are on the same network.

**❌ Issue: "CORS Error" in Frontend**
*   **Fix**: Ensure the backend is running on port 3001. If you changed the port, update the API URL in the frontend configuration.

---

*Happy Deploying! 🚀*
