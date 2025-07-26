# Supabase Authentication Migration

This document outlines the changes needed to migrate from the custom auth to Supabase auth.

## 1. Update Providers

Replace the AuthProvider with SupabaseAuthProvider in `components/providers/SessionProvider.tsx`:

```tsx
// OLD:
import { AuthProvider } from "@/contexts/AuthContext"

// NEW:
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext"

// In the component, replace:
<AuthProvider>
  {children}
</AuthProvider>

// With:
<SupabaseAuthProvider>
  {children}
</SupabaseAuthProvider>
```

## 2. Update Imports

Throughout the app, replace:
```tsx
import { useAuth } from "@/contexts/AuthContext"
```

With:
```tsx
import { useSupabaseAuth as useAuth } from "@/contexts/SupabaseAuthContext"
```

## 3. Create Test User in Supabase

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Create a user with:
   - Email: jaspringer13@gmail.com
   - Password: admin
   - User metadata:
     ```json
     {
       "name": "Jake Springer",
       "tenant_id": "test-tenant-1",
       "current_business_id": "test-business-1"
     }
     ```
   - App metadata:
     ```json
     {
       "permissions": ["admin"],
       "tenant_id": "test-tenant-1"
     }
     ```

## 4. Environment Variables

Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-from-dashboard

# Backend also needs:
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard
```

## 5. Testing the Flow

1. Start the backend:
   ```bash
   cd /Users/jakespringer/Replytics/voice-bot
   python -m uvicorn main:app --host 0.0.0.0 --port 10000 --reload
   ```

2. Start the frontend:
   ```bash
   cd /Users/jakespringer/Desktop/Replytics\ Website
   npm run dev
   ```

3. Test login with jaspringer13@gmail.com / admin

## 6. Benefits

- Single authentication system
- Automatic token refresh
- Built-in session management
- Secure by default
- Less code to maintain