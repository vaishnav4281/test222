# 🚀 Complete Deployment Guide

## Deploy DomainScope to Production

This guide will help you deploy:
- **Frontend** → Vercel (React SPA)
- **Backend** → Render (Express API + Workers)

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with your repository pushed
- ✅ Vercel account (free tier available)
- ✅ Render account (free tier available)
- ✅ PostgreSQL database (use Neon, Supabase, or Render)
- ✅ Redis instance (use Redis Cloud or Render)

---

## 🎨 Part 1: Deploy Frontend to Vercel

### Step 1: Prepare Frontend for Production

1. **Update Environment Variables**

Create `/.env.production` in project root:
```env
VITE_API_URL=https://your-backend.onrender.com
```

2. **Update API Calls** (if needed)

Ensure all API calls use the environment variable:
```typescript
// src/config.ts (create this file)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Usage in components:
const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, ...);
```

3. **Test Production Build Locally**
```bash
npm run build
npm run preview
# Visit http://localhost:4173 to test
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import from GitHub

2. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     Name: VITE_API_URL
     Value: https://your-backend.onrender.com
     Environment: Production
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site will be live at `https://your-project.vercel.app`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: domainscope
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain: `domainscope.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, ~1 minute)

### Step 4: Verify Frontend Deployment

✅ Visit your Vercel URL  
✅ Check browser console for errors  
✅ Verify API calls work (check Network tab)  
✅ Test dark/light mode  
✅ Test login/signup flow  

---

## ⚙️ Part 2: Deploy Backend to Render

### Step 1: Prepare Backend for Production

1. **Create Production Environment File**

`backend/.env.production` (DO NOT commit this):
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://default:password@host:port
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
VT_API_KEY=your_virustotal_key
```

2. **Update `package.json` Scripts**

Add to `backend/package.json`:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "prisma generate"
  }
}
```

3. **Add `render.yaml` (Infrastructure as Code)**

Create `render.yaml` in project root:
```yaml
services:
  # Backend API
  - type: web
    name: domainscope-api
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npx prisma generate && npm run build
    startCommand: cd backend && npx prisma db push && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: VT_API_KEY
        sync: false
    autoDeploy: true

  # BullMQ Worker (Optional - for background jobs)
  - type: worker
    name: domainscope-worker
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npx prisma generate
    startCommand: cd backend && node dist/queues/scanQueue.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
