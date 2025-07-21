# Dashboard Components — Business Control UI

Critical components for business operations. Settings MUST work perfectly for voice agent transmission.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Settings Accuracy | 100% | Voice agent depends on this |
| Analytics Clarity | 90% understand | Essential for owners |
| Load Performance | < 500ms | Component render time |
| Error Prevention | 100% | Validate before save |

---

## 📚 Official Documentation

- [React Query Forms](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Recharts](https://recharts.org/en-US/guide)
- [React Hook Form](https://react-hook-form.com/api)
- [Zustand State](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## 🧪 Testing Protocol

1. TypeScript verification: `npm run typecheck` - zero errors tolerated
2. Hydration safety: No browser APIs in initial render (critical for voice settings)
3. Settings test: Every field saves correctly to voice agent
4. Analytics test: Charts render with real data
5. Phone selector: Multi-location switching works
6. Integration: `npm run test -- settings`

---

## ⚡ Key Components

- `/settings/` — Voice configuration (CRITICAL)
- `/analytics/` — Business insights charts
- `/phone-onboarding/` — 2-min setup wizard
- `ConnectionStatus.tsx` — Real-time agent status
- `PhoneNumberSelector.tsx` — Multi-location switcher