# Quick Deployment Guide

## Fastest Way: Vercel (5 minutes)

### Step 1: Prepare Environment Variables

Create a `.env.production` file in each app directory with:

**admin/.env.production:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://pchluhffsqpisgfoqkdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
QR_SECRET=your-qr-secret
NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key
```

**usher/.env.production:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://pchluhffsqpisgfoqkdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key
```

### Step 2: Deploy Admin App

```bash
cd admin
npm install -g vercel
vercel
```

Follow prompts:
1. Login or create account
2. Link to existing project or create new
3. Set root directory: `./` (current directory)
4. Override settings? No
5. Environment variables will be prompted - add all from `.env.production`

### Step 3: Deploy Usher App

```bash
cd ../usher
vercel
```

Same process as admin app.

### Step 4: Test

- Visit the deployed URLs provided by Vercel
- Test login and functionality
- Share URLs with your team

## Alternative: One-Command Deploy (if you have Vercel CLI)

```bash
# Admin
cd admin && vercel --prod

# Usher  
cd usher && vercel --prod
```

## Environment Variables Setup in Vercel Dashboard

If you prefer using the dashboard:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Import your project
3. Go to Settings → Environment Variables
4. Add each variable for:
   - Production
   - Preview (optional)
   - Development (optional)

## Important Notes

- **QR Encryption Key**: Must be the SAME in both admin and usher apps
- **Supabase URL**: Same for both apps
- **Service Role Key**: Only needed in admin app (server-side operations)
- **QR Secret**: Only needed in admin app

## After Deployment

1. Test both apps
2. Set up custom domains (optional)
3. Enable analytics (optional)
4. Set up monitoring
