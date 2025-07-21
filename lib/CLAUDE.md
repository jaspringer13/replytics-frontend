# Lib — Core Utilities & Configuration

Shared utilities, hooks, API clients, and configurations powering the entire application.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Type Safety | 100% | Full TypeScript coverage |
| Hook Performance | < 50ms | No unnecessary re-renders |
| API Client Reliability | 99.9% | Retry logic included |
| Config Validation | 100% | Runtime type checking |

---

## 📚 Official Documentation

- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [React Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)

---

## 🧪 Testing Protocol

1. Unit tests: Test all utils and helpers
2. Hook tests: Use @testing-library/react-hooks
3. Type tests: `npm run typecheck` catches issues
4. API mocks: Test error scenarios
5. Singleton safety: No browser API access during module initialization

### ⚠️ Hydration Error Prevention

**Critical for singleton instances (api-client, config)**:
- Don't access `localStorage` in constructors or module-level code
- Use lazy initialization for browser-dependent values
- Environment variables must work on both server and client
- Avoid `console.log` in constructors if values differ between server/client

---

## ⚡ Key Files

- `/hooks/usePhoneSettings.ts` — Multi-tenant settings
- `/api-client.ts` — Centralized API calls
- `/supabase-client.ts` — Database connection
- `/config/` — App configuration constants
- `/utils.ts` — Shared utility functions