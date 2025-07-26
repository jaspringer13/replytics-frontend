# Context-Aware Agent Selection

**Smart Agent Selection** | Automatic agent recommendations based on context clues

---

## 🎯 Context Detection Framework

### **File-Based Context Detection**
The agent selection system can analyze your current context to suggest optimal agents:

```bash
# Current File Context → Suggested Agent
/app/api/auth/[...nextauth]/route.ts → /auth-security-expert
/lib/voice-synthesis.ts → /voice-ai-integrator  
/components/ui/Button.tsx → /ui-component-architect
/lib/supabase-server.ts → /supabase-rls-security
/agents/any-agent.md → Domain-specific agent for that area
```

### **Error Message Context Detection**
```bash
# Error Pattern → Recommended Agent
"Property 'phoneId' does not exist on type" → /typescript-enforcer
"Hydration failed because the initial UI" → /hydration-guardian
"Authentication failed: Invalid session" → /auth-security-expert
"RLS policy violation" → /supabase-rls-security
"Cross-tenant access detected" → /multi-tenant-boundary-enforcer
```

### **Git Context Detection**
```bash
# Recent Commits/Branches → Suggested Agent
feature/voice-booking → /call-flow-orchestrator
fix/auth-session → /auth-security-expert  
performance/database → /database-schema-architect
security/tenant-isolation → /multi-tenant-boundary-enforcer
deploy/production → /deployment-devops
```

---

## 🧠 Intelligent Agent Recommendation Engine

### **Multi-Factor Context Analysis**

```typescript
interface ContextAnalysis {
  primaryDomain: string        // voice, auth, ui, database, etc.
  taskType: string            // build, debug, analyze, deploy
  urgency: 'low' | 'medium' | 'high' | 'critical'
  complexity: 'simple' | 'moderate' | 'complex'
  confidenceScore: number     // 0-100
  recommendedAgents: Agent[]  // Ordered by relevance
  reasoning: string[]         // Why these agents were chosen
}

// Example context analysis
const contextAnalysis = {
  primaryDomain: "voice",
  taskType: "debug", 
  urgency: "high",
  complexity: "moderate",
  confidenceScore: 85,
  recommendedAgents: [
    "/voice-ai-integrator",     // Primary domain match
    "/call-flow-orchestrator",  // Related voice domain  
    "/error-handling-strategist" // Debug task type
  ],
  reasoning: [
    "Voice domain detected from file path and error message",
    "Debug task type from 'failing' keyword",
    "High urgency from 'production' context"
  ]
}
```

### **Context Clue Priority Matrix**

```bash
HIGH PRIORITY CONTEXT CLUES (90-100% confidence)
├── File path contains domain keywords
├── Error messages contain specific patterns
├── Explicit domain mention in task description  
└── Current branch name indicates domain

MEDIUM PRIORITY CONTEXT CLUES (60-89% confidence)
├── Recent git activity in domain files
├── Related files in working directory
├── Time-based patterns (deployment day = devops)
└── Team member assignments

LOW PRIORITY CONTEXT CLUES (30-59% confidence)  
├── General keywords in task description
├── Project documentation references
├── Historical usage patterns
└── Seasonal patterns (end of month = compliance)
```

---

## 🔍 Context Detection Rules

### **Domain-Specific Keywords**

```yaml
Voice & Communication:
  keywords: [voice, call, phone, audio, speech, synthesis, elevenlabs]
  file_patterns: [voice*, call*, phone*, audio*]
  agents: [/voice-ai-integrator, /call-flow-orchestrator, /phone-settings-specialist]

Authentication & Security:
  keywords: [auth, login, session, token, security, permission]
  file_patterns: [auth*, session*, security*]
  agents: [/auth-security-expert, /multi-tenant-boundary-enforcer]

Database & Storage:
  keywords: [database, query, schema, migration, supabase, sql]
  file_patterns: [*schema*, *migration*, *db*]
  agents: [/database-schema-architect, /supabase-rls-security]

UI & Frontend:
  keywords: [component, ui, interface, design, react, frontend]
  file_patterns: [components/*, ui/*, *component*]
  agents: [/ui-component-architect, /dashboard-analytics]

API & Backend:
  keywords: [api, endpoint, route, server, backend]
  file_patterns: [api/*, route.ts, *handler*]
  agents: [/api-route-builder, /webhook-integration-specialist]
```

### **Task Type Keywords**

