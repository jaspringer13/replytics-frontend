# Agent Decision Tree

**Smart Agent Selection** | Follow the flowchart to find the right agent quickly

---

## 🎯 Start Here: What's Your Goal?

```
📋 TASK TYPE
├── 🔧 Fix/Debug Issue
├── 🏗️ Build New Feature  
├── 🔍 Analyze/Research
├── 🚀 Deploy/Production
└── 📚 Learn/Document
```

---

## 🔧 Fix/Debug Issue Path

```
🔧 ISSUE TYPE
├── ❌ Build Errors
│   ├── TypeScript errors → /typescript-enforcer
│   ├── Hydration mismatches → /hydration-guardian  
│   └── Import/export issues → /typescript-enforcer
│
├── 🐛 Runtime Errors
│   ├── Authentication failures → /auth-security-expert
│   ├── Database/RLS errors → /supabase-rls-security
│   ├── Voice/call issues → /voice-ai-integrator
│   └── General error handling → /error-handling-strategist
│
├── 🐌 Performance Issues
│   ├── Slow page loads → /performance-optimization
│   ├── Memory leaks → /performance-optimization
│   └── Bundle size → /performance-optimization
│
├── 🔒 Security Issues
│   ├── Cross-tenant access → /multi-tenant-boundary-enforcer
│   ├── Auth vulnerabilities → /auth-security-expert
│   ├── Data compliance → /compliance-auditor
│   └── RLS policy failures → /supabase-rls-security
│
└── 🧪 Test Failures
    ├── Unit test issues → /test-quality-keeper
    ├── Integration failures → /test-quality-keeper
    └── E2E test problems → /test-quality-keeper
```

---

## 🏗️ Build New Feature Path

```
🏗️ FEATURE TYPE
├── 🌐 API/Backend
│   ├── New API endpoint → /api-route-builder
│   ├── Database changes → /database-schema-architect
│   ├── Business logic → /business-logic-coordinator
│   └── External integration → /webhook-integration-specialist
│
├── 🎨 Frontend/UI
│   ├── New component → /ui-component-architect
│   ├── Dashboard feature → /dashboard-analytics
│   └── User interface → /ui-component-architect
│
├── 📞 Voice/Communication
│   ├── Voice synthesis → /voice-ai-integrator
│   ├── Call handling → /call-flow-orchestrator
│   ├── Phone settings → /phone-settings-specialist
│   └── Real-time updates → /realtime-coordinator
│
├── 🔒 Security/Auth
│   ├── Login system → /auth-security-expert
│   ├── Permission system → /supabase-rls-security
│   ├── Multi-tenant isolation → /multi-tenant-boundary-enforcer
│   └── Compliance features → /compliance-auditor
│
└── 🧩 Complex Workflows
    ├── Multi-step processes → /business-logic-coordinator
    ├── State management → /call-flow-orchestrator
    └── Event orchestration → /realtime-coordinator
```

---

## 🔍 Analyze/Research Path

```
🔍 ANALYSIS TYPE
├── 🏛️ Architecture Review
│   ├── Database design → /database-schema-architect
│   ├── API structure → /api-route-builder
│   ├── Component architecture → /ui-component-architect
│   └── Overall system → /business-logic-coordinator
│
├── 🔒 Security Audit
│   ├── Tenant isolation → /multi-tenant-boundary-enforcer
│   ├── Auth security → /auth-security-expert
│   ├── Compliance check → /compliance-auditor
│   └── Database security → /supabase-rls-security
│
├── 📊 Performance Analysis
│   ├── Speed optimization → /performance-optimization
│   ├── Resource usage → /performance-optimization
│   └── Bottleneck identification → /performance-optimization
│
└── 📋 Code Quality Review
    ├── TypeScript standards → /typescript-enforcer
    ├── Error handling patterns → /error-handling-strategist
    ├── Test coverage → /test-quality-keeper
    └── Best practices → Multiple agents based on domain
```

---

## 🚀 Deploy/Production Path

```
🚀 DEPLOYMENT STAGE
├── 🔧 Pre-deployment
│   ├── Type checking → /typescript-enforcer
│   ├── Security audit → /multi-tenant-boundary-enforcer + /compliance-auditor
│   ├── Performance check → /performance-optimization
│   └── Test validation → /test-quality-keeper
│
├── 🚀 Deployment Setup
│   ├── CI/CD pipeline → /deployment-devops
│   ├── Infrastructure → /deployment-devops
│   └── Environment config → /deployment-devops
│
└── 🔍 Post-deployment
    ├── Monitoring setup → /performance-optimization
    ├── Error tracking → /error-handling-strategist
    └── Security validation → /auth-security-expert
```

