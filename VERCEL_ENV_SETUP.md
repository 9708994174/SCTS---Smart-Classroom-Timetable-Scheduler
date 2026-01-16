# ✅ Quick Setup: Add Backend URL to Vercel

## Your Backend URL:
```
https://scts-smart-classroom-timetable-scheduler.onrender.com
```

## Steps to Add Environment Variable:

1. **In Vercel Environment Variables page** (where you are now)

2. **Click "Add Environment Variable"** button (top right)

3. **Enter these values:**
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://scts-smart-classroom-timetable-scheduler.onrender.com`
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production if you prefer)

4. **Click "Save"**

5. **IMPORTANT - Redeploy:**
   - Go to **Deployments** tab
   - Click **three dots (⋯)** on latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete

6. **Verify:**
   - Open your app after redeploy
   - Press **F12** to open browser console
   - You should see: `🌐 API Base URL: https://scts-smart-classroom-timetable-scheduler.onrender.com`
   - Login should now work! 🎉

## ⚠️ Important Notes:

- **Variable name MUST be**: `REACT_APP_BACKEND_URL` (NOT `VITE_API_URL`)
- **No trailing slash** in the URL
- **Must redeploy** after adding the variable for it to take effect
- React apps only read environment variables that start with `REACT_APP_`

## Current Issue:

You have `VITE_API_URL` set, but this is a **React app** (not Vite), so it needs `REACT_APP_BACKEND_URL` instead.

