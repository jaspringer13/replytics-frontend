# Replytics Frontend

AI-powered phone receptionist service for small businesses.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js (Google OAuth)
- Radix UI Components

## Getting Started

1. Clone the repository
```bash
git clone <repo-url>
cd replytics-frontend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your credentials:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `/app` - Next.js 14 App Router pages and API routes
- `/components` - Reusable React components
  - `/ui` - Base UI components
  - `/shared` - Shared components (Navbar, Footer, etc.)
  - `/marketing` - Landing page components
  - `/dashboard` - Dashboard-specific components
- `/lib` - Utility functions and configurations
- `/styles` - Global CSS and Tailwind configuration

## Key Features

- ✅ Google OAuth authentication
- ✅ Responsive design
- ✅ Dashboard with KPIs
- ✅ Onboarding flow
- ✅ Pricing page with toggle
- ✅ SMS opt-in compliance
- 🚧 Google Calendar integration
- 🚧 Twilio phone/SMS integration
- 🚧 Payment processing

## Deployment

This app is optimized for deployment on Vercel:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## License

Copyright 2024 Replytics. All rights reserved.