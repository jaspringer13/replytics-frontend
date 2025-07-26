# Agent Usage Patterns

**Common Task Patterns** | Optimal agent mappings for recurring development scenarios

---

## 🔍 Search & Discovery Patterns

### **"Find implementation of X"**
```bash
# Pattern: Searching for specific code implementations
Task: "Find how user authentication is implemented"
Agent: /auth-security-expert
Why: Domain expertise to identify auth patterns and explain implementation

Task: "Find voice synthesis implementation"  
Agent: /voice-ai-integrator
Why: Specialized in voice processing and ElevenLabs integration

Task: "Find database schema for calls table"
Agent: /database-schema-architect  
Why: Database-focused analysis and schema understanding
```

### **"Search for security vulnerabilities"**
```bash
# Pattern: Security-focused code analysis
Task: "Find potential cross-tenant data leaks"
Agent: /multi-tenant-boundary-enforcer
Why: Specifically designed to detect tenant boundary violations

Task: "Search for authentication bypasses"
Agent: /auth-security-expert
Why: Deep knowledge of auth vulnerabilities and security patterns

Task: "Find compliance violations"
Agent: /compliance-auditor
Why: Regulatory expertise and violation detection
```

---

## 🏗️ Architecture Analysis Patterns

### **"Analyze codebase architecture"**
```bash
# Pattern: High-level architectural review
Task: "Analyze overall system architecture"
Agent: /business-logic-coordinator
Why: Orchestrates complex systems and understands inter-component relationships

Task: "Analyze database architecture"  
Agent: /database-schema-architect
Why: Specialized in database design patterns and optimization

Task: "Analyze API architecture"
Agent: /api-route-builder
Why: Understands API design patterns and endpoint relationships
```

### **"Review component design"**
```bash
# Pattern: Component-level architectural analysis
Task: "Review React component architecture"
Agent: /ui-component-architect
Why: Specialized in component design patterns and reusability

Task: "Review real-time system design"
Agent: /realtime-coordinator  
Why: Expert in WebSocket patterns and real-time architecture

Task: "Review voice call flow design"
Agent: /call-flow-orchestrator
Why: Understands complex state machines and call lifecycle management
```

---

## 🐛 Debugging Patterns

### **"Debug failing tests"**
```bash
# Pattern: Test failure investigation
Task: "Tests failing after TypeScript update"
Agent: /typescript-enforcer
Why: Type system expertise to resolve compilation issues

Task: "Integration tests failing randomly" 
Agent: /test-quality-keeper
Why: Testing expertise and flaky test identification

Task: "Authentication tests failing"
Agent: /auth-security-expert  
Why: Domain knowledge to debug auth-specific test issues
```

### **"Debug performance issues"**
```bash
# Pattern: Performance problem investigation  
Task: "Page loads slowly in production"
Agent: /performance-optimization
Why: Specialized in performance analysis and optimization

Task: "Database queries are slow"
Agent: /database-schema-architect
Why: Database optimization and query analysis expertise

Task: "Voice processing has high latency"
Agent: /voice-ai-integrator
Why: Voice-specific performance optimization knowledge
```

---

## 🚀 Feature Development Patterns

### **"Build authentication system"**
```bash
# Pattern: Complete auth feature development
Sequence:
1. /auth-security-expert (design auth flow)
2. /api-route-builder (create auth endpoints)  
3. /supabase-rls-security (setup database permissions)
4. /multi-tenant-boundary-enforcer (validate tenant isolation)
5. /test-quality-keeper (add comprehensive tests)

Why this sequence: Auth requires security expertise, API implementation, 
database security, tenant validation, and thorough testing.
```

### **"Build voice booking system"**
```bash
# Pattern: Complex voice feature development
Sequence:
1. /business-logic-coordinator (define booking workflow)
2. /call-flow-orchestrator (design call state machine)
3. /voice-ai-integrator (implement voice processing)
4. /database-schema-architect (design booking data schema)
5. /api-route-builder (create booking endpoints)
6. /realtime-coordinator (add live status updates)

Why this sequence: Voice booking requires business logic design, 
call management, voice processing, data storage, APIs, and real-time updates.
```

