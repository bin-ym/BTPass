# BTPass Deployment Guide

This guide covers deploying both the Admin and Usher apps to production.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- Environment variables configured
- Git repository (optional, for CI/CD)

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest option for Next.js apps with built-in support.

#### For Admin App:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to admin directory**:
   ```bash
   cd admin
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Link to your Vercel account or create one
   - When asked for environment variables, add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `QR_SECRET`
     - `NEXT_PUBLIC_QR_ENCRYPTION_KEY`

4. **Or deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Set root directory to `apps/admin`
   - Add environment variables
   - Deploy

#### For Usher App:

1. **Navigate to usher directory**:
   ```bash
   cd usher
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_QR_ENCRYPTION_KEY`

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Build the app**:
   ```bash
   cd admin  # or usher
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Add environment variables** in Netlify Dashboard:
   - Site settings → Environment variables

### Option 3: Self-Hosted (VPS/Server)

#### Using PM2 (Process Manager):

1. **Install PM2**:
   ```bash
   npm i -g pm2
   ```

2. **Build the app**:
   ```bash
   cd admin  # or usher
   npm run build
   ```

3. **Create ecosystem file** (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [{
       name: 'btpass-admin',
       script: 'npm',
       args: 'start',
       cwd: '/path/to/apps/admin',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         NEXT_PUBLIC_SUPABASE_URL: 'your-url',
         NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-key',
         // ... other env vars
       }
     }]
   };
   ```

4. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

#### Using Docker:

1. **Create Dockerfile** in each app directory:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Update next.config.ts** to enable standalone output:
   ```typescript
   const nextConfig = {
     output: 'standalone',
     // ... other config
   };
   ```

3. **Build and run**:
   ```bash
   docker build -t btpass-admin .
   docker run -p 3000:3000 --env-file .env.local btpass-admin
   ```

### Option 4: Railway

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   cd admin  # or usher
   railway init
   railway up
   ```

3. **Add environment variables** in Railway dashboard

## Environment Variables

### Admin App Required Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
QR_SECRET=your-qr-secret-key
NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key
```

### Usher App Required Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key
```

## Pre-Deployment Checklist

- [ ] All environment variables are set
- [ ] Supabase project is configured
- [ ] Database tables are created
- [ ] RLS (Row Level Security) policies are set
- [ ] QR encryption key is the same in both apps
- [ ] Test the apps locally before deploying
- [ ] Build succeeds without errors (`npm run build`)

## Post-Deployment

1. **Test the deployed apps**:
   - Admin: Login and create test invitations
   - Usher: Login and scan test QR codes

2. **Set up custom domains** (optional):
   - Admin: `admin.btpass.com`
   - Usher: `usher.btpass.com` or use as PWA

3. **Enable PWA for Usher app** (for mobile installation):
   - Add `manifest.json` and service worker
   - Configure in `next.config.ts`

4. **Monitor**:
   - Check error logs
   - Monitor Supabase usage
   - Set up error tracking (Sentry, etc.)

## Troubleshooting

### Build Errors:
- Check Node.js version (18+)
- Clear `.next` folder and rebuild
- Check for missing dependencies

### Runtime Errors:
- Verify environment variables are set
- Check Supabase connection
- Review browser console for errors

### PWA Issues (Usher):
- Ensure HTTPS is enabled
- Check service worker registration
- Verify manifest.json

## Security Notes

- Never commit `.env.local` files
- Use strong encryption keys
- Enable RLS in Supabase
- Use service role key only server-side
- Regularly rotate secrets
