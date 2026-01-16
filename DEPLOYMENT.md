# Deployment Guide for SCTS

## Environment Variables Setup

### For Frontend (Vercel)

You need to set the following environment variable in your Vercel project settings:

#### Required Environment Variable:

1. **REACT_APP_BACKEND_URL** - The URL of your backend API
   - If your backend is deployed separately (e.g., Heroku, Render, Railway), set this to your backend URL
   - Example: `https://your-backend-app.herokuapp.com`
   - Example: `https://scts-backend.onrender.com`
   - Example: `https://api.sctscheduler.com`

### How to Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `REACT_APP_BACKEND_URL`
   - **Value**: Your backend API URL (without trailing slash)
   - **Environments**: Select `Production`, `Preview`, and `Development` as needed
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

### Important Notes:

- The frontend is configured to use relative URLs in production if `REACT_APP_BACKEND_URL` is not set, but this only works if your backend is on the same domain
- If your backend is on a different domain, you **must** set `REACT_APP_BACKEND_URL`
- Make sure your backend CORS settings allow requests from your Vercel domain
- After setting environment variables, always redeploy your application

## Backend CORS Configuration

Make sure your backend allows requests from your Vercel frontend domain:

```javascript
// In your backend server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://sctscheduler.vercel.app',  // Your Vercel domain
    'http://localhost:3000',            // Local development
  ],
  credentials: true
}));
```

## Testing Production Build Locally

Before deploying, test your production build locally:

```bash
cd frontend
npm run build
REACT_APP_BACKEND_URL=https://your-backend-url.com npm start
```

## Troubleshooting

### Network Error / Connection Refused
- Verify `REACT_APP_BACKEND_URL` is set correctly in Vercel
- Check that your backend is running and accessible
- Verify CORS settings on backend allow your Vercel domain
- Check browser console for exact error messages

### API Calls Failing
- Ensure all API calls use `axiosInstance` from `config/axios.js` (not direct axios)
- Verify backend URL is correct and includes protocol (https://)
- Check network tab in browser DevTools to see actual request URLs

