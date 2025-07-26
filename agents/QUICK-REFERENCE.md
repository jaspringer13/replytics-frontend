# Agent Quick Reference Guide

**20 Specialized Agents** | Quick lookup for optimal agent selection

---

## 🔧 Development & Code Quality

| Agent | Primary Use Case | Use When | Don't Use When |
|-------|-----------------|----------|----------------|
| **`/typescript-enforcer`** | Fix TypeScript errors, enforce strict typing | Type compilation fails, need stricter types | Code works fine, just want general cleanup |
| **`/error-handling-strategist`** | Design comprehensive error handling patterns | Building error boundaries, handling failures | Simple try-catch scenarios |
| **`/hydration-guardian`** | Fix SSR/hydration mismatches | Client-server render differences, hydration errors | Static site issues, non-SSR problems |
| **`/performance-optimization`** | Optimize app performance, reduce bundle size | Slow load times, high memory usage | Premature optimization, feature development |

---

## 🏗️ Architecture & Infrastructure

| Agent | Primary Use Case | Use When | Don't Use When |
|-------|-----------------|----------|----------------|
| **`/api-route-builder`** | Build secure Next.js API endpoints | Creating new endpoints, need validation patterns | Simple CRUD operations, frontend-only tasks |
| **`/database-schema-architect`** | Design database schemas, migrations | Schema changes, performance issues, new tables | Simple queries, data manipulation |
| **`/deployment-devops`** | Deploy apps, CI/CD pipelines, infrastructure | Production deployments, automation needs | Local development, quick prototypes |
| **`/supabase-rls-security`** | Supabase RLS policies, data isolation | Multi-tenant security, database permissions | Frontend auth, non-Supabase databases |

---

## 🔐 Security & Authentication

| Agent | Primary Use Case | Use When | Don't Use When |
|-------|-----------------|----------|----------------|
| **`/auth-security-expert`** | Authentication flows, session management | Login systems, security patterns | Database permissions, API design |
| **`/multi-tenant-boundary-enforcer`** | Validate tenant isolation, prevent cross-tenant access | Multi-tenant validation, security audits | Single-tenant apps, general security |
| **`/compliance-auditor`** | GDPR compliance, data retention, privacy laws | Regulatory compliance, data governance | Internal security, authentication flows |
| **`/webhook-integration-specialist`** | External webhooks, API integrations | Third-party integrations, event handling | Internal APIs, database operations |

---

## 🎨 User Interface & Experience

| Agent | Primary Use Case | Use When | Don't Use When |
|-------|-----------------|----------|----------------|
| **`/ui-component-architect`** | Design reusable components, UI patterns | Component libraries, design systems | Quick UI fixes, styling adjustments |
| **`/dashboard-analytics`** | Dashboard features, data visualization | Analytics dashboards, metrics display | Simple data display, non-analytical UI |

---

## 📞 Voice & Communication

| Agent | Primary Use Case | Use When | Don't Use When |
|-------|-----------------|----------|----------------|
| **`/voice-ai-integrator`** | Voice AI, ElevenLabs integration, speech processing | Voice synthesis, AI conversation logic | Text processing, non-voice features |
| **`/call-flow-orchestrator`** | Voice call lifecycle, appointment booking flows | Call management, booking systems | Simple voice features, static content |
| **`/phone-settings-specialist`** | Phone configuration, multi-tenant settings | Phone system setup, tenant-specific config | General settings, non-phone features |
| **`/realtime-coordinator`** | Real-time features, WebSocket functionality | Live updates, real-time data | Static data, batch processing |

---

## 💼 Business Logic & Testing

| Agent | Primary Use Case | Use When | Don't Use When |
|-------|-----------------|----------|----------------|
| **`/business-logic-coordinator`** | Complex business rules, workflow orchestration | Multi-step processes, business rules | Simple CRUD, UI logic |
| **`/test-quality-keeper`** | Testing strategies, comprehensive test coverage | Writing tests, QA processes | Quick debugging, development features |

---

## 🚨 Emergency Quick Picks

### **Critical Issues** (Use Immediately)
- **Build failing?** → `/typescript-enforcer`
- **Security breach?** → `/multi-tenant-boundary-enforcer` + `/auth-security-expert`
- **Performance crisis?** → `/performance-optimization`
- **Hydration errors?** → `/hydration-guardian`

### **New Feature Development**
- **API endpoint?** → `/api-route-builder`
- **Voice feature?** → `/voice-ai-integrator`
- **UI component?** → `/ui-component-architect`
- **Business workflow?** → `/business-logic-coordinator`

### **Production Readiness**
- **Security audit?** → `/compliance-auditor` + `/supabase-rls-security`
- **Deployment?** → `/deployment-devops`
- **Testing?** → `/test-quality-keeper`
- **Error handling?** → `/error-handling-strategist`

---

## 📊 Agent Complexity Ratings

### **Beginner Friendly** (Low complexity, clear patterns)
- `/typescript-enforcer` - Clear type fixes
- `/hydration-guardian` - Specific SSR issues
- `/phone-settings-specialist` - Focused on phone config

### **Intermediate** (Moderate complexity, some context needed)
- `/api-route-builder` - Standard API patterns
- `/ui-component-architect` - Component design
- `/voice-ai-integrator` - Voice integration
- `/realtime-coordinator` - Real-time features

### **Advanced** (High complexity, deep domain knowledge)
- `/multi-tenant-boundary-enforcer` - Complex security validation
- `/compliance-auditor` - Legal and regulatory requirements
- `/call-flow-orchestrator` - Complex state management
- `/business-logic-coordinator` - Multi-system orchestration

---

## ⚡ Speed Guidelines

### **Quick Tasks** (< 15 minutes)
- Type errors → `/typescript-enforcer`
- Simple API endpoint → `/api-route-builder`
- Basic UI component → `/ui-component-architect`

### **Medium Tasks** (15-60 minutes)
- Authentication flow → `/auth-security-expert`
- Voice integration → `/voice-ai-integrator`
- Database schema → `/database-schema-architect`

### **Complex Tasks** (1+ hours)
- Full compliance audit → `/compliance-auditor`
- Multi-tenant validation → `/multi-tenant-boundary-enforcer`
- Call flow orchestration → `/call-flow-orchestrator`

---

## 🎯 Output Format Expectations

### **Code Generation**
- `/api-route-builder` - Complete API endpoints with validation
- `/ui-component-architect` - Reusable React components
- `/typescript-enforcer` - Type definitions and fixes

### **Analysis & Documentation**
- `/compliance-auditor` - Compliance reports and checklists
- `/performance-optimization` - Performance analysis and recommendations
- `/database-schema-architect` - Schema designs and migration plans

### **Configuration & Setup**
- `/deployment-devops` - Deployment scripts and configurations
- `/supabase-rls-security` - RLS policies and security setup
- `/phone-settings-specialist` - Phone system configurations

---

**💡 Pro Tip**: When in doubt, start with the most specific agent for your domain (voice → `/voice-ai-integrator`, security → `/auth-security-expert`, etc.) and they'll often guide you to complementary agents if needed.