# DEPLOYMENT GUIDE - Section 12 [5 Marks]

## 📋 DEPLOYMENT CHECKLIST

### Prerequisites:
- [x] MongoDB Atlas account
- [ ] Vercel/Netlify account (Frontend)
- [ ] Render/Railway account (Backend)
- [ ] GitHub repository

---

## 🗄️ STEP 1: MongoDB Atlas Setup (Database)

### 1.1 Create MongoDB Atlas Cluster:
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Create a FREE cluster (M0)
4. Choose cloud provider: AWS
5. Region: Closest to your location
6. Cluster name: `felicity-cluster`

### 1.2 Database Access:
1. Go to **Database Access** (left menu)
2. Click **Add New Database User**
3. Username: `felicity_admin`
4. Password: **Auto-generate** (copy and save!)
5. Database User Privileges: **Read and write to any database**
6. Click **Add User**

### 1.3 Network Access:
1. Go to **Network Access** (left menu)
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**

### 1.4 Get Connection String:
1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Driver: Node.js, Version: 5.5 or later
4. Copy connection string:
   ```
   mongodb+srv://felicity_admin:<password>@felicity-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. **Save this connection string securely!**

---

## 🖥️ STEP 2: Backend Deployment (Render/Railway/Fly.io)

### Option A: Render (Recommended - Free Tier)

#### 2.1 Prepare Backend:
1. Ensure `package.json` has start script:
   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

2. Create `.env.example` file (for documentation):
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   ```

3. Add to `.gitignore`:
   ```
   node_modules/
   .env
   .DS_Store
   ```

#### 2.2 Deploy to Render:
1. Go to https://render.com
2. Sign up / Log in with GitHub
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `felicity-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `MONGO_URI` = `your_mongodb_atlas_connection_string`
   - `JWT_SECRET` = `your_secure_random_string` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `JWT_EXPIRE` = `7d`

7. Click **Create Web Service**
8. Wait for deployment (5-10 minutes)
9. **Copy your backend URL**: `https://felicity-backend-xxxx.onrender.com`

#### 2.3 Test Backend:
```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/api/health

# Expected response:
{"success": true, "message": "Server is running"}
```

---

### Option B: Railway (Alternative)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Select `backend` folder
6. Add Environment Variables (same as Render)
7. Deploy
8. Get your backend URL

---

### Option C: Fly.io (Alternative)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. In backend folder: `fly launch`
4. Follow prompts
5. Set secrets: `fly secrets set MONGO_URI="..." JWT_SECRET="..."`
6. Deploy: `fly deploy`

---

## 🌐 STEP 3: Frontend Deployment (Vercel/Netlify)

### Option A: Vercel (Recommended)

#### 3.1 Prepare Frontend:

1. Update `frontend/src/services/api.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
   ```

2. Create `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

3. Create `frontend/.env.example`:
   ```
   REACT_APP_API_URL=https://your-backend-url-here/api
   ```

4. Ensure `package.json` has build script:
   ```json
   "scripts": {
     "start": "react-scripts start",
     "build": "react-scripts build",
     "test": "react-scripts test",
     "eject": "react-scripts eject"
   }
   ```

#### 3.2 Deploy to Vercel:

1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

6. Add Environment Variables:
   - `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`

7. Click **Deploy**
8. Wait for build (2-5 minutes)
9. **Copy your frontend URL**: `https://your-project.vercel.app`

#### 3.3 Custom Domain (Optional):
1. In Vercel dashboard → **Domains**
2. Add custom domain if you have one
3. Follow DNS configuration instructions

---

### Option B: Netlify (Alternative)

1. Go to https://netlify.com
2. Sign up with GitHub
3. Click **Add new site** → **Import an existing project**
4. Connect GitHub → Select repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
6. Add Environment Variables (same as Vercel)
7. Deploy
8. Get your frontend URL

---

## 🔧 STEP 4: Post-Deployment Configuration

### 4.1 Update CORS in Backend:

Edit `backend/server.js`:
```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend-url.vercel.app', // Add your Vercel URL
  'https://your-custom-domain.com' // If you have custom domain
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

Redeploy backend after this change.

### 4.2 Seed Admin User:

Run seed script on deployed backend:
```bash
# Option 1: Use Render shell
# Go to Render dashboard → Shell → Run:
node utils/seedAdmin.js

# Option 2: Railway
railway run node utils/seedAdmin.js

