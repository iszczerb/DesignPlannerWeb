# 🚀 DesignPlanner Deployment Guide - Railway

## Prerequisites
- GitHub account (free)
- Railway account (free - $5/month credit)
- Your DesignPlanner code ready

---

## STEP 1: Push Code to GitHub

### 1.1 Create GitHub Repository
1. Go to https://github.com
2. Click the **"+" icon** → **"New repository"**
3. Repository name: `DesignPlannerWeb`
4. Keep it **Private** or **Public** (your choice)
5. **DO NOT** initialize with README (we already have code)
6. Click **"Create repository"**

### 1.2 Push Your Code
Copy the commands GitHub shows you, but here's the exact commands:

```bash
# Add the remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/DesignPlannerWeb.git

# Push your code
git push -u origin feature/design-system-phase1
```

✅ **Your code is now on GitHub!**

---

## STEP 2: Deploy to Railway

### 2.1 Sign Up for Railway
1. Go to https://railway.app
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub
4. You get **$5 free credit every month** (enough for this app!)

### 2.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select **DesignPlannerWeb**
4. Railway will detect both services automatically

### 2.3 Configure Backend Service

Railway will create a service. Click on it and:

1. **Settings Tab:**
   - Service Name: `backend`
   - Root Directory: `/backend/DesignPlanner.Api`
   - Start Command: `dotnet run --urls=http://0.0.0.0:$PORT`

2. **Variables Tab** - Add these environment variables:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://0.0.0.0:$PORT
   ```

3. **Networking Tab:**
   - Click **"Generate Domain"**
   - Copy the URL (something like: `https://backend-production-xxxx.up.railway.app`)
   - **SAVE THIS URL** - you'll need it!

### 2.4 Configure Frontend Service

1. Click **"+ New Service"** → **"GitHub Repo"** → Select same repo
2. **Settings Tab:**
   - Service Name: `frontend`
   - Root Directory: `/frontend`
   - Build Command: `npm run build`
   - Start Command: `npx vite preview --host 0.0.0.0 --port $PORT`

3. **Variables Tab** - Add this (use backend URL from step 2.3):
   ```
   VITE_API_URL=https://backend-production-xxxx.up.railway.app/api
   ```
   (Replace xxxx with your actual backend URL!)

4. **Networking Tab:**
   - Click **"Generate Domain"**
   - Copy the URL (something like: `https://frontend-production-yyyy.up.railway.app`)
   - **THIS IS YOUR APP URL!** Share this with your team!

### 2.5 Add Database Volume (for SQLite)

Backend service:
1. Click on **"backend"** service
2. Go to **"Volumes"** tab
3. Click **"+ New Volume"**
4. Mount Path: `/app/Data`
5. Click **"Add"**

---

## STEP 3: Configure CORS in Backend

Railway needs CORS configured. Let me check if it's already set up...

In `backend/DesignPlanner.Api/Program.cs`, you need:

```csharp
// Add this BEFORE app.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://*.railway.app"  // Allow all Railway domains
        )
        .SetIsOriginAllowedToAllowWildcardSubdomains()
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Add this AFTER app.Build() but BEFORE other middleware
app.UseCors("AllowFrontend");
```

---

## STEP 4: Test Your Deployment

1. Open your frontend URL: `https://frontend-production-yyyy.up.railway.app`
2. Login with:
   - Username: `admin`
   - Password: `password123`
3. Test the app!

---

## STEP 5: Share with Your Team

Just send them the frontend URL! They can:
- Bookmark it
- Add it to their phone home screen (works like an app!)
- Use it from any device

---

## 💰 Cost Breakdown (Railway Free Tier)

- **Free Credits**: $5/month
- **Typical Usage**: $3-4/month for both services
- **You're covered!** Should stay within free tier

---

## 🔧 Updating Your App

When you make changes:

```bash
# Commit changes
git add .
git commit -m "Your update description"

# Push to GitHub
git push

# Railway will automatically redeploy! ✨
```

---

## 🆘 Troubleshooting

### Frontend shows "Cannot connect to backend"
- Check VITE_API_URL in frontend variables matches backend URL
- Make sure backend URL ends with `/api`
- Redeploy frontend

### Backend crashes
- Check logs in Railway dashboard
- Verify environment variables are set
- Check database volume is mounted

### Database resets on deploy
- Make sure volume is mounted to `/app/Data`
- Database should persist across deploys

---

## Alternative: Render.com (If Railway doesn't work)

1. Go to https://render.com
2. Sign up with GitHub
3. Create **Web Service** for backend
4. Create **Static Site** for frontend
5. Similar configuration as Railway

---

## Questions?

Check Railway docs: https://docs.railway.app
Or Render docs: https://render.com/docs

**You're ready to go! 🎉**
