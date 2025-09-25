# IMPORTANT: Supabase OAuth Configuration

## The Issue
When signing in with Google, you're being redirected to `localhost:3000` even in production. This is because Supabase's OAuth configuration needs to be updated.

## Solution - Update Supabase Dashboard

### Step 1: Go to Supabase Dashboard
1. Log in to your Supabase project at https://app.supabase.com
2. Go to **Authentication** → **URL Configuration**

### Step 2: Add Redirect URLs
In the **Redirect URLs** section, add ALL of these URLs:

```
https://ueh-athena.vercel.app/auth-callback.html
https://ueh-athena.vercel.app/auth-success.html
https://ueh-athena.vercel.app/
http://localhost:3000/auth-callback.html
http://localhost:3000/auth-success.html
http://localhost:3000/
```

If you're using a custom domain, also add:
```
https://your-custom-domain.com/auth-callback.html
https://your-custom-domain.com/auth-success.html
https://your-custom-domain.com/
```

### Step 3: Update Site URL (Important!)
In the same **URL Configuration** page:
1. Find **Site URL**
2. Change it from `http://localhost:3000` to `https://ueh-athena.vercel.app`
3. This is the default redirect URL when no specific redirect is provided

### Step 4: Save Changes
Click **Save** at the bottom of the page.

## Code Updates Applied ✅
The code has been updated to:
1. Pass the correct redirect URL dynamically based on the request origin
2. Detect whether the request is from production or localhost
3. Use the appropriate redirect URL for OAuth

## Testing
After updating Supabase:
1. Clear your browser cache/cookies
2. Try signing in with Google on production
3. You should now be redirected to the production URL

## Note
The URL you saw (`http://localhost:3000/#access_token=...`) is Supabase's implicit flow redirect. By updating the Site URL and Redirect URLs in Supabase, this will be fixed.

## Additional OAuth Providers
If you add more OAuth providers (GitHub, Facebook, etc.), the same redirect URL configuration applies.