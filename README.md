# MyRemote Frontend — Supabase-connected starter

## Features in this milestone
- Email/password signup and sign-in with Supabase Auth.
- Email confirmation flow (configured in Supabase dashboard).
- Authenticated user session and sign out.
- Save website project details to `public.projects`.
- Upload a selected PNG/JPEG app icon to the private `app-assets` bucket under the signed-in user's ID.
- Uses Supabase publishable key only; never put a service-role/secret key in frontend code.

## Required Vercel environment variables
Add these under Project Settings → Environment Variables, for Production (and Preview if desired):

- `VITE_SUPABASE_URL` = `https://dvgsamumziqriwcbopam.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable key

Then redeploy the latest deployment.

For local development, copy `.env.example` to `.env` and replace the placeholder with your publishable key.

## Supabase requirements
- `profiles`, `projects`, `builds`, and `wallpapers` tables created as described in the setup guide.
- RLS enabled on those tables with user-owned row policies.
- Private Storage buckets `app-assets` and `wallpapers` created.
- Storage object policies allowing authenticated users to access only paths beginning with their auth user UUID.
- Profile creation trigger may be installed in Supabase SQL Editor.

## Important limitations
This is not an APK build backend. The builder currently saves project details and icon files only. Android APK compilation/signing, build queue, actual build history, wallpaper device pairing, and applying wallpaper require separate backend/Android companion implementations.
