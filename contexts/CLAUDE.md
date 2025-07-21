# Contexts — Global State Management

React Context providers for application-wide state management. **CRITICAL FOR HYDRATION**.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Hydration Safety | 100% | No SSR/client mismatches |
| Performance | < 16ms renders | Minimize re-renders |
| Type Safety | 100% | Full TypeScript coverage |
| Error Prevention | Zero runtime errors | Proper error boundaries |

---

## 📚 Official Documentation

- [React Context API](https://react.dev/reference/react/createContext)
- [Next.js Hydration](https://nextjs.org/docs/messages/react-hydration-error)
- [useState Best Practices](https://react.dev/reference/react/useState)
- [useEffect for Client Code](https://react.dev/reference/react/useEffect)

---

## 🧪 Testing Protocol

1. TypeScript: `npm run typecheck` - zero errors
2. Build test: `npm run build` - must pass
3. Hydration test: No browser APIs in initial state
4. Console check: No hydration warnings in browser
5. Error boundaries: Wrap providers properly

---

## ⚠️ CRITICAL: Hydration Error Prevention

**Context providers wrap the ENTIRE app. Hydration errors here break EVERYTHING.**

### ❌ NEVER DO THIS:
```typescript
// This causes hydration mismatch!
const [user, setUser] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user');
  }
  return null;
});

// This also breaks!
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
```

### ✅ ALWAYS DO THIS:
```typescript
// Initialize with consistent value
const [user, setUser] = useState(null);

// Load from localStorage AFTER mount
useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, []);
```

### Common Hydration Pitfalls:
- `localStorage`, `sessionStorage` access
- `window`, `document` references
- `Date.now()`, `Math.random()`
- Browser-only APIs (navigator, location)
- Conditional rendering with `typeof window`

### Debugging Hydration Errors:
1. Check browser console for React errors #418, #423
2. Look for "Hydration failed" messages
3. Compare server vs client HTML in view-source
4. Add console.logs in useEffect to verify timing

---

## ⚡ Key Files

- `AuthContext.tsx` — Authentication state (user, tokens)
- `PhoneSettingsContext.tsx` — Phone-specific settings
- `SettingsContext.tsx` — Business settings management
- `AnalyticsContext.tsx` — Analytics data caching

**Remember: One hydration error in contexts = entire app broken!**