```yaml
Build/Create:
  keywords: [build, create, add, implement, develop, new]
  suggested_approach: "Start with domain architect agent"

Debug/Fix:  
  keywords: [debug, fix, error, issue, problem, failing, broken]
  suggested_approach: "Start with domain expert agent"

Analyze/Review:
  keywords: [analyze, review, audit, assess, evaluate, examine]
  suggested_approach: "Use analysis-focused agents"

Deploy/Production:
  keywords: [deploy, production, release, publish, launch]
  suggested_approach: "Use deployment and validation agents"

Test/Quality:
  keywords: [test, testing, quality, coverage, validation]
  suggested_approach: "Start with /test-quality-keeper"
```

---

## 🎯 Smart Agent Selection Algorithms

### **Algorithm 1: Context Score Calculation**

```typescript
function calculateAgentScore(agent: Agent, context: Context): number {
  let score = 0;
  
  // Domain matching (highest weight)
  if (context.primaryDomain === agent.domain) score += 40;
  if (context.secondaryDomains.includes(agent.domain)) score += 20;
  
  // Task type matching  
  if (context.taskType in agent.supportedTasks) score += 30;
  
  // Urgency/complexity alignment
  if (agent.complexity === context.complexity) score += 15;
  if (agent.urgencyHandling.includes(context.urgency)) score += 10;
  
  // Historical success rate
  score += agent.historicalSuccess * 0.05;
  
  return Math.min(score, 100);
}
```

### **Algorithm 2: Multi-Agent Workflow Detection**

```typescript
function detectWorkflowPattern(context: Context): AgentWorkflow | null {
  const patterns = [
    {
      name: "New Feature Development",
      triggers: ["build", "create", "implement"],
      domains: ["api", "ui", "database"],
      workflow: [
        "/business-logic-coordinator",
        "domain-specific-architect", 
        "/api-route-builder",
        "/test-quality-keeper"
      ]
    },
    {
      name: "Security Audit",
      triggers: ["security", "audit", "vulnerability"],
      domains: ["auth", "database", "api"],
      workflow: [
        "/multi-tenant-boundary-enforcer",
        "/auth-security-expert",
        "/supabase-rls-security",
        "/compliance-auditor"
      ]
    },
    {
      name: "Production Deployment", 
      triggers: ["deploy", "production", "release"],
      domains: ["any"],
      workflow: [
        "/typescript-enforcer",
        "/test-quality-keeper", 
        "/performance-optimization",
        "/deployment-devops"
      ]
    }
  ];
  
  return patterns.find(pattern => 
    pattern.triggers.some(trigger => context.description.includes(trigger)) &&
    (pattern.domains.includes("any") || pattern.domains.includes(context.primaryDomain))
  );
}
```

---

## 📊 Context-Aware Recommendations

### **Scenario-Based Agent Selection**

```bash
SCENARIO: "Voice booking system is slow in production"
Context Detection:
├── Domain: voice (from "voice booking")
├── Task: performance issue (from "slow")  
├── Environment: production (from "production")
├── Urgency: high (production issue)
└── Complexity: moderate (single system)

Recommended Agent Sequence:
1. /voice-ai-integrator (primary domain expert)
2. /performance-optimization (performance issue)
3. /call-flow-orchestrator (booking system expertise)
4. /database-schema-architect (if database bottleneck)

Confidence: 95% (clear domain and task type)
```

```bash
SCENARIO: "Users getting cross-tenant data in dashboard"  
Context Detection:
├── Domain: security (from "cross-tenant")
├── Task: critical bug (from data leakage implication)
├── Component: dashboard (from "dashboard")
├── Urgency: critical (security issue)
└── Complexity: high (multi-tenant architecture)

Recommended Agent Sequence:
1. /multi-tenant-boundary-enforcer (immediate security response)
2. /dashboard-analytics (dashboard-specific expertise)
3. /supabase-rls-security (database security validation)
4. /compliance-auditor (regulatory implications)

Confidence: 98% (critical security pattern detected)
```

---

## 🔄 Dynamic Context Adaptation

### **Learning from Interaction Patterns**

```typescript
interface ContextLearning {
  userPatterns: {
    frequentDomains: string[];        // voice, auth, ui, etc.
    preferredAgents: Agent[];         // historically successful
    taskComplexity: 'simple' | 'complex'; // user's typical tasks
    workingHours: TimeRange;          // when user is most active
  };
  
  projectPatterns: {
    recentFocus: string[];            // recent commit domains  
    criticalPaths: string[];          // frequently modified files
    teamSpecialization: Agent[];     // team's expert agents
    deploymentCadence: string;        // daily, weekly, monthly
  };
  
  temporalPatterns: {
    morningTasks: string[];           // typical morning activities
    deploymentDays: number[];         // which days are deployments
    crunchTimes: DateRange[];         // high-activity periods
    maintenanceWindows: TimeRange[];  // scheduled maintenance
  };
}
```

