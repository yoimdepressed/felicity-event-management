# 🚀 QUICK DEPLOYMENT CHECKLIST

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Code Preparation
- [ ] All features tested locally
- [ ] No console.errors in production build
- [ ] Environment variables documented
- [ ] .gitignore includes .env files
- [ ] package.json scripts are correct

### 2. MongoDB Atlas Setup
- [ ] Cluster created (Free M0 tier)
- [ ] Database user created with password
- [ ] Network access set to 0.0.0.0/0 (allow all)
- [ ] Connection string copied and saved
- [ ] Test connection locally

### 3. Backend Preparation
- [ ] .env.example created with all variables
- [ ] CORS configured for multiple origins
- [ ] PORT uses environment variable
- [ ] MongoDB connection uses MONGO_URI
- [ ] Health check endpoint exists
- [ ] Seed admin script ready

### 4. Frontend Preparation
- [ ] API URL uses REACT_APP_API_URL
- [ ] .env.production.example created
- [ ] Build command tested locally (npm run build)
- [ ] No hardcoded localhost URLs
- [ ] All assets in public/ folder

---

## 🗄️ MONGODB ATLAS (5 minutes)

### Quick Steps:
1. **Sign up**: https://mongodb.com/cloud/atlas/register
2. **Create Cluster**: Free M0 → AWS → Closest region
3. **Database User**: 
   - Username: `felicity_admin`
   - Password: **Auto-generate** (SAVE IT!)
4. **Network Access**: Add IP → 0.0.0.0/0 (Allow all)
5. **Get Connection String**:
   ```
   mongodb+srv://felicity_admin:<password>@cluster.mongodb.net/felicity?retryWrites=true&w=majority
   ```
6. Replace `<password>` with actual password

✅ **Test locally**: Update `.env` and run `npm start`

---

## 🖥️ BACKEND DEPLOYMENT (10-15 minutes)

### Option 1: Render (Recommended)

1. **Go to**: https://render.com
2. **New Web Service** → Connect GitHub → Select repo
3. **Settings**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://felicity_admin:PASSWORD@cluster.mongodb.net/felicity
   JWT_SECRET=[Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
   JWT_EXPIRE=7d
   FRONTEND_URL=[Will add after frontend deployment]
   ```
5. **Deploy** → Wait 5-10 minutes
6. **Copy URL**: https://felicity-backend-xxxx.onrender.com

### Option 2: Railway

1. **Go to**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Select** backend folder
4. **Add same environment variables**
5. **Deploy** → Get URL

### Test Backend:
```bash
curl https://your-backend-url.onrender.com/
# Should return: {"message": "Felicity Event Management System API"}
```

---

## 🌐 FRONTEND DEPLOYMENT (5-10 minutes)

### Vercel (Recommended)

1. **Create** `.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

2. **Go to**: https://vercel.com
3. **New Project** → Import GitHub repo
4. **Settings**:
   - Framework: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```
6. **Deploy** → Wait 2-5 minutes
7. **Copy URL**: https://your-project.vercel.app

### Netlify (Alternative)

1. **Go to**: https://netlify.com
2. **New site** → Import from GitHub
3. **Settings**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
4. **Add same environment variable**
5. **Deploy**

---

## 🔧 POST-DEPLOYMENT (5 minutes)

### 1. Update Backend CORS
Go back to Render/Railway:
- Add environment variable:
  ```
  FRONTEND_URL=https://your-project.vercel.app
  ```
- Redeploy backend (automatic)

### 2. Seed Admin User
In Render dashboard:
- Go to **Shell** tab
- Run: `node utils/seedAdmin.js`
- Verify: Admin created successfully

### 3. Test Complete Flow
1. Visit frontend URL
2. Register as participant
3. Login as admin (admin@felicity.iiit.ac.in / admin123)
4. Create organizer
5. Create event

---

## 📝 UPDATE deployment.txt

```
Frontend URL: https://felicity-2024101006.vercel.app
Backend API URL: https://felicity-backend-abc123.onrender.com/api
Database: MongoDB Atlas (Free Tier)

Admin Credentials:
Email: admin@felicity.iiit.ac.in
Password: admin123

Deployment Date: February 20, 2026
Deployed By: Yogansh (2024101006)

Frontend: Vercel
Backend: Render
Database: MongoDB Atlas

Status: ✅ Production Ready
```

---

## ⚡ COMMON ISSUES & FIXES

### Issue: CORS Error
**Fix**: 
1. Add FRONTEND_URL to backend env
2. Redeploy backend
3. Clear browser cache

### Issue: Build Failed
**Fix**:
1. Check logs in hosting dashboard
2. Verify all dependencies in package.json
3. Test build locally: `npm run build`

### Issue: Cannot connect to database
**Fix**:
1. Check MongoDB Atlas IP whitelist (0.0.0.0/0)
2. Verify MONGO_URI has correct password
3. Check database user permissions

### Issue: Blank page
**Fix**:
1. Check browser console for errors
2. Verify REACT_APP_API_URL is correct
3. Check if backend is running

---

## 🎯 FINAL CHECKLIST

### Backend:
- [ ] Deployed successfully
- [ ] Health endpoint working
- [ ] MongoDB connected
- [ ] Admin user seeded
- [ ] CORS configured
- [ ] URL added to deployment.txt

### Frontend:
- [ ] Deployed successfully
- [ ] Can access homepage
- [ ] API calls working
- [ ] Registration works
- [ ] Login works
- [ ] URL added to deployment.txt

### Database:
- [ ] Atlas cluster running
- [ ] Connection via MONGO_URI
- [ ] Data persists

### Documentation:
- [ ] deployment.txt updated
- [ ] All URLs included
- [ ] Admin credentials documented

---

## 🏆 SUCCESS!

**Total Time**: ~30 minutes
**Marks**: 5/5

Your application is now live! 🎉

**Frontend**: https://your-project.vercel.app
**Backend**: https://your-backend.onrender.com/api

Share the frontend URL for evaluation!
