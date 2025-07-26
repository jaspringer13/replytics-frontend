# Components — Reusable UI Library

React components ensuring beautiful, consistent design across the entire application.

---

## 🎯 Goals & Metrics

| Goal | Target | Current |
|------|--------|---------|
| Design Consistency | 100% | Use design system |
| Component Reuse | > 80% | DRY principle |
| Accessibility | WCAG AA | All components |
| Bundle Size | < 50KB/component | Tree-shaking |

---

## 📚 Official Documentation

- [Radix UI Primitives](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Patterns](https://react.dev/learn/passing-props-to-a-component)
- [Framer Motion](https://www.framer.com/motion/introduction/)

---

## 🧪 Testing Protocol

1. TypeScript verification: `npm run typecheck` - zero errors tolerated
2. Hydration safety: No browser APIs in initial render
3. Component tests: `npm run test -- components`
4. Visual regression: Check all states/variants
5. Accessibility: Test with screen readers

### ⚠️ Hydration Error Prevention

**Critical for "use client" components**:
- Never access `window`, `document`, `localStorage` during initial render
- Use `useState(null)` instead of `useState(() => localStorage.getItem(...))`
- Move browser API calls to `useEffect`
- Avoid `Date.now()`, `Math.random()` in render - use in useEffect

**Provider components are especially critical** - hydration errors here break the entire app!

---

## ⚡ Key Directories

- `/ui/` — Base components (Button, Input, Card)
- `/dashboard/` — Business portal components
- `/marketing/` — Landing page components
- `/shared/` — App-wide components (Navbar, Footer)
- `/providers/` — React context providers