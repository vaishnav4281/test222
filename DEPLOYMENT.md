# 🚀 DomainScope Deployment Guide

Complete guide for deploying the DomainScope application to production.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- **Node.js** v18 or higher
- **PostgreSQL** database (local or cloud-based like Supabase, Neon, etc.)
- **API Keys** for:
  - VirusTotal API
  - IPQualityScore (IPQS) API (2 keys recommended for rotation)
  - AbuseIPDB API

---

## 🔑 1. Environment Configuration

### Create Production Environment File

Create an `env_config` file (or `.env`) in the project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# API Keys
VITE_VIRUSTOTAL_API_KEY="your-virustotal-api-key"
VITE_IPQS_API_KEY="your-first-ipqs-api-key"
VITE_IPQS_API_KEY_2="your-second-ipqs-api-key"
VITE_ABUSEIPDB_API_KEY="your-abuseipdb-api-key"
```

### Obtaining API Keys

#### VirusTotal API
1. Visit [https://www.virustotal.com/](https://www.virustotal.com/)
2. Sign up for a free account
3. Navigate to your profile → API Key
4. Copy the API key

#### IPQualityScore (IPQS) API
1. Visit [https://www.ipqualityscore.com/](https://www.ipqualityscore.com/)
2. Create a free account
3. Go to Dashboard → API Keys
4. Create two API keys for rotation (improves rate limits)

#### AbuseIPDB API
1. Visit [https://www.abuseipdb.com/](https://www.abuseipdb.com/)
2. Sign up for an account
3. Navigate to Account → API
4. Generate an API key

---

## 🗄️ 2. Database Setup

### Initialize Prisma

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### Database Schema

The application uses these tables:
- **User** - User authentication and profiles
- **UserHistory** - Scan history with detailed results

---

## 🏗️ 3. Build the Application

### Frontend Build

```bash
# Build the frontend
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Verify Build

Check that `dist/` contains:
- `index.html`
- `assets/` folder with CSS and JS files

---

## 🌐 4. Deployment Options

### Option A: Vercel (Recommended - Easiest)

#### Frontend Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend**:
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `env_config`

#### Backend API Deployment

1. **Deploy backend to Vercel as serverless functions**:
   ```bash
   # The dev-server.js needs to be adapted for serverless
   # Or use a separate service like Railway/Render for the backend
   ```

---

### Option B: Railway / Render (Full-Stack)

#### Using Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**:
   ```bash
   railway login
   railway init
   ```

3. **Add Environment Variables**:
   ```bash
   railway variables set DATABASE_URL="your-database-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   # Add all other variables
   ```

4. **Create Start Script** in `package.json`:
   ```json
   {
     "scripts": {
       "start": "node dev-server.js",
       "build": "vite build && npx prisma generate"
     }
   }
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

---

### Option C: VPS/Docker Deployment

#### Using Docker

1. **Create `Dockerfile`**:
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   COPY prisma ./prisma/

   # Install dependencies
   RUN npm ci --only=production

   # Copy application files
   COPY . .

   # Generate Prisma client
   RUN npx prisma generate

   # Build frontend
   RUN npm run build

   EXPOSE 3001

   # Start the server
   CMD ["npm", "start"]
   ```

2. **Create `docker-compose.yml`**:
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3001:3001"
       env_file:
         - env_config
       depends_on:
         - db
       
     db:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: domainscope
         POSTGRES_USER: admin
         POSTGRES_PASSWORD: your-secure-password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

   volumes:
     postgres_data:
   ```

3. **Deploy**:
   ```bash
   docker-compose up -d
   ```

---

## 🔒 5. Security Checklist

### Before Going Live

- [ ] Change `JWT_SECRET` to a strong random string (min 32 characters)
- [ ] Use strong database password
- [ ] Enable SSL/TLS for database connections
- [ ] Set up CORS properly in `dev-server.js`
- [ ] Enable rate limiting on API endpoints
- [ ] Use HTTPS for production domain
- [ ] Keep API keys secret (never commit to Git)
- [ ] Set up database backups
- [ ] Configure firewall rules

---

## 📊 6. Monitoring & Maintenance

### Logging

Monitor these logs:
- Application errors in server console
- Database connection status
- API rate limit warnings
- Failed login attempts

### Database Maintenance

```bash
# Backup database
pg_dump your_database > backup.sql

# View Prisma Studio (database GUI)
npx prisma studio
```

### API Rate Limits

- **VirusTotal**: 4 requests/minute (free tier)
- **IPQS**: Varies by plan
- **AbuseIPDB**: 1000 checks/day (free tier)

---

## 🧪 7. Testing Production Build

### Test Locally Before Deploying

```bash
# Build the project
npm run build

# Start production server
npm start

# Test in browser
open http://localhost:3001
```

### Verify Functionality

- [ ] User registration works
- [ ] User login works
- [ ] Single domain scan works
- [ ] Bulk domain scan works
- [ ] Scan history saves and displays
- [ ] Dark mode toggle works
- [ ] Mobile responsiveness is correct

---

## 🌍 8. Custom Domain Setup

### For Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### DNS Configuration

Add these records to your DNS provider:

```
Type    Name    Value
A       @       76.76.21.21 (example - use your host's IP)
CNAME   www     your-app.vercel.app
```

---

## 📱 9. Post-Deployment

### SSL Certificate

Most platforms (Vercel, Railway, Render) automatically provision SSL certificates.

### Performance Optimization

- Enable CDN for static assets
- Configure caching headers
- Use image optimization
- Enable gzip compression

### Analytics (Optional)

Add tracking:
- Google Analytics
- Plausible Analytics
- Vercel Analytics

---

## 🐛 10. Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL format
# Ensure database is accessible
# Verify SSL mode is correct
```

**API Keys Not Working**
```bash
# Verify keys are correctly set
# Check API key quotas
# Ensure keys are active
```

**Build Fails**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Prisma Client Errors**
```bash
# Regenerate Prisma client
npx prisma generate
```

---

## 📞 Support

For issues or questions:
- Check application logs
- Review Prisma documentation: https://www.prisma.io/docs
- Check API provider status pages

---

## ✅ Final Checklist

Before launching:

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API keys are valid and working
- [ ] Build completes without errors
- [ ] Application tested locally
- [ ] Security measures implemented
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place

---

## 🎉 You're Ready!

Your DomainScope application is now ready for production deployment!

**Deployed by:** Vaishnav K
**GitHub:** https://github.com/vaishnav4281
**LinkedIn:** https://www.linkedin.com/in/va1shnav
