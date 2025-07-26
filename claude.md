# Replytics Website - Claude Development Guide

## Project Overview
AI-powered phone receptionist service for small businesses built with Next.js 14, TypeScript, and Supabase.

## Critical Development Rules

### 1. Code Verification Protocol
After EVERY code change, verify:
- **TypeScript**: `npm run typecheck` - zero errors tolerated
- **Hydration**: No browser APIs (`window`, `localStorage`) in initial render
- **Imports**: All imports exist and are correctly referenced
- **Dependencies**: Check package.json before using any library
- **Exports**: Ensure all used exports are properly defined

### 2. Testing Philosophy
- **NEVER simplify tests to meet failing code**
- Either the test is flawed or the code is - both can't be true
- Only simplify tests when they are fatally flawed
- Run full test suite when modifying critical functionality

### 3. Backend Voice Agent Path
```
/Users/jakespringer/Desktop/Replytics Website
```

## Development Workflow

### Before Writing Code
1. Check if dependencies exist in package.json
2. Review existing patterns in similar files
3. Verify import paths and exports

### After Writing Code (MANDATORY)
```bash
npm run typecheck    # Must pass - no TypeScript errors
npm run lint         # Should pass - fix any issues
```

### Code Quality Checklist
- [ ] TypeScript compiles without errors
- [ ] No hydration errors (browser APIs in useEffect only)
- [ ] All imports resolve correctly
- [ ] No unused imports or variables
- [ ] Consistent with existing patterns
- [ ] Proper error handling

## Quick Reference

### Essential Commands
```bash
npm run dev          # Development server
npm run typecheck    # TypeScript verification (ALWAYS RUN)
npm run lint         # Linting checks
npm run test         # Full test suite (when needed)
npm run build        # Production build verification
```

### Key Paths
- Components: `/components/{ui,dashboard,shared}/`
- API Routes: `/app/api/`
- Utilities: `/lib/{hooks,utils,api}/`
- Types: `/app/models/` and `/lib/types/`

## Common Patterns

### Import Verification
```typescript
//  Check these exist before using:
import { Button } from '@/components/ui/button'
import { usePhoneSettings } from '@/lib/hooks/usePhoneSettings'
import { createClient } from '@/lib/supabase/client'

// L Never assume availability without checking
```

### Type Safety
- Always define types for API responses
- Use existing types from `/app/models/`
- Verify type imports resolve correctly

## Available Slash Command Agents

Use any agent with: `/agent-name your-task-description`

- `/api-route-builder` - Build secure Next.js API endpoints with proper validation
- `/auth-security-expert` - Authentication patterns & security best practices
- `/business-logic-coordinator` - Business rules, workflows & domain logic
- `/call-flow-orchestrator` - Voice call lifecycle & appointment booking flows
- `/compliance-auditor` - GDPR, data retention & business compliance requirements
- `/dashboard-analytics` - Dashboard data processing & analytics features
- `/database-schema-architect` - Database design, migrations & optimization
- `/deployment-devops` - Deployment strategies & infrastructure management
- `/error-handling-strategist` - Comprehensive error handling patterns
- `/hydration-guardian` - Fix SSR/hydration issues & client-server mismatches
- `/multi-tenant-boundary-enforcer` - Tenant isolation validation & cross-tenant prevention
- `/performance-optimization` - Performance tuning & optimization strategies
- `/phone-settings-specialist` - Phone configuration & multi-tenant settings
- `/realtime-coordinator` - Real-time features & WebSocket functionality
- `/supabase-rls-security` - Supabase security & Row Level Security policies
- `/test-quality-keeper` - Testing strategies & quality assurance
- `/typescript-enforcer` - TypeScript best practices & strict typing
- `/ui-component-architect` - UI component design & architecture
- `/voice-ai-integrator` - Voice AI integration & ElevenLabs connectivity
- `/webhook-integration-specialist` - Webhook handling & external integrations

## Architecture Context
- Multi-tenant with phone-specific configurations
- Supabase for backend/realtime
- NextAuth for authentication
- React Query for data fetching
- Zustand for state management