# Option 3: Fly.io
fly ssh console
node utils/seedAdmin.js
```

### 4.3 Test Complete Flow:

1. **Visit frontend URL**
2. **Register as participant**
3. **Login with admin** (admin@felicity.iiit.ac.in / admin123)
4. **Create organizer**
5. **Login as organizer**
6. **Create event**
7. **Register for event as participant**

---

## 📝 STEP 5: Update deployment.txt

Update the root-level `deployment.txt` file with your URLs:

```
Frontend URL: https://your-project.vercel.app
Backend API URL: https://felicity-backend-xxxx.onrender.com/api
Database: MongoDB Atlas

Admin Credentials:
Email: admin@felicity.iiit.ac.in
Password: admin123

Deployment Date: February 20, 2026
Deployed By: [Your Name]

Frontend: Deployed on Vercel
Backend: Deployed on Render
Database: MongoDB Atlas (Free Tier)
```

---

## ✅ VERIFICATION CHECKLIST

### Backend (2 marks):
- [ ] Deployed to Render/Railway/Fly.io
- [ ] Environment variables configured
- [ ] MongoDB Atlas connected
- [ ] API endpoints working
- [ ] Base API URL provided in deployment.txt

### Frontend (2 marks):
- [ ] Deployed to Vercel/Netlify
- [ ] Production build successful
- [ ] API URL configured correctly
- [ ] CORS working
- [ ] Production URL provided in deployment.txt

### Database (0.5 marks):
- [ ] MongoDB Atlas cluster created
- [ ] Connection string via environment variable
- [ ] Data persists across deployments

### Documentation (0.5 marks):
- [ ] deployment.txt file in root directory
- [ ] Frontend URL included
- [ ] Backend URL included
- [ ] Admin credentials documented

---

## 🚨 TROUBLESHOOTING

### Backend Issues:

**Error: Cannot connect to MongoDB**
- Check if IP 0.0.0.0/0 is whitelisted in Atlas
- Verify MONGO_URI is correct
- Check database user credentials

**Error: 502 Bad Gateway**
- Check if PORT is set to environment variable
- Verify start command is correct
- Check logs in hosting dashboard

**Error: Module not found**
- Run `npm install` again
- Check `package.json` dependencies
- Clear build cache and redeploy

### Frontend Issues:

**Error: Network Error / API not reachable**
- Check REACT_APP_API_URL is correct
- Verify CORS is configured on backend
- Check if backend is running

**Error: Build failed**
- Check for TypeScript errors
- Verify all dependencies are in package.json
- Check Node version compatibility

**Blank page after deployment**
- Check browser console for errors
- Verify build output directory is correct
- Check if environment variables are set

### Database Issues:

**Error: Authentication failed**
- Verify database username and password
- Check if user has correct permissions
- Try regenerating password in Atlas

**Error: Network timeout**
- Check if IP whitelist includes 0.0.0.0/0
- Verify cluster is running
- Check connection string format

---

## 📊 MARKS BREAKDOWN - SECTION 12 (5 Marks)

### 12.1 Hosting Requirements (4 marks):
- ✅ Frontend deployed to Vercel/Netlify (1.5 marks)
- ✅ Production frontend URL provided (0.5 marks)
- ✅ Backend deployed to Render/Railway/Fly (1.5 marks)
- ✅ Base API URL provided (0.5 marks)

### 12.2 Links for Evaluation (1 mark):
- ✅ deployment.txt file in root directory (0.5 marks)
- ✅ All required URLs included (0.5 marks)

---

## 🎯 QUICK START COMMANDS

### For Render Backend:
```bash
# In backend folder
npm install
node server.js
```

### For Vercel Frontend:
```bash
# In frontend folder
npm install
npm run build
# Vercel will auto-build on git push
```

### Seed Admin User:
```bash
# SSH into backend server
node utils/seedAdmin.js
```

---

## 📞 SUPPORT

If you encounter any issues:
1. Check hosting platform logs (Render/Vercel dashboard)
2. Verify all environment variables
3. Test API endpoints with Postman/curl
4. Check MongoDB Atlas metrics
5. Review CORS configuration

---

## 🎉 DEPLOYMENT COMPLETE!

Once everything is working:
1. ✅ Update deployment.txt with all URLs
2. ✅ Test complete user flow
3. ✅ Document any custom configurations
4. ✅ Submit deployment.txt for evaluation

**Total: 5/5 Marks** 🏆
