# Supabase Auth Setup Guide

Follow these steps to configure authentication for BudgetBuddy.

## 1. Enable Email/Password Auth
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** → **Providers**.
3. The **Email** provider should be enabled by default.
4. Click on the Email provider to expand its settings.
5. **During development:** You may want to *disable* "Confirm email" so you can quickly create test accounts without needing to click email verification links.
6. **For production:** Make sure "Confirm email" is *enabled* to prevent spam accounts.

## 2. Enable Google OAuth
If you want users to sign in with Google:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** → **Credentials**.
3. Click **Create Credentials** → **OAuth client ID**. (If it's your first time, you may need to configure the OAuth consent screen first).
4. Set the Application type to **Web application**.
5. Add an **Authorized redirect URI**. It should look like this:
   `https://<your-supabase-project-id>.supabase.co/auth/v1/callback`
   *(You can find your exact Supabase URL in your Supabase Dashboard under Project Settings → API).*
6. Click **Create** and copy the generated **Client ID** and **Client Secret**.
7. Go back to your Supabase Dashboard → **Authentication** → **Providers** → **Google**.
8. Enable it and paste the **Client ID** and **Client Secret**, then hit Save.

## 3. Configure Redirect URLs
Supabase needs to know which URLs are allowed to redirect back to your app after a successful login.
1. In your Supabase Dashboard, go to **Authentication** → **URL Configuration**.
2. **Site URL:** 
   - For local development, set this to `http://localhost:3000`
   - When you deploy, change this to your production Vercel URL (e.g., `https://budget-buddy.vercel.app`).
3. **Redirect URLs:**
   Add the following URIs to the allowlist so the auth callback route works:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-app>.vercel.app/auth/callback`

Your Supabase project is now ready to authenticate users!
