# Vercel Frontend Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. **Update Backend URL**
Before deploying, you MUST update your live backend URL in:
```bash
frontend/.env.production
```
Replace `https://your-backend-app-name.onrender.com/api` with your actual Render backend URL.

### 2. **Vercel Dashboard Settings**
In your Vercel dashboard, configure these settings:

#### **Build & Output Settings:**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

#### **Environment Variables:**
Add these environment variables in Vercel:
```
VITE_API_BASE_URL=https://smart-civic-issue-reporter-1.onrender.com/api
VITE_API_TIMEOUT=10000
VITE_NODE_ENV=production
VITE_APP_NAME=Smart Civic Issue Reporter
VITE_APP_VERSION=1.0.0
```

#### **Root Directory:**
- Set to: `frontend`

## 🚀 Deployment Steps

### Step 1: Connect Repository
1. Go to Vercel Dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository folder

### Step 2: Configure Project
1. **Project Name**: `smart-civic-issue-reporter`
2. **Framework**: Vite
3. **Root Directory**: `frontend`
4. **Build Settings**: (auto-detected from vercel.json)

### Step 3: Environment Variables
Add the environment variables listed above in the Vercel dashboard.

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Test your live URL

## 🔧 Current Configuration

### Files Ready:
- ✅ `vercel.json` - Deployment configuration
- ✅ `.env.production` - Production environment variables
- ✅ `package.json` - Build scripts
- ✅ `vite.config.mjs` - Vite configuration

### Build Output:
- Source: React + Vite project
- Output: Static files in `build/` directory
- SPA routing: Configured with rewrites

## 🌐 Post-Deployment

### 1. Update Social Meta Tags
After deployment, update the domain in `frontend/index.html`:
```html
<meta property="og:url" content="https://your-vercel-app.vercel.app" />
```

### 2. Test Features
- ✅ Report issue form
- ✅ Image uploads (ensure backend CORS allows your domain)
- ✅ Location detection
- ✅ Public transparency page
- ✅ Mobile responsiveness

### 3. Custom Domain (Optional)
In Vercel dashboard:
1. Go to Domains tab
2. Add your custom domain
3. Update DNS settings as instructed

## 🛡️ Security Notes

1. **CORS**: Ensure your backend allows your frontend domain
2. **HTTPS**: Vercel automatically provides SSL
3. **Environment Variables**: Never commit secrets to Git
4. **API Rate Limiting**: Consider adding rate limiting to your backend

## 📞 Support

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify environment variables are set
3. Ensure backend is accessible from Vercel servers
4. Check for any hardcoded localhost URLs in the code

Your frontend is now ready for production deployment! 🚀