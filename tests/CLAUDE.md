# Tests — Quality Assurance Suite

Comprehensive testing ensuring voice agent settings and business features work flawlessly.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Code Coverage | > 70% | Jest coverage report |
| Critical Path Coverage | 100% | Settings, auth, payments |
| Test Execution Time | < 60s | Parallel execution |
| Flaky Test Rate | 0% | Reliable CI/CD |

---

## 📚 Official Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Next.js](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Mock Service Worker](https://mswjs.io/docs/)

---

## 🧪 Testing Protocol

1. Run all tests: `npm run test`
2. Watch mode: `npm run test -- --watch`
3. Coverage: `npm run test -- --coverage`
4. Specific test: `npm run test -- settings`

---

## ⚡ Key Test Files

- `/integration/phone-settings-flow.test.ts` — Critical path
- `/integration/settings-backend-validation.test.ts` — API validation
- `/settings/voice-settings.test.ts` — Voice config tests
- `/helpers/` — Test utilities and mocks