---

## 🔧 Maintenance Patterns

### **"Refactor legacy code"**
```bash
# Pattern: Code modernization and cleanup
Task: "Refactor old TypeScript code"
Agent: /typescript-enforcer
Why: Modern TypeScript patterns and strict typing enforcement

Task: "Refactor database queries"
Agent: /database-schema-architect  
Why: Optimized query patterns and schema improvements

Task: "Refactor UI components"  
Agent: /ui-component-architect
Why: Modern component patterns and reusability improvements
```

### **"Update dependencies"**
```bash
# Pattern: Dependency management and updates
Task: "Update Next.js and fix breaking changes"
Agent: /hydration-guardian
Why: SSR/hydration expertise for Next.js version changes

Task: "Update Supabase client and fix auth"
Agent: /auth-security-expert
Why: Authentication integration expertise  

Task: "Update voice processing libraries"
Agent: /voice-ai-integrator
Why: Voice processing library expertise and integration patterns
```

---

## 🔒 Security & Compliance Patterns

### **"Security audit workflow"**
```bash
# Pattern: Comprehensive security review
Sequential workflow:
1. /multi-tenant-boundary-enforcer (tenant isolation audit)
2. /auth-security-expert (authentication security review)  
3. /supabase-rls-security (database security audit)
4. /compliance-auditor (regulatory compliance check)
5. /api-route-builder (API security validation)

Why this sequence: Systematic security review covering all layers 
from tenant isolation to regulatory compliance.
```

### **"Compliance preparation"**
```bash
# Pattern: Regulatory compliance preparation
Task: "Prepare for GDPR audit"
Agent: /compliance-auditor
Why: GDPR expertise and compliance documentation

Task: "Implement data retention policies"
Sequential:
1. /compliance-auditor (define retention requirements)
2. /database-schema-architect (implement retention logic)
3. /business-logic-coordinator (create retention workflows)

Why this sequence: Compliance requirements drive database design 
and business process implementation.
```

---

## 🚀 Deployment Patterns

### **"Production deployment workflow"**
```bash
# Pattern: Safe production deployment
Pre-deployment sequence:
1. /typescript-enforcer (ensure type safety)
2. /test-quality-keeper (validate test coverage)
3. /performance-optimization (performance audit)  
4. /multi-tenant-boundary-enforcer (security validation)
5. /deployment-devops (deployment execution)

Why this sequence: Ensures code quality, testing, performance, 
security, and proper deployment procedures.
```

### **"Rollback and recovery"**
```bash
# Pattern: Production issue recovery
Emergency sequence:
1. /deployment-devops (immediate rollback)
2. /error-handling-strategist (analyze failure patterns)
3. Domain-specific agent (fix root cause)
4. /test-quality-keeper (prevent regression)

Why this sequence: Immediate stability, failure analysis, 
targeted fixes, and prevention measures.
```

---

## 📊 Monitoring & Analytics Patterns

### **"Performance monitoring setup"**
```bash
# Pattern: Comprehensive performance monitoring
Task: "Set up performance dashboards"
Sequential:
1. /performance-optimization (identify key metrics)
2. /dashboard-analytics (design monitoring dashboards)
3. /realtime-coordinator (implement live metrics)
4. /api-route-builder (create metrics endpoints)

Why this sequence: Performance expertise guides metric selection, 
dashboard design presents data, real-time updates provide immediacy.
```

### **"Business analytics implementation"**
```bash
# Pattern: Business intelligence and reporting
Task: "Build call analytics dashboard"
Sequential:
1. /business-logic-coordinator (define business metrics)
2. /call-flow-orchestrator (identify call data points)
3. /database-schema-architect (optimize analytics queries)
4. /dashboard-analytics (create visualization)

Why this sequence: Business requirements drive data collection, 
call expertise identifies metrics, database optimization enables performance.
```

---

## 🧪 Testing Patterns

