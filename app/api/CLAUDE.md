# API — Backend Route Handlers

Next.js API routes handling authentication, voice agent communication, and business operations.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Response Time | < 200ms | Monitor all routes |
| Voice Settings Sync | < 100ms | Critical for agent |
| Error Rate | < 0.1% | Track with logging |
| Auth Success Rate | > 99.9% | OAuth reliability |

---

## 📚 Official Documentation

- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [NextAuth API Routes](https://next-auth.js.org/getting-started/rest-api)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)

---

## 🧪 Testing Protocol

1. API tests: `npm run test -- api`
2. Auth flow: Test OAuth callback handling
3. Rate limiting: Verify protection exists
4. Error handling: All routes return proper status codes

---

## ⚡ Key Files

- `/auth/[...nextauth]/route.ts` — OAuth handlers
- `/dashboard/**/route.ts` — Business data endpoints
- `/v2/ai/voice-settings/route.ts` — Voice agent config
- `/performance/route.ts` — Metrics collection