### **Contextual Agent Modifiers**

```bash
BASE RECOMMENDATION + CONTEXT MODIFIER = FINAL RECOMMENDATION

Example 1:
Base: /voice-ai-integrator (for voice task)
+ Time Modifier: "Friday afternoon" = + /deployment-devops (pre-weekend check)
+ Team Modifier: "Junior developer" = + /typescript-enforcer (additional safety)
= [/voice-ai-integrator, /typescript-enforcer, /deployment-devops]

Example 2:  
Base: /api-route-builder (for API task)
+ Urgency Modifier: "Production down" = + /error-handling-strategist (first)
+ Domain Modifier: "Multi-tenant" = + /multi-tenant-boundary-enforcer  
= [/error-handling-strategist, /api-route-builder, /multi-tenant-boundary-enforcer]
```

---

## 🎯 Implementation Strategy

### **Context Detection Pipeline**

```bash
1. PASSIVE CONTEXT COLLECTION
   ├── Current file/directory analysis
   ├── Recent git activity parsing  
   ├── Error message pattern matching
   └── Time/date context capture

2. ACTIVE CONTEXT ENRICHMENT
   ├── Task description NLP analysis
   ├── Domain keyword extraction
   ├── Urgency/complexity assessment  
   └── User preference integration

3. AGENT SCORING & RANKING
   ├── Calculate agent relevance scores
   ├── Apply context modifiers
   ├── Consider historical success rates
   └── Rank by overall fit

4. RECOMMENDATION GENERATION
   ├── Primary agent selection
   ├── Complementary agent suggestions
   ├── Workflow pattern detection
   └── Confidence score calculation
```

### **Integration Points**

```bash
CLAUDE.md INTEGRATION
└── Add context-aware agent suggestions to main guide

AGENT FILES INTEGRATION  
└── Each agent specifies its optimal context triggers

DECISION TREE INTEGRATION
└── Context-aware branching in decision tree

USAGE PATTERNS INTEGRATION
└── Context-driven pattern matching
```

---

## 🔮 Advanced Context Features

### **Predictive Agent Suggestions**

```typescript
// Predict next likely agent based on current context
function predictNextAgent(currentAgent: Agent, context: Context): Agent[] {
  const transitions = {
    "/typescript-enforcer": ["/test-quality-keeper", "/deployment-devops"],
    "/auth-security-expert": ["/supabase-rls-security", "/multi-tenant-boundary-enforcer"],
    "/voice-ai-integrator": ["/call-flow-orchestrator", "/realtime-coordinator"],
    "/api-route-builder": ["/test-quality-keeper", "/database-schema-architect"]
  };
  
  return transitions[currentAgent.name] || [];
}
```

### **Context Confidence Calibration**

```bash
CONFIDENCE LEVELS & ACTIONS

90-100%: Auto-recommend primary agent
├── Clear domain match + task type match
├── Explicit keywords present  
└── Historical pattern confirmation

70-89%: Suggest with explanation
├── Good domain match, unclear task type
├── Multiple possible interpretations
└── Need user confirmation

50-69%: Offer multiple options  
├── Ambiguous context clues
├── Multiple equally valid agents
└── Let user choose with guidance

Below 50%: Use decision tree
├── Insufficient context detected
├── Conflicting signals present
└── Guide user through decision process
```

---

## 🚀 Quick Context Commands

### **Context-Aware Shortcuts**

```bash
# Smart shortcuts based on current context
/smart-fix     → Auto-detect issue type and recommend agent
/smart-build   → Detect feature type and recommend build sequence  
/smart-deploy  → Analyze readiness and recommend deployment workflow
/smart-debug   → Analyze error patterns and recommend debug agent
/smart-audit   → Detect audit type and recommend security workflow
```

### **Context Override Commands**

```bash
# Override context detection when needed
/force-domain voice     → Force voice domain agents
/force-urgency critical → Force high-urgency agent selection
/force-complexity simple → Force simple-task agents
/ignore-context         → Skip context detection, use manual selection
```

---

**🎯 Context-Aware Philosophy**: The system learns your patterns, understands your project context, and evolves its recommendations to match your specific development workflow and team needs.