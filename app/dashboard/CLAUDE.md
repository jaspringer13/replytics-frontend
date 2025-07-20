# Dashboard — Business Control Center

Protected area where business owners manage their AI receptionist, view analytics, and configure settings.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Settings Save Time | < 3s | Critical for voice agent |
| Analytics Load Time | < 1s | Must show data instantly |
| Phone Configuration Accuracy | 100% | Zero tolerance for errors |
| User Session Duration | > 5min | Engagement metric |

---

## 📚 Official Documentation

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [NextAuth.js Protection](https://next-auth.js.org/configuration/nextjs#middleware)
- [React Query Dashboard](https://tanstack.com/query/latest/docs/react/guides/ssr)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## 🧪 Testing Protocol

1. Auth check: Protected routes redirect to signin
2. Settings test: All voice configurations save correctly
3. Analytics test: Data loads within performance budget
4. Integration test: `npm run test -- dashboard`

---

## ⚡ Key Files

- `layout.tsx` — Dashboard layout with sidebar
- `settings/page.tsx` — Voice agent configuration hub
- `analytics/page.tsx` — Business insights dashboard
- `phone-numbers/page.tsx` — Multi-location management
- `calls/page.tsx` — Call history and recordings