```

### Step 2: Setup Database (PostgreSQL)

#### Option A: Use Render PostgreSQL (Recommended)

1. Go to Render Dashboard → New → PostgreSQL
2. Fill details:
   ```
   Name: domainscope-db
   Region: Oregon (same as backend)
   Plan: Free
   ```
3. Copy **Internal Database URL** (starts with `postgresql://`)
4. Save for later (you'll add to environment variables)

#### Option B: Use Neon (Serverless Postgres)

1. Visit https://neon.tech
2. Create new project: `domainscope`
3. Copy connection string
4. Note: Neon has better free tier (0.5GB storage, auto-pause)

### Step 3: Setup Redis

#### Option A: Use Redis Cloud (Recommended)

1. Visit https://redis.com/try-free/
2. Create free database:
   ```
   Name: domainscope-cache
   Region: AWS us-east-1
   Plan: Free (30MB)
   ```
3. Copy connection details:
   ```
   Endpoint: redis-xxxxx.c301.us-east-1-1.ec2.cloud.redislabs.com:xxxxx
   Password: your-password
   ```
4. Construct Redis URL:
   ```
   redis://default:your-password@redis-xxxxx.c301.us-east-1-1.ec2.cloud.redislabs.com:xxxxx
   ```

#### Option B: Use Upstash (Serverless Redis)

1. Visit https://upstash.com
2. Create Redis database
3. Copy `UPSTASH_REDIS_REST_URL`
4. Note: Better free tier, no credit card needed

### Step 4: Deploy Backend to Render

#### Option A: Using Render Dashboard (Easiest)

1. **Create Web Service**
   - Go to https://render.com/dashboard
   - Click "New" → "Web Service"
   - Connect GitHub repository

2. **Configure Build**
   ```
   Name: domainscope-backend
   Region: Oregon (or nearest to you)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npx prisma db push && npm start
   Plan: Free
   ```

3. **Advanced Settings**
   ```
   Health Check Path: /health
   Auto-Deploy: Yes
   ```

4. **Environment Variables**
   
   Click "Environment" tab and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Required |
   | `DATABASE_URL` | `postgresql://...` | From Render/Neon DB |
   | `REDIS_URL` | `redis://...` | From Redis Cloud |
   | `JWT_SECRET` | `your-secret-min-32-chars` | Generate random string |
   | `VT_API_KEY` | `your-key` | Optional |
   | `PORT` | `3001` | Optional (Render auto-assigns) |

   **Generate JWT Secret**:
   ```bash
   # Run locally to generate random secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deployment
   - Check logs for errors

#### Option B: Using Render CLI

```bash
# Install Render CLI
brew install render  # macOS
# or download from https://render.com/docs/cli

# Login
render login

# Create service from render.yaml
render up
```

### Step 5: Setup BullMQ Worker (Optional)

If you want background job processing:

1. **Create Background Worker**
   - In Render Dashboard → New → Background Worker
   - Same GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node dist/queues/scanQueue.js`

2. **Add Environment Variables** (same as web service)

3. **Deploy**

### Step 6: Database Migrations

After first deployment:

```bash
# SSH into Render shell (from dashboard)
# Or run one-time job:

npx prisma db push
npx prisma generate
```

---

## 🔗 Part 3: Connect Frontend to Backend

### Step 1: Update Vercel Environment Variables

1. Go to Vercel Project → Settings → Environment Variables
2. Update `VITE_API_URL`:
   ```
   Name: VITE_API_URL
   Value: https://domainscope-backend.onrender.com
   ```
3. Redeploy frontend:
   ```bash
   vercel --prod
   ```

### Step 2: Configure CORS on Backend

Update `backend/src/app.ts`:
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',           // Local dev
    'https://your-project.vercel.app', // Vercel
    'https://domainscope.com',         // Custom domain
  ],
  credentials: true,
}));
```

Redeploy backend:
```bash
git add .
git commit -m "fix: Update CORS for production"
git push  # Auto-deploys to Render
```

---

## ✅ Part 4: Post-Deployment Verification

### Backend Health Checks

```bash
# 1. Health endpoint
curl https://domainscope-backend.onrender.com/health
# Expected: {"status":"ok","version":"v1"}

# 2. Metrics endpoint
curl https://domainscope-backend.onrender.com/metrics
# Expected: Prometheus metrics

# 3. API versioning
curl -I https://domainscope-backend.onrender.com/api/v1/scan/dnsbl/8.8.8.8
# Check for: X-API-Version: v1
```

### Frontend Checks

1. ✅ Visit your Vercel URL
2. ✅ Open browser DevTools → Network tab
3. ✅ Try login/signup
4. ✅ Verify API calls go to Render backend
5. ✅ Check for CORS errors (should be none)

### Database Check

```bash
# Via Render Shell or local connection
psql $DATABASE_URL

# Check tables exist
\dt

# Expected tables:
# - User
# - ApiKey  
# - ScanHistory
# - UserHistory
# - Webhook
```

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "CORS Error" in Browser

**Fix**:
1. Check backend CORS configuration includes Vercel URL
2. Verify environment variable `VITE_API_URL` is set
3. Ensure HTTPS (not HTTP) for production

### Issue 2: "Database Connection Failed"

**Fix**:
1. Verify `DATABASE_URL` in Render environment variables
2. Check if database is running (Render dashboard)
3. Ensure Prisma schema matches database:
   ```bash
   npx prisma db push --force-reset  # Caution: deletes data
   ```

### Issue 3: "Redis Connection Timeout"

**Fix**:
1. Verify `REDIS_URL` format: `redis://default:password@host:port`
2. Check Redis Cloud firewall rules (should allow Render IPs)
3. Test connection:
   ```bash
   redis-cli -u $REDIS_URL ping
   # Expected: PONG
   ```

