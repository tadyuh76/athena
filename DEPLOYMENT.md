# Deployment Guide - Vercel

## OAuth Redirect Fix Applied ✅

Your project now correctly handles OAuth redirects in both development and production environments.

### What was fixed:

1. **AuthService.ts** - Updated to dynamically determine frontend URL:
   - Uses `FRONTEND_URL` env variable if set
   - Falls back to `VERCEL_URL` (automatically provided by Vercel)
   - Defaults to `https://ueh-athena.vercel.app` in production
   - Uses `http://localhost:3000` in development

2. **api/index.js** - Serverless handler now:
   - Detects the request host from headers
   - Sets `FRONTEND_URL` dynamically based on incoming request
   - Ensures OAuth redirects go to the correct domain

3. **Frontend config.js** - Automatically detects environment for API calls

### How it works:

**In Production (Vercel):**
- When users click "Sign in with Google", the OAuth redirect URL is automatically set to your production domain
- Email verification links use the production URL
- Password reset links use the production URL

**In Development:**
- OAuth redirects go to localhost:3000
- All auth flows work with local development server

### Environment Variables Required:

```bash
# In Vercel Dashboard, set these:
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Optional - only if using custom domain:
FRONTEND_URL=https://your-custom-domain.com
```

### Important Notes:

1. **Supabase Configuration**: Make sure your Supabase project has the correct redirect URLs configured:
   - `https://ueh-athena.vercel.app/auth-callback.html`
   - `http://localhost:3000/auth-callback.html` (for development)
   - Add any custom domains you're using

2. **No Manual URL Configuration Needed**: The system automatically detects and uses the correct URLs

3. **Custom Domains**: If you use a custom domain, set `FRONTEND_URL` in Vercel environment variables

### Testing:

1. Deploy to Vercel
2. Try signing in with Google - it should redirect back to your production URL
3. Test email verification and password reset - links should point to production URL

The OAuth redirect issue is now fully resolved!