### **"Comprehensive test strategy"**
```bash
# Pattern: Full testing implementation
Task: "Add tests to existing feature"
Sequential:
1. /test-quality-keeper (design test strategy)
2. Domain-specific agent (implement domain tests)
3. /typescript-enforcer (ensure type safety in tests)
4. /test-quality-keeper (validate coverage and quality)

Why this sequence: Testing strategy guides implementation, 
domain expertise ensures accurate tests, type safety prevents errors.
```

### **"E2E testing for voice features"**
```bash
# Pattern: Complex feature testing
Task: "Test voice booking flow end-to-end"
Sequential:
1. /call-flow-orchestrator (map call states to test)
2. /voice-ai-integrator (mock voice processing)
3. /test-quality-keeper (implement E2E tests)
4. /business-logic-coordinator (validate business rules)

Why this sequence: Call flow expertise guides test scenarios, 
voice integration provides mocking strategy, testing implements execution.
```

---

## 🔄 Integration Patterns

### **"Third-party service integration"**
```bash
# Pattern: External service integration
Task: "Integrate new calendar service"
Sequential:
1. /webhook-integration-specialist (design integration architecture)
2. /api-route-builder (create integration endpoints)
3. /business-logic-coordinator (integrate with booking workflow)
4. /error-handling-strategist (handle integration failures)

Why this sequence: Integration expertise guides architecture, 
API knowledge implements endpoints, business logic connects workflows.
```

### **"Database migration with new features"**
```bash
# Pattern: Data migration and feature addition
Task: "Add new fields and migrate existing data"
Sequential:
1. /database-schema-architect (design migration strategy)
2. /compliance-auditor (ensure data handling compliance)
3. /multi-tenant-boundary-enforcer (validate tenant isolation)
4. /test-quality-keeper (test migration thoroughly)

Why this sequence: Database expertise guides migration, 
compliance ensures legal requirements, security validates isolation.
```

---

## 🎯 Decision Making Patterns

### **"Technology choice evaluation"**
```bash
# Pattern: Technical decision making
Task: "Choose between different voice processing libraries"
Agent: /voice-ai-integrator
Why: Domain expertise to evaluate voice-specific trade-offs

Task: "Choose database optimization approach"
Agent: /database-schema-architect
Why: Database expertise to evaluate performance vs. complexity

Task: "Choose authentication strategy"
Agent: /auth-security-expert  
Why: Security expertise to evaluate auth patterns and risks
```

### **"Architecture decision records"**
```bash
# Pattern: Documenting architectural decisions
Task: "Document API design decisions"
Agent: /api-route-builder
Why: API expertise to explain design rationale and trade-offs

Task: "Document security architecture decisions"
Sequential:
1. /auth-security-expert (auth decisions)
2. /multi-tenant-boundary-enforcer (isolation decisions)
3. /compliance-auditor (compliance decisions)

Why this sequence: Each agent documents their domain expertise
for comprehensive architectural decision records.
```

---

## 🚨 Anti-Patterns (What NOT to Do)

### **Don't Use Generic Agents for Specific Domains**
```bash
❌ Wrong: Use /typescript-enforcer for voice processing issues
✅ Right: Use /voice-ai-integrator for voice-specific problems

❌ Wrong: Use /api-route-builder for UI component issues  
✅ Right: Use /ui-component-architect for component problems
```

### **Don't Skip Security Validation**
```bash
❌ Wrong: Deploy without security review
✅ Right: Always include security agents in deployment workflow

❌ Wrong: Add features without tenant boundary validation
✅ Right: Include /multi-tenant-boundary-enforcer for multi-tenant features
```

### **Don't Use Multiple Agents Simultaneously for Same Task**
```bash
❌ Wrong: Ask both /auth-security-expert and /api-route-builder about auth
✅ Right: Start with /auth-security-expert, then /api-route-builder for implementation

❌ Wrong: Use multiple agents without clear sequence
✅ Right: Define clear workflow with agent dependencies
```

---

**💡 Pattern Recognition Tip**: The more specific your task domain, the more specific your agent should be. Start specific, then broaden as needed.