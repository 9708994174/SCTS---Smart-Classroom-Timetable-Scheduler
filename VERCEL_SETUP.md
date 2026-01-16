# 🔴 URGENT: Vercel Environment Variable Setup

## ⚠️ Your app is currently trying to connect to localhost in production!

To fix the login error, you **MUST** set the backend URL in Vercel.

## Step-by-Step Instructions:

### 1. Go to Vercel Dashboard
   - Visit: https://vercel.com/dashboard
   - Select your project: **SCTS---Smart-Classroom-Timetable-Scheduler**

### 2. Navigate to Settings
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

### 3. Add Environment Variable
   - Click **Add New** button
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: Your backend URL (see examples below)
   - **Environment**: Select **Production**, **Preview**, and **Development**
   - Click **Save**

### 4. Backend URL Examples:
   
   If your backend is hosted on:
   - **Heroku**: `https://your-app-name.herokuapp.com`
   - **Render**: `https://your-app-name.onrender.com`
   - **Railway**: `https://your-app-name.up.railway.app`
   - **DigitalOcean**: `https://your-app-name.digitalocean.app`
   - **Any other service**: Your backend URL

   ⚠️ **IMPORTANT**: 
   - Use `https://` (not `http://`)
   - NO trailing slash at the end
   - Example: `https://scts-backend.herokuapp.com` ✅
   - NOT: `https://scts-backend.herokuapp.com/` ❌

### 5. Redeploy Your App
   - Go to **Deployments** tab
   - Click the **three dots (⋯)** on the latest deployment
   - Click **Redeploy**
   - Select **Use existing Build Cache** or **Redeploy** (either works)

### 6. Verify It Works
   After redeploy, open your app and check browser console:
   - You should see: `🌐 API Base URL: https://your-backend-url.com`
   - You should NOT see: `⚠️ REACT_APP_BACKEND_URL not set in production!`

## Troubleshooting:

### If you don't know your backend URL:
1. Check where you deployed your backend (Heroku, Render, etc.)
2. Look at your backend deployment logs
3. Check your backend hosting service dashboard

### If backend is not deployed yet:
You need to deploy your backend first before the frontend can work!

1. **Backend deployment options:**
   - **Heroku**: Free tier available
   - **Render**: Free tier available
   - **Railway**: Free tier available
   - **DigitalOcean App Platform**: Paid but reliable

2. **After deploying backend**, use that URL in `REACT_APP_BACKEND_URL`

### If you still see 405 errors:
- Make sure `REACT_APP_BACKEND_URL` is set correctly
- Make sure you **redeployed** after setting the variable
- Check browser console for the actual URL being used
- Verify your backend is running and accessible

### Check Current Configuration:
Open browser console (F12) and look for:
- `🌐 API Base URL: ...` - This shows what URL is being used
- If you see errors about missing environment variable, the variable is not set correctly

## Still Having Issues?

1. Check Vercel build logs to see if environment variable is being read
2. Verify backend CORS allows requests from `https://sctscheduler.vercel.app`
3. Make sure backend is actually running and accessible at the URL you set

