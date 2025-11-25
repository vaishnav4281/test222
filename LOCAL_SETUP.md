# Local Development Setup Guide

Follow these steps to run the project locally.

## Prerequisites
- **Node.js** (v18+)
- **Redis** (Running locally or cloud URL)
- **PostgreSQL** (Running locally or cloud URL)

## 1. Backend Setup

The backend is now a separate service in the `backend/` directory.

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in `backend/` with the following:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
    REDIS_URL="redis://default:password@host:port" # Use the one you provided
    JWT_SECRET="your_super_secret_key"
    VT_API_KEY="your_virustotal_key"
    PORT=3001
    ```

4.  **Initialize Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:3001`.

## 2. Frontend Setup

The frontend is in the root directory.

1.  **Open a new terminal** and navigate to the project root.

2.  **Install Dependencies** (if not already done):
    ```bash
    npm install
    ```

3.  **Start the Frontend**:
    ```bash
    npm run dev
    ```
    The frontend will start on `http://localhost:5173`.

## 3. Verification

-   Open `http://localhost:5173` in your browser.
-   Try logging in or signing up.
-   Run a scan to verify the backend connection.
