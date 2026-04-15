# Zenvora Deployment Guide

## Architecture
- **Backend (API)**: Render - Node.js Express server
- **Frontend**: Vercel - Next.js application

---

## 🚀 Deploy to Render (Backend)

### 1. Prepare Render
- Go to [render.com](https://render.com)
- Create new Web Service
- Connect your GitHub repo

### 2. Configure Render
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  ```
  NODE_ENV=production
  PORT=5000
  ```

### 3. Deploy
- Click "Create Web Service"
- Copy your Render URL: `https://your-app.onrender.com`

---

## 🌐 Deploy to Vercel (Frontend)

### 1. Prepare Vercel
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repo

### 2. Configure Vercel
- **Framework**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Environment Variables**:
  ```
  NEXT_PUBLIC_API_URL=https://your-app.onrender.com
  ```

### 3. Deploy
- Click "Deploy"
- Vercel will auto-deploy on every push

---

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
