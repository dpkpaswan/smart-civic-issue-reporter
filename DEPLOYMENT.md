# Deployment Guide

## Backend Deployment on Render

### Step 1: Prepare Your Repository
1. Push your backend code to a GitHub repository
2. Ensure all files are committed, especially the `render.yaml` configuration

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the backend folder or root if backend is in root
5. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free (for testing) or Starter ($7/month for production)

### Step 3: Set Environment Variables on Render
Add these environment variables in Render dashboard:
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Get Your Backend URL
After deployment, your backend will be available at:
`https://your-service-name.onrender.com`

---

## Frontend Deployment on Vercel

### Step 1: Prepare Your Repository  
1. Push your frontend code to a GitHub repository
2. Note your Render backend URL from the previous step

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click "New Project"
3. Import your repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend` (if frontend is in a subfolder)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)

### Step 3: Set Environment Variables on Vercel
Add this environment variable in Vercel project settings:
```
REACT_APP_API_URL=https://smart-civic-issue-reporter.onrender.com/api
```

### Step 4: Update CORS Settings
After getting your Vercel URL (like `https://smart-civic-reporter.vercel.app`):
1. Update the CORS origins in your backend `server.js`
2. Replace `'https://your-vercel-app.vercel.app'` with your actual Vercel URL
3. Redeploy your backend on Render

---

## Important Notes

### Backend (Render)
- ✅ Free tier available but goes to sleep after inactivity
- ✅ Automatic HTTPS
- ✅ Environment variables support
- ⚠️ Cold start delay on free tier (30 seconds)

### Frontend (Vercel)
- ✅ Generous free tier with excellent performance
- ✅ Automatic deployments on git push
- ✅ Global CDN
- ✅ Perfect for React apps

### Security Checklist
1. ✅ CORS configured for production domains
2. ✅ Environment variables properly set
3. ✅ No sensitive data in frontend code
4. ⚠️ Update Supabase RLS policies for production
5. ⚠️ Consider adding rate limiting to backend

### Testing Your Deployment
1. Test backend API endpoints directly
2. Check frontend API calls in browser dev tools
3. Verify file uploads work correctly
4. Test location detection on mobile devices

### Troubleshooting
- **CORS errors**: Check backend CORS configuration
- **API not found**: Verify REACT_APP_API_URL environment variable
- **502 errors**: Backend might be sleeping (free tier)
- **Build failures**: Check Node.js version compatibility

---

## Quick Commands

### Deploy Backend
```bash
# From project root
cd backend
git add .
git commit -m "Backend deployment config"
git push origin main
```

### Deploy Frontend
```bash
# From project root  
cd frontend
git add .
git commit -m "Frontend deployment config"
git push origin main
```