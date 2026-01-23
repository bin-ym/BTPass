# BTPass - Event Guest Management System

A comprehensive event management system with admin dashboard and usher mobile app for managing guest invitations and QR code scanning.

## 🚀 Features

### Admin App (Web)
- **Usher Management**: Add/remove ushers, assign credentials
- **Bulk Invitation Upload**: Import from CSV or Google Sheets
- **QR Generation**: Automatically generate encrypted QR codes
- **Dashboard & Logs**: Real-time statistics and scan history
- **Scalable**: Handles 10,000+ guests with batch processing

### Usher App (PWA/Mobile)
- **Flexible Authentication**: Login with email or phone number
- **QR Scanning**: Real-time QR code validation
- **Offline Mode**: Works without internet, syncs when online
- **Scan Logging**: Complete history with all details
- **PWA Support**: Install as mobile app

## 📁 Project Structure

```
BTPass/
├── apps/
│   ├── admin/          # Admin web dashboard
│   ├── usher/          # Usher mobile PWA
│   ├── docker-compose.yml
│   └── .gitignore
├── README.md
└── DEPLOYMENT_SUMMARY.md
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **QR Codes**: html5-qrcode, qrcode
- **PWA**: next-pwa
- **Deployment**: Vercel, Docker

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Environment variables configured

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bin-ym/BTPass.git
   cd BTPass/apps
   ```

2. **Install dependencies**:
   ```bash
   cd admin && npm install
   cd ../usher && npm install
   ```

3. **Set up environment variables**:
   
   **Admin** (`admin/.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   QR_SECRET=your-qr-secret
   NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key
   ```
   
   **Usher** (`usher/.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_QR_ENCRYPTION_KEY=your-encryption-key
   ```

4. **Run development servers**:
   ```bash
   # Admin (port 3000)
   cd admin && npm run dev
   
   # Usher (port 3001)
   cd usher && npm run dev
   ```

## 📦 Deployment

### Option 1: Vercel Dashboard (Recommended)

See [VERCEL_DASHBOARD_DEPLOY.md](apps/VERCEL_DASHBOARD_DEPLOY.md) for step-by-step instructions.

### Option 2: Docker

See [DOCKER_DEPLOY.md](apps/DOCKER_DEPLOY.md) for Docker deployment.

```bash
# Quick start with Docker Compose
cd apps
docker-compose up --build
```

### Option 3: Other Platforms

See [DEPLOYMENT.md](apps/DEPLOYMENT.md) for comprehensive deployment options.

## 📱 PWA Setup (Usher App)

The usher app is configured as a PWA. To complete setup:

1. Generate PWA icons (192x192 and 512x512 PNG)
2. Place them in `apps/usher/public/`:
   - `icon-192.png`
   - `icon-512.png`

See [apps/usher/public/ICON_README.md](apps/usher/public/ICON_README.md) for details.

## 🔐 Environment Variables

### Required for Both Apps
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_QR_ENCRYPTION_KEY` - **Must be identical in both apps**

### Admin App Only
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations
- `QR_SECRET` - QR code secret key

## 📚 Documentation

- [Deployment Summary](apps/DEPLOYMENT_SUMMARY.md)
- [Vercel Dashboard Guide](apps/VERCEL_DASHBOARD_DEPLOY.md)
- [Docker Guide](apps/DOCKER_DEPLOY.md)
- [Quick Deploy](apps/QUICK_DEPLOY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- Repository: https://github.com/bin-ym/BTPass
- Supabase: https://supabase.com
- Next.js: https://nextjs.org
- Vercel: https://vercel.com

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ by BT Creative
