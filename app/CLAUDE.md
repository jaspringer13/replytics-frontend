# App — Next.js Application Root

Main application directory using Next.js 14 App Router for pages, API routes, and layouts.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Page Load Time | < 2s | Measured via Web Vitals |
| API Response Time | < 200ms | Monitor route.ts files |
| TypeScript Coverage | 100% | npm run typecheck |
| Error Boundary Coverage | 100% | All pages wrapped |

---

## 📚 Official Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Error Handling](https://nextjs.org/docs/app/building-your-application/error-handling)

---

## 🧪 Testing Protocol

1. TypeScript: `npm run typecheck` after every change
2. Build test: `npm run build` before deployment
3. Route testing: Check all API routes return correct status
4. Error boundaries: Test with React Testing Library

---

## ⚡ Key Files

- `layout.tsx` — Root layout with providers
- `page.tsx` — Landing page (public)
- `error.tsx` — Global error boundary
- `/api/**/route.ts` — API endpoints
- `/dashboard/` — Protected business portal