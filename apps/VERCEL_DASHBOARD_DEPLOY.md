# Deploy to Vercel Using Dashboard

This guide walks you through deploying both apps using the Vercel Dashboard (no CLI required).

## Prerequisites

1. GitHub/GitLab/Bitbucket account (or upload via CLI)
2. Vercel account ([sign up here](https://vercel.com/signup))
3. Your code pushed to a Git repository (recommended)

## Step 1: Prepare Your Repository

### Option A: Using Git (Recommended)

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub/GitLab/Bitbucket**:
   - Create a new repository on GitHub
   - Push your code:
     ```bash
     git remote add origin https://github.com/yourusername/btpass.git
     git push -u origin main
     ```

### Option B: Direct Upload (Alternative)

You can also upload directly via Vercel CLI or drag-and-drop (limited support).

## Step 2: Deploy Admin App

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Add New..." → "Project"

2. **Import Repository**:
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository
   - Click "Import"

3. **Configure Project**:
   - **Project Name**: `btpass-admin` (or your preferred name)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: Click "Edit" and set to `apps/admin`
   - **Build Command**: Leave default (`npm run build`)
   - **Output Directory**: Leave default (`.next`)
   - **Install Command**: Leave default (`npm install`)

4. **Add Environment Variables**:
   Click "Environment Variables" and add:

   ```
   NEXT_PUBLIC_SUPABASE_URL = https://pchluhffsqpisgfoqkdp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
   QR_SECRET = your-qr-secret-here
   NEXT_PUBLIC_QR_ENCRYPTION_KEY = your-encryption-key-here
   ```

   **Important**: 
   - Add these for **Production**, **Preview**, and **Development** environments
   - Click "Add" after each variable

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at `https://btpass-admin.vercel.app` (or custom domain)

## Step 3: Deploy Usher App

1. **Add Another Project**:
   - Go back to [vercel.com/new](https://vercel.com/new)
   - Click "Add New..." → "Project"
   - Import the **same repository**

2. **Configure Project**:
   - **Project Name**: `btpass-usher` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: Click "Edit" and set to `apps/usher`
   - **Build Command**: Leave default
   - **Output Directory**: Leave default

3. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://pchluhffsqpisgfoqkdp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   NEXT_PUBLIC_QR_ENCRYPTION_KEY = your-encryption-key-here
   ```
   
   **Note**: Must match the encryption key from admin app!

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

## Step 4: Set Up Custom Domains (Optional)

1. **Go to Project Settings**:
   - Click on your project in Vercel dashboard
   - Go to "Settings" → "Domains"

2. **Add Domain**:
   - Enter your domain (e.g., `admin.btpass.com`)
   - Follow DNS configuration instructions
   - Vercel will provide SSL automatically

3. **Repeat for Usher App**:
   - Use a different subdomain (e.g., `usher.btpass.com`)

## Step 5: Verify Deployment

1. **Test Admin App**:
   - Visit the deployed URL
   - Test login
   - Create a test invitation
   - Download QR code

2. **Test Usher App**:
   - Visit the deployed URL
   - Test login (email or phone)
   - Scan the QR code from admin
   - Verify offline mode works

## Step 6: Enable Automatic Deployments

By default, Vercel will:
- ✅ Deploy on every push to `main` branch (Production)
- ✅ Create preview deployments for pull requests
- ✅ Rebuild on environment variable changes

## Managing Environment Variables

To update environment variables later:

1. Go to Project → Settings → Environment Variables
2. Edit or add variables
3. Click "Redeploy" to apply changes

## Troubleshooting

### Build Fails

1. **Check Build Logs**:
   - Go to Project → Deployments
   - Click on failed deployment
   - Review error messages

2. **Common Issues**:
   - Missing environment variables
   - Wrong root directory
   - Node version mismatch (should be 18+)

### Environment Variables Not Working

1. **Verify Variables**:
   - Check they're added for correct environment
   - Ensure no typos
   - Redeploy after adding variables

2. **Check Variable Names**:
   - Must start with `NEXT_PUBLIC_` for client-side variables
   - No spaces or special characters

### PWA Not Working (Usher App)

1. **Check HTTPS**:
   - PWA requires HTTPS (Vercel provides this automatically)

2. **Verify Manifest**:
   - Visit `https://your-app.vercel.app/manifest.json`
   - Should return JSON

3. **Check Service Worker**:
   - Open DevTools → Application → Service Workers
   - Should see registered worker

## Next Steps

- Set up custom domains
- Configure analytics
- Set up monitoring (Sentry, etc.)
- Enable preview deployments for testing

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