### Issue 4: "Build Failed on Render"

**Fix**:
1. Check build logs in Render dashboard
2. Common causes:
   - Missing dependencies in `package.json`
   - TypeScript errors
   - Wrong Node version
3. Set Node version in `package.json`:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

### Issue 5: "App Crashes After Deployment"

**Fix**:
1. Check Render logs: Dashboard → Your Service → Logs
2. Common causes:
   - Missing environment variables
   - Database connection issues
   - Port binding (use `process.env.PORT`)
3. Update `server.ts`:
   ```typescript
   const PORT = process.env.PORT || 3001;
   ```

---

## 📊 Monitoring Your Production App

### Render Monitoring

1. **Logs**: Real-time logs in dashboard
2. **Metrics**: CPU, Memory, Response time
3. **Alerts**: Set up email alerts for downtime

### Vercel Monitoring

1. **Analytics**: Vercel Dashboard → Analytics
2. **Performance**: Core Web Vitals, response times
3. **Error Tracking**: Integrate Sentry (optional)

### External Monitoring (Recommended)

```bash
# Use UptimeRobot (free)
# 1. Visit https://uptimerobot.com
# 2. Add monitors:
#    - Frontend: https://your-project.vercel.app
#    - Backend: https://domainscope-backend.onrender.com/health
#    - Interval: 5 minutes
```

---

## 🚀 Performance Optimization

### 1. Enable Caching Headers (Vercel)

Create `vercel.json` in root:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Enable Compression (Render)

Backend already uses `compression` middleware.

### 3. Database Connection Pooling

Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier Limits | Upgrade Cost |
|---------|------------------|--------------|
| **Vercel** | 100 GB bandwidth/month | $20/month Pro |
| **Render Web** | 750 hours/month (1 instance) | $7/month Starter |
| **Render PostgreSQL** | Expires after 90 days | $7/month |
| **Redis Cloud** | 30MB storage | $5/month |
| **Neon** | 0.5GB storage, auto-pause | $19/month |

**Total Free**: All services free for 3 months  
**After 90 days**: ~$15-20/month for production  

---

## 🔄 Continuous Deployment

Both platforms auto-deploy on `git push`:

```bash
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin main

# Auto-deploys to:
# ✅ Vercel (frontend) - ~2 min
# ✅ Render (backend) - ~5 min
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] CORS configured for production URL
- [ ] Build succeeds locally (`npm run build`)

### Vercel (Frontend)
- [ ] Project deployed
- [ ] Environment variables set
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Build logs clean

### Render (Backend)
- [ ] Web service deployed
- [ ] PostgreSQL database created
- [ ] Redis instance running
- [ ] Environment variables set
- [ ] Health check passing
- [ ] Logs show no errors
- [ ] Prisma migrations applied

### Post-Deployment
- [ ] Frontend loads successfully
- [ ] Login/signup works
- [ ] API calls successful
- [ ] Scans complete successfully
- [ ] No CORS errors
- [ ] Metrics endpoint accessible
- [ ] Monitoring setup (UptimeRobot)

---

## 🎉 Success!

Your app is now live at:
- 🌐 **Frontend**: https://your-project.vercel.app
- ⚙️ **Backend**: https://domainscope-backend.onrender.com
- 📊 **Metrics**: https://domainscope-backend.onrender.com/metrics

Share your deployed app and impress recruiters! 🚀

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Redis Cloud Guide](https://redis.com/redis-enterprise-cloud/overview/)

---

**Need Help?** Check the troubleshooting section or Render/Vercel support channels.
