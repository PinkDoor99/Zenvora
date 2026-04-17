# Zenvora Deployment Guide

This guide covers deploying Zenvora Enterprise to Vercel (frontend) and Render (backend).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Frontend                         │
│                          Next.js App                            │
│              https://zenvora.vercel.app                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Makes API requests to:                                         │
│  https://zenvora-api.onrender.com                               │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Render Backend API                         │
│                       Express.js Server                         │
│              https://zenvora-api.onrender.com                   │
├─────────────────────────────────────────────────────────────────┤
│  - Language Detection API                                       │
│  - Code Quality Analysis                                        │
│  - Code Execution (Sandboxed)                                   │
│  - Authentication & User Management                             │
│  - Audit Logging                                                │
│  - Performance Monitoring                                       │
│  - Batch Processing                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables

### Frontend (Vercel)
The frontend is configured with `NEXT_PUBLIC_API_URL` pointing to the Render backend. This is set in:
- `vercel.json` (default: https://zenvora-api.onrender.com)
- Can be overridden in Vercel project settings

### Backend (Render)
The following environment variables need to be set in Render:

**Required:**
- `NODE_ENV` = `production`
- `JWT_SECRET` = Your JWT secret key (generate: `openssl rand -base64 32`)
- `CORS_ORIGIN` = `https://zenvora.vercel.app`

**Optional:**
- `OPENAI_API_KEY` = Your OpenAI API key (for cloud AI fallback)
- `JWT_EXPIRES_IN` = `24h` (default)
- `OLLAMA_BASE_URL` = Ollama API endpoint (if using external Ollama)

## Deployment Instructions

### Step 1: Prepare GitHub

The code has been committed and pushed to GitHub. Verify:
```bash
git log --oneline | head -5
# Should show: "Phase 6: Complete performance optimization..."
```

### Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import the `PinkDoor99/Zenvora` repository
4. Framework: **Next.js** (auto-detected)
5. Build settings should auto-configure:
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`
6. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = https://zenvora-api.onrender.com
   ```
7. Click "Deploy"
8. Wait for deployment to complete
9. Get your URL: `https://zenvora.vercel.app` (or your custom domain)

**Note:** Vercel will automatically ignore non-essential files using `.vercelignore`

### Step 3: Deploy Backend to Render

1. Log in to [Render](https://render.com)
2. Click "New" → "Web Service"
3. Select "Deploy an existing repository"
4. Select the `PinkDoor99/Zenvora` repository
5. Configure service:
   - **Name:** `zenvora-api`
   - **Runtime:** Node
   - **Build Command:** `npm install --production`
   - **Start Command:** `node server.js`
   - **Publish directory:** Leave blank
6. Environment Variables (click "Secret File" for sensitive values):
   ```
   NODE_ENV = production
   PORT = 10000
   CORS_ORIGIN = https://zenvora.vercel.app
   JWT_SECRET = [generate with: openssl rand -base64 32]
   OPENAI_API_KEY = [your API key, optional]
   JWT_EXPIRES_IN = 24h
   ```
7. Click "Create Web Service"
8. Wait for deployment to complete (takes ~2-3 minutes)
9. Get your URL: `https://zenvora-api.onrender.com` (auto-generated)

**Data Persistence:**
- SQLite database stored in `/data/zenvora.db` (persists across deploys)
- Render automatically persists the `data/` directory

### Step 4: Verify Deployment

Test the API endpoint:
```bash
# Check API health
curl -s https://zenvora-api.onrender.com/health | jq

# Test language detection (no auth required)
curl -s https://zenvora-api.onrender.com/detect-language \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"code":"function hello() { console.log(\"Hi\"); }"}' | jq

# Access frontend
open https://zenvora.vercel.app
```

### Step 5: Verify CORS

The API should accept requests from Vercel:
```bash
curl -s -H "Origin: https://zenvora.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://zenvora-api.onrender.com/detect-language \
  -v 2>&1 | grep -i "access-control"
```

## Production Checklist

- [ ] JWT_SECRET set in Render (strong, random value)
- [ ] CORS_ORIGIN set to actual Vercel URL
- [ ] NODE_ENV set to `production`
- [ ] OPENAI_API_KEY configured (if using cloud AI)
- [ ] Database backups enabled in Render
- [ ] SSL certificates auto-configured (Render/Vercel handle this)
- [ ] Frontend deployed to Vercel with correct API_URL
- [ ] Backend health check `/health` responding
- [ ] Audit logging working (check /admin/logs)
- [ ] Rate limiting active (100/15min)
- [ ] Security headers enabled (CORS, CSP, etc.)

## Monitoring

### Vercel Monitoring
- Log in to [Vercel Dashboard](https://vercel.com/dashboard)
- Select "Zenvora" project
- View logs: "Deployments" → Latest → "Logs"
- Monitor performance: "Analytics" tab

### Render Monitoring
- Log in to [Render Dashboard](https://render.com)
- Select "zenvora-api" service
- View logs: "Logs" tab
- Monitor metrics: "Metrics" tab (CPU, memory, requests)

## Managing Deployments

### Redeploy After Code Changes
1. Commit and push changes to GitHub
2. Vercel: Auto-redeploys on push (configured in `vercel.json`)
3. Render: Manual or webhook-triggered redeploy

**To manually trigger Render redeploy:**
1. Log in to Render Dashboard
2. Select "zenvora-api"
3. Click "Manual Deploy" button

### Environment Variable Updates
- **Vercel:** Settings → Environment Variables → Edit and redeploy
- **Render:** Environment → Edit variables → Restart service

## Scaling

### Vertical Scaling (Add Resources)
- **Vercel:** Automatic (Pro plan recommended)
- **Render:** Upgrade plan: Starter → Standard → Pro

### Horizontal Scaling (Multiple Instances)
- **Vercel:** Automatic edge deployment
- **Render:** Standard+ plans support load balancing

### Database Scaling
- SQLite (current): Works fine up to ~10K concurrent users
- For production: Consider migrating to PostgreSQL on Render

## Troubleshooting

### Frontend can't reach API
```
Check NEXT_PUBLIC_API_URL in Vercel settings
Verify CORS_ORIGIN in Render settings
Check that Render service is running
```

### API errors on Render
```
1. Check Render logs: Dashboard → Logs tab
2. Check environment variables set correctly
3. Restart service: Dashboard → Manual Deploy
4. Check database: ls -la /data/
```

### Slow performance
```
Check Render metrics for CPU/memory usage
Review cache statistics: GET /perf/cache (admin only)
Check slow queries: GET /perf/db/slow-queries (admin only)
```

### Database errors
```
Check /data/zenvora.db exists and is readable
Run optimization: POST /perf/db/optimize (admin only)
Verify database integrity
```

## Backup & Recovery

### Database Backups
Render automatically backs up data, but for safety:

```bash
# Manual backup from Render shell
cd /data
cp zenvora.db zenvora.db.backup.$(date +%Y%m%d)
```

### Restore from Backup
```bash
# Via Render shell
cd /data
cp zenvora.db.backup.YYYYMMDD zenvora.db
# Restart service
```

## Custom Domains

### Vercel
1. Settings → Domains
2. Add your domain
3. Update DNS records as indicated
4. SSL auto-configured

### Render
1. Settings → Custom Domains
2. Add domain (e.g., api.yourdomain.com)
3. Update DNS records
4. SSL auto-configured

## References

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Render Node.js Deployment](https://render.com/docs/node)
- [Environment Variables Best Practices](https://12factor.net/config)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run backend + frontend
npm run dev
```

Access:
- Frontend: `http://localhost:3000` (Next.js)
- Backend: `http://localhost:5000` (Express)

---

## 📝 Environment Variables

### Production (.env on Render)
```
NODE_ENV=production
PORT=5000
```

### Production (.env on Vercel)
```
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

---

## ✅ Deployment Checklist

- [ ] Create Render account and connect GitHub
- [ ] Deploy backend, get Render URL
- [ ] Update Vercel env var with Render URL
- [ ] Create Vercel account and connect GitHub
- [ ] Deploy frontend
- [ ] Test: Frontend → Backend API calls
- [ ] Check logs for errors

---

## 🐛 Troubleshooting

### CORS Error
- Render backend has CORS enabled for Vercel
- Check `VERCEL_URL` env var is set on Vercel

### API Not Responding
- Check Render logs: "API running on port 5000"
- Verify `NEXT_PUBLIC_API_URL` in Vercel settings

### Build Fails
- Check Node version: >= 18
- Run `npm install` locally first

---

## 📊 Monitoring

- **Render Logs**: Dashboard → Logs
- **Vercel Logs**: Dashboard → Deployments → Logs
- **Local Test**: `curl http://localhost:5000/`
