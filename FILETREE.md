# Replytics Website File Structure

**Last Updated:** 2025-07-20 at 14:30 UTC

## Maintenance & Automation

This file tree documentation requires regular updates as the project evolves. To maintain accuracy:

### Automation Options
1. **Pre-commit Hook**: Automatically reminds developers to update FILETREE.md when new files are added
2. **GitHub Action**: Detects file structure changes and creates PR reminders for documentation updates  
3. **Auto-generation Script**: Generates the basic file structure, allowing developers to add status annotations

### Update Process
- Update this file when adding/removing major components
- Use the status indicators: ✅ IMPLEMENTED, 🚧 PLACEHOLDER, ❌ NOT IMPLEMENTED
- Keep the timestamp current when making changes

---

```text
replytics-frontend/
├── app/                          # Next.js 14 App Router
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/   # NextAuth.js API routes
│   │           └── route.ts
│   ├── auth/                     # Authentication pages
│   │   ├── error/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── signin/
│   │       └── page.tsx
│   ├── businesses/               # Business type landing pages
│   │   ├── barbers/
│   │   │   └── page.tsx
│   │   ├── beauty-salons/
│   │   │   └── page.tsx
│   │   ├── massage-wellness/
│   │   │   └── page.tsx
│   │   ├── nail-salons/
│   │   │   └── page.tsx
│   │   └── tattoo/
│   │       └── page.tsx
│   ├── dashboard/                # Dashboard pages
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── calls/
│   │   │   └── page.tsx
│   │   ├── clients/
│   │   │   └── page.tsx         # PLACEHOLDER - "Coming Soon"
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── sms/
│   │   │   └── page.tsx
│   │   ├── support/
│   │   │   └── page.tsx
│   │   ├── layout.tsx            # Dashboard layout wrapper
│   │   └── page.tsx              # Dashboard home
│   ├── onboarding/               # Onboarding flow
│   │   ├── page.tsx              # Main onboarding wizard
│   │   ├── step2.tsx             # UNUSED - legacy file
│   │   └── step3.tsx             # UNUSED - legacy file
│   ├── pricing/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   ├── sms-opt-in/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── test/
│   │   └── page.tsx              # Test page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── businesses/
│   │   └── BusinessPageTemplate.tsx
│   ├── dashboard/
│   │   ├── ActivityTable.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── DashboardClient.tsx
│   │   ├── DashboardError.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── LiveCallIndicator.tsx
│   │   ├── RealtimeStats.tsx
│   │   ├── SidebarNav.tsx
│   │   └── StatCard.tsx
│   ├── marketing/
│   │   ├── CTASection.tsx
│   │   ├── FAQAccordion.tsx
│   │   ├── FeatureGrid.tsx
│   │   ├── HeroSection.tsx
│   │   ├── MemoryInAction.tsx
│   │   ├── PricingTable.tsx
│   │   ├── SocialProof.tsx
│   │   ├── TestimonialCard.tsx
│   │   └── TestimonialSection.tsx
│   ├── providers/
│   │   └── SessionProvider.tsx
│   ├── shared/
│   │   ├── Footer.tsx
│   │   ├── Logo.tsx
│   │   └── Navbar.tsx
│   └── ui/                       # Base UI components
│       ├── AnimatedCounter.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
│
├── contexts/
│   └── AuthContext.tsx           # Auth state management
│
├── hooks/
│   └── useBackendData.ts         # Custom hooks for data fetching
│
├── lib/
│   ├── api-client.ts             # Backend API client
│   ├── auth-config.ts            # NextAuth configuration
│   ├── auth-utils.ts             # Auth helper functions
│   ├── calendar.ts               # Calendar utilities
│   ├── supabase-client.ts        # Supabase real-time setup
│   ├── twilio.ts                 # Twilio integration (NOT IMPLEMENTED)
│   └── utils.ts                  # General utilities
│
├── styles/
│   └── globals.css               # Global styles & Tailwind
│
├── types/
│   └── next-auth.d.ts            # TypeScript declarations
│
├── middleware.ts                 # NextAuth middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Project documentation
└── claude.md                     # EMPTY - Claude-specific notes

## Key Features Status:

✅ IMPLEMENTED:
- Google OAuth authentication
- Dashboard UI (all pages)
- Onboarding flow UI
- Real-time data subscriptions setup
- API client structure
- Responsive design
- Animation system

🚧 PLACEHOLDER/UI ONLY:
- Clients page (shows "Coming Soon")
- Team management (shows "Coming Soon")
- Calendar week/day views (shows "Coming Soon")
- All integrations (shows "Coming Soon")

❌ NOT IMPLEMENTED:
- Backend API server
- Twilio phone integration
- AI/LLM integration
- Payment processing (Stripe)
- Google Calendar sync
- Email notifications
- SMS sending functionality
- Call recording/playback
- Real data persistence (except auth)

## Required Environment Variables:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- NEXT_PUBLIC_BACKEND_API_URL (backend server URL)
- NEXT_PUBLIC_SUPABASE_URL (if using Supabase)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (if using Supabase)
```