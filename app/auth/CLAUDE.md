# Auth — Authentication Pages

User authentication flows including signin, password reset, and error handling.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Signin Time | < 3s | Google OAuth speed |
| Error Recovery | 100% | Graceful fallbacks |
| Mobile Responsive | 100% | All auth pages |
| Redirect Accuracy | 100% | Post-auth navigation |

---

## 📚 Official Documentation

- [NextAuth.js Pages](https://next-auth.js.org/configuration/pages)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Next.js Error Pages](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [React Hook Form](https://react-hook-form.com/get-started)

---

## 🧪 Testing Protocol

1. Auth flow test: Complete signin → dashboard redirect
2. Error states: Test invalid credentials handling
3. Password reset: Verify email flow works
4. Mobile test: Check responsive design

---

## ⚡ Key Files

- `signin/page.tsx` — Google OAuth entry point
- `error/page.tsx` — Auth error handling
- `reset-password/page.tsx` — Password recovery
- `forgot-password/page.tsx` — Reset initiation