---

## 🤔 Decision Matrix: Complexity vs. Urgency

```
HIGH URGENCY + HIGH COMPLEXITY
├── Production security breach → /multi-tenant-boundary-enforcer
├── Critical performance issue → /performance-optimization  
├── Major compliance violation → /compliance-auditor
└── System-wide authentication failure → /auth-security-expert

HIGH URGENCY + LOW COMPLEXITY  
├── Build failing → /typescript-enforcer
├── Simple API endpoint needed → /api-route-builder
├── Quick UI component → /ui-component-architect
└── Basic configuration → Domain-specific agent

LOW URGENCY + HIGH COMPLEXITY
├── Architecture redesign → /database-schema-architect
├── Complex business workflow → /business-logic-coordinator
├── Advanced voice features → /call-flow-orchestrator
└── Comprehensive testing strategy → /test-quality-keeper

LOW URGENCY + LOW COMPLEXITY
├── Code cleanup → /typescript-enforcer
├── Documentation → Domain-appropriate agent
├── Minor feature enhancement → Domain-specific agent
└── Learning/exploration → Multiple agents as needed
```

---

## 🔄 Multi-Agent Workflows

### **Common Agent Combinations**

```
🏗️ NEW FEATURE WORKFLOW
1. /business-logic-coordinator (define requirements)
2. /database-schema-architect (design data layer)
3. /api-route-builder (create endpoints)
4. /ui-component-architect (build interface)
5. /test-quality-keeper (add tests)

🔒 SECURITY AUDIT WORKFLOW  
1. /multi-tenant-boundary-enforcer (tenant isolation)
2. /auth-security-expert (authentication review)
3. /supabase-rls-security (database security)
4. /compliance-auditor (regulatory compliance)

📞 VOICE FEATURE WORKFLOW
1. /voice-ai-integrator (voice integration)
2. /call-flow-orchestrator (call management)
3. /phone-settings-specialist (configuration)
4. /realtime-coordinator (live updates)

🚀 PRODUCTION READINESS WORKFLOW
1. /typescript-enforcer (type safety)
2. /error-handling-strategist (error patterns)
3. /performance-optimization (optimization)
4. /test-quality-keeper (testing)
5. /deployment-devops (deployment)
```

---

## ⚡ Quick Decision Shortcuts

### **By Time Available**

```
⏰ 5 minutes
└── /typescript-enforcer (quick type fixes)

⏰ 15 minutes  
├── /api-route-builder (simple endpoint)
├── /ui-component-architect (basic component)
└── /phone-settings-specialist (config changes)

⏰ 1 hour
├── /voice-ai-integrator (voice feature)
├── /auth-security-expert (auth implementation)
└── /database-schema-architect (schema design)

⏰ Half day
├── /business-logic-coordinator (complex workflow)
├── /call-flow-orchestrator (call management)
└── /compliance-auditor (compliance audit)
```

### **By Output Needed**

```
📄 CODE
├── Complete implementation → Domain-specific builder agent
├── Code review/fixes → /typescript-enforcer or domain expert
└── Patterns/examples → Domain-specific architect agent

📊 ANALYSIS  
├── Security assessment → Security-focused agents
├── Performance report → /performance-optimization
└── Architecture review → Architect agents

📋 DOCUMENTATION
├── Setup guide → /deployment-devops
├── API docs → /api-route-builder  
└── Compliance report → /compliance-auditor

⚙️ CONFIGURATION
├── Database setup → /database-schema-architect
├── Auth config → /auth-security-expert
└── Voice setup → /voice-ai-integrator
```

---

## 🎯 Pro Tips for Agent Selection

### **Start Specific, Then Broaden**
1. **Identify the primary domain** (voice, auth, UI, etc.)
2. **Choose the most specific agent** for that domain
3. **Let the agent suggest** complementary agents if needed

### **When Multiple Agents Apply**
- **Primary issue domain** gets priority
- **Use workflows** for complex multi-domain tasks  
- **Sequential agents** for dependent tasks

### **Emergency Situations**
- **Production down?** → Start with most critical system agent
- **Security breach?** → `/multi-tenant-boundary-enforcer` first
- **Data loss risk?** → `/compliance-auditor` + domain agent

---

**🚀 Quick Start**: Not sure? Begin with `/typescript-enforcer` for any build issues, or jump to the most specific domain agent for your task!