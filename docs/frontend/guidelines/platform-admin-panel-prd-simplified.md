# Product Requirements Document: Minery Guard Platform Admin Panel (Simplified)

## Executive Summary

A minimal admin panel for Minery Guard platform operators to monitor platform usage and manage contact messages from potential clients.

## 1. Problem Statement

**Core Problem**: No way to see who is contacting us for services or monitor basic platform usage.

**Business Impact**: 
- Missing sales opportunities from contact forms
- No visibility into platform growth
- Cannot identify active vs inactive organizations

## 2. Objectives

**Single Goal**: Provide platform visibility and manage sales leads efficiently.

**Success Criteria**: 
- See all contact messages in one place
- Know how many organizations and users we have
- Identify which organizations are active

## 3. User Persona

**Platform Administrator** (Single admin user)
- Needs to see contact messages daily
- Wants to know platform usage numbers
- Must be able to find specific organizations/users when needed

## 4. Functional Requirements (MVP Only)

### 4.1 User-Facing Service Requests (NEW)
- **FR-1**: Add "Request Service" button to each service card on /organizations/[slug]/services
- **FR-2**: Display service request modal/form with fields:
  - Service name (pre-filled, read-only)
  - Contact name (pre-filled from user profile)
  - Contact email (pre-filled from user profile)
  - Contact phone (optional)
  - Message/requirements (optional text area)
- **FR-3**: Submit button creates service request and sends email
- **FR-4**: Show success confirmation after submission
- **FR-5**: Track which service was requested (serviceType)

### 4.2 Authentication (Admin)
- **FR-12**: Admin access via `isPlatformAdmin` boolean flag on user
- **FR-13**: Redirect non-admins to regular dashboard

### 4.3 Admin Dashboard
- **FR-14**: Display simple metrics:
  - Total organizations
  - Total users  
  - Unread contact messages count
  - Pending service requests count

### 4.4 Contact Messages
- **FR-15**: List all contact messages (newest first)
- **FR-16**: Show: From, Email, Organization, Subject, Date, Status (read/unread)
- **FR-17**: Click to view full message
- **FR-18**: Mark as read/unread
- **FR-19**: Filter by read/unread status

### 4.5 Service Requests (Admin View)
- **FR-20**: List all service requests (newest first)
- **FR-21**: Show: Service, Organization, Contact, Date, Status
- **FR-22**: View request details
- **FR-23**: Update status (pending → contacted → completed)
- **FR-24**: WhatsApp integration:
  - Direct WhatsApp link with pre-filled message
  - Phone number display

### 4.6 Lead Qualification & Onboarding
- **FR-25**: Integrate lead qualification into sign-up onboarding flow (/onboarding):
  - One question at a time presentation
  - Progress indicator
  - Auto-save after each question
  - JSON-based questionnaire configuration
  - Smooth transition from sign-up to qualification
- **FR-26**: Admin questionnaire management:
  - Edit questionnaire from JSON configuration
  - Add/remove/reorder questions
  - Update scoring weights
  - Preview questionnaire flow
- **FR-27**: Lead scoring dashboard:
  - Automatic lead classification (A1-Hot, B1-Warm, C1-Cold, D1-Info)
  - Score breakdown by component (Urgency, Budget, Product Fit, Engagement, Decision)
  - Response time recommendations based on score
- **FR-28**: Lead analytics:
  - Form completion rate
  - Average completion time
  - Abandonment points
  - Question-level metrics (time spent, changes made)
  - Device and session analytics

### 4.7 Organizations List
- **FR-28**: List all organizations
- **FR-29**: Show: Name, Created date, User count, Last activity
- **FR-30**: Search by name
- **FR-31**: Sort by created date or last activity

### 4.8 Users List
- **FR-32**: List all users
- **FR-33**: Show: Name, Email, Organization, Last login
- **FR-34**: Search by name or email
- **FR-35**: Filter by organization

## 5. Non-Functional Requirements

### Essential Only
- **NFR-1**: Pages load in < 3 seconds
- **NFR-2**: Mobile responsive (tablet minimum)
- **NFR-3**: Consistent with existing UI (Achromatic)
- **NFR-4**: Secure - admin only access

## 6. Technical Implementation

### Technology Foundation
**Built on Achromatic Starter Kit** - All features will be implemented using the existing Achromatic codebase and patterns:
- **UI Components**: Shadcn/ui components from Achromatic
- **Authentication**: Existing auth system from @workspace/auth
- **Database**: Current PostgreSQL with Drizzle ORM setup
- **Styling**: Tailwind CSS with Achromatic design tokens
- **Forms**: Existing form patterns with react-hook-form and zod
- **Data Fetching**: Current server actions pattern
- **Layouts**: Reuse existing Page, PageBody, PageHeader components
- **Navigation**: Extend current sidebar and navigation patterns

**Page Structure Consistency** - All admin pages will follow the exact same structure as existing organization pages:
- Same `Page > PageHeader > PageBody` hierarchy
- Same Card-based layouts with `mx-auto max-w-7xl space-y-6 p-6` container
- Same grid patterns (`grid gap-6 lg:grid-cols-3`)
- Same component composition patterns
- Detailed page structure guidelines in `docs/admin-panel-page-structure.md`

**Sidebar Navigation** - Admin sidebar will replicate the organization sidebar pattern:
- Same collapsible icon-based sidebar
- Same active state highlighting
- Same user menu in footer
- Admin-specific navigation items
- Boilerplate code in `docs/admin-sidebar-boilerplate.md`

**No new dependencies or frameworks** - Everything builds on top of the existing platform infrastructure documented in docs_achromatic.

### URL Structure
```
# User-facing routes
/onboarding                                     # Lead qualification during sign-up
/organizations/[slug]/services                  # Services catalog
/organizations/[slug]/services/requests         # My service requests
/organizations/[slug]/services/requests/[id]    # Request detail

# Admin routes
/admin                  # Dashboard
/admin/inbox           # Combined messages & service requests
/admin/messages        # Contact messages only
/admin/messages/[id]   # Message detail
/admin/services        # Service requests only
/admin/services/[id]   # Service request detail
/admin/leads           # Lead management & scoring
/admin/leads/[id]      # Lead detail with full responses
/admin/analytics/leads # Lead conversion analytics
/admin/organizations   # Organizations list
/admin/users          # Users list
```

### Database Changes
```sql
-- Add to existing user table
ALTER TABLE user ADD COLUMN isPlatformAdmin BOOLEAN DEFAULT FALSE;

-- New service requests table (ULTRA SIMPLE)
CREATE TABLE serviceRequest (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organization(id),
  userId UUID REFERENCES user(id),
  serviceType VARCHAR(50),
  serviceName VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending/contacted/completed
  message TEXT,  -- Initial request message
  adminNotes TEXT,  -- Simple admin notes
  contactName VARCHAR(255),
  contactEmail VARCHAR(255),
  contactPhone VARCHAR(50),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Questionnaire configuration table
CREATE TABLE questionnaireConfig (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER DEFAULT 1,
  isActive BOOLEAN DEFAULT true,
  config JSONB NOT NULL, -- Stores the complete questionnaire structure
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Lead qualification responses table
CREATE TABLE leadQualification (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organization(id),
  userId UUID REFERENCES user(id),
  
  -- Required questions
  mainConcern VARCHAR(100), -- security_level/vulnerabilities/no_team/incident_response
  complianceRequirements TEXT[], -- Array of selected requirements
  complianceOther TEXT, -- Free text for other requirements
  itTeamSize VARCHAR(50), -- dedicated/small/external/none
  companySize VARCHAR(50), -- 1-10/11-50/51-200/200+
  recentIncidents VARCHAR(50), -- urgent/resolved/preventive/unsure
  
  -- Optional questions (stored as JSONB for flexibility)
  optionalResponses JSONB,
  
  -- Open text question
  specificNeeds TEXT,
  
  -- Scoring and classification
  leadScore INTEGER, -- 0-100
  leadClassification VARCHAR(10), -- A1/B1/C1/D1
  scoreComponents JSONB, -- {urgency: 35, budget: 25, fit: 20, engagement: 10, decision: 10}
  
  -- Interaction metrics
  completionTime INTEGER, -- seconds
  questionsAnswered INTEGER,
  optionalAnswered INTEGER,
  deviceType VARCHAR(20), -- mobile/desktop
  abandonmentPoint VARCHAR(50), -- question ID if abandoned
  timePerQuestion JSONB, -- {q1: 15, q2: 20, ...}
  
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Lead analytics events table
CREATE TABLE leadAnalyticsEvent (
  id UUID PRIMARY KEY,
  leadQualificationId UUID REFERENCES leadQualification(id),
  eventType VARCHAR(50), -- question_answered/question_changed/tooltip_clicked/form_abandoned
  questionId VARCHAR(50),
  previousValue TEXT,
  newValue TEXT,
  timeSpent INTEGER, -- milliseconds
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Required Queries
```typescript
// 1. Dashboard metrics (WITH BUSINESS METRICS)
const getMetrics = async () => {
  const orgs = await db.select().from(organizationTable);
  const users = await db.select().from(userTable);
  const unread = await db.select().from(contactMessageTable)
    .where(eq(status, 'unread'));
  
  // Business metrics
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  const monthlyRevenue = await db.select({ 
    sum: sum(actualValue) 
  }).from(serviceRequestTable)
    .where(and(
      eq(status, 'won'),
      gte(wonDate, thisMonth)
    ));
  
  const pipelineValue = await db.select({ 
    sum: sum(estimatedValue) 
  }).from(serviceRequestTable)
    .where(in(status, ['qualified', 'proposal']));
  
  const conversionRate = await calculateConversionRate();
  const avgDealSize = await calculateAvgDealSize();
  
  return { 
    orgs: orgs.length, 
    users: users.length, 
    unread: unread.length,
    monthlyRevenue: monthlyRevenue[0].sum || 0,
    pipelineValue: pipelineValue[0].sum || 0,
    conversionRate,
    avgDealSize
  };
}

// 2. Contact messages
const getMessages = async () => {
  return await db.select().from(contactMessageTable)
    .orderBy(desc(createdAt));
}

// 3. Service requests (NEW)
const getServiceRequests = async () => {
  return await db.select().from(serviceRequestTable)
    .leftJoin(organizationTable, eq(serviceRequestTable.organizationId, organizationTable.id))
    .orderBy(desc(createdAt));
}

// 4. Create service request (NEW)
const createServiceRequest = async (data) => {
  const [request] = await db.insert(serviceRequestTable).values(data).returning();
  // Send email notification
  await sendServiceRequestEmail(request);
  return request;
}

// 5. Update service request with business metrics (NEW)
const updateServiceRequest = async (id: string, data: {
  status?: string,
  estimatedValue?: number,
  actualValue?: number,
  conversionStage?: string,
  lostReason?: string,
  adminNotes?: string,
  nextFollowUp?: Date
}) => {
  const updates = { ...data, updatedAt: new Date() };
  
  // If marking as won, set wonDate
  if (data.status === 'won') {
    updates.wonDate = new Date();
    updates.conversionStage = 'customer';
  }
  
  // Send email notification for status changes
  if (data.status) {
    await sendStatusChangeEmail(id, data.status);
  }
  
  return await db.update(serviceRequestTable)
    .set(updates)
    .where(eq(id, requestId));
}

// 6. Get conversion funnel analytics (NEW)
const getConversionFunnel = async () => {
  const stages = ['lead', 'qualified', 'opportunity', 'customer'];
  const funnel = {};
  
  for (const stage of stages) {
    const count = await db.select({ count: count() })
      .from(serviceRequestTable)
      .where(eq(conversionStage, stage));
    funnel[stage] = count[0].count;
  }
  
  return funnel;
}

// 7. Get revenue analytics (NEW)
const getRevenueAnalytics = async (dateRange: { start: Date, end: Date }) => {
  return await db.select({
    serviceType: serviceRequestTable.serviceType,
    totalRevenue: sum(serviceRequestTable.actualValue),
    dealCount: count(),
    avgDealSize: avg(serviceRequestTable.actualValue)
  })
  .from(serviceRequestTable)
  .where(and(
    eq(status, 'won'),
    between(wonDate, dateRange.start, dateRange.end)
  ))
  .groupBy(serviceRequestTable.serviceType);
}

// 8. Lead qualification scoring (NEW)
const calculateLeadScore = (responses: LeadQualificationData) => {
  let score = 0;
  const components = {
    urgency: 0,
    budget: 0,
    fit: 0,
    engagement: 0,
    decision: 0
  };
  
  // Urgency scoring (35%)
  if (responses.recentIncidents === 'urgent') components.urgency = 35;
  else if (responses.recentIncidents === 'resolved') components.urgency = 20;
  else if (responses.recentIncidents === 'preventive') components.urgency = 10;
  
  // Budget scoring based on company size (25%)
  const sizeScores = { '200+': 25, '51-200': 20, '11-50': 15, '1-10': 10 };
  components.budget = sizeScores[responses.companySize] || 5;
  
  // Product fit (20%)
  if (responses.mainConcern) components.fit = 20;
  
  // Engagement (10%)
  components.engagement = Math.min(10, responses.optionalAnswered);
  
  // Decision capability (10%)
  if (responses.optionalResponses?.role?.includes('CEO') || 
      responses.optionalResponses?.role?.includes('CTO')) {
    components.decision = 10;
  }
  
  score = Object.values(components).reduce((sum, val) => sum + val, 0);
  
  // Classify lead
  let classification = 'D1';
  if (score >= 85) classification = 'A1';
  else if (score >= 60) classification = 'B1';
  else if (score >= 30) classification = 'C1';
  
  return { score, classification, components };
};

// 9. Get lead analytics (NEW)
const getLeadAnalytics = async (dateRange?: { start: Date, end: Date }) => {
  const leads = await db.select().from(leadQualificationTable)
    .where(dateRange ? between(createdAt, dateRange.start, dateRange.end) : undefined);
  
  const analytics = {
    totalLeads: leads.length,
    completionRate: leads.filter(l => !l.abandonmentPoint).length / leads.length,
    avgCompletionTime: avg(leads.map(l => l.completionTime)),
    leadsByClassification: {
      A1: leads.filter(l => l.leadClassification === 'A1').length,
      B1: leads.filter(l => l.leadClassification === 'B1').length,
      C1: leads.filter(l => l.leadClassification === 'C1').length,
      D1: leads.filter(l => l.leadClassification === 'D1').length
    },
    abandonmentByQuestion: {},
    avgTimePerQuestion: {},
    deviceBreakdown: {
      mobile: leads.filter(l => l.deviceType === 'mobile').length,
      desktop: leads.filter(l => l.deviceType === 'desktop').length
    }
  };
  
  return analytics;
};

// 10. Get customer success metrics (NEW)
const getCustomerMetrics = async () => {
  const avgTimeToClose = await db.select({
    avg: avg(
      sql`EXTRACT(EPOCH FROM (wonDate - createdAt))/86400`
    )
  }).from(serviceRequestTable)
    .where(eq(status, 'won'));
  
  const lostReasons = await db.select({
    reason: lostReason,
    count: count()
  }).from(serviceRequestTable)
    .where(eq(status, 'lost'))
    .groupBy(lostReason);
  
  return { avgTimeToClose, lostReasons };
}
```

## 7. Implementation Plan

**All implementation follows Achromatic patterns** - Use existing code examples from the platform for consistency.

### Lead Qualification Questionnaire JSON Structure

**Default Questionnaire Configuration**
```typescript
// data/default-questionnaire.ts
export const defaultQuestionnaire = {
  version: 1,
  questions: [
    // Required Questions
    {
      id: "main_concern",
      type: "single_choice",
      required: true,
      question: "¿Cuál es tu principal preocupación en ciberseguridad?",
      options: [
        { value: "security_level", label: "No sé mi nivel actual de seguridad", service: "maturity_analysis" },
        { value: "vulnerabilities", label: "Quiero verificar vulnerabilidades", service: "pentest" },
        { value: "no_team", label: "No tengo equipo de seguridad", service: "virtual_ciso" },
        { value: "incident_response", label: "Necesito respuesta ante incidentes", service: "forensic_analysis" }
      ],
      scoring_weight: { urgency: 0.35 }
    },
    {
      id: "compliance",
      type: "multiple_choice",
      required: true,
      question: "¿Qué requerimientos de cumplimiento normativo tienes?",
      options: [
        { value: "gdpr", label: "GDPR / LOPD" },
        { value: "iso27001", label: "ISO 27001" },
        { value: "ens", label: "ENS (Esquema Nacional de Seguridad)" },
        { value: "nis2", label: "NIS-2" },
        { value: "pci", label: "PCI-DSS" }
      ],
      allow_other: true,
      scoring_weight: { fit: 0.20 }
    },
    {
      id: "it_team",
      type: "single_choice",
      required: true,
      question: "¿Tienes equipo IT interno?",
      options: [
        { value: "dedicated", label: "Sí, equipo dedicado de IT" },
        { value: "small", label: "Sí, pero solo 1-2 personas" },
        { value: "external", label: "No, lo gestionamos externamente" },
        { value: "none", label: "No tenemos equipo IT" }
      ],
      scoring_weight: { decision: 0.10 }
    },
    {
      id: "company_size",
      type: "single_choice",
      required: true,
      question: "¿Cuál es el tamaño de tu empresa?",
      options: [
        { value: "1-10", label: "1-10 empleados", score: 10 },
        { value: "11-50", label: "11-50 empleados", score: 15 },
        { value: "51-200", label: "51-200 empleados", score: 20 },
        { value: "200+", label: "+200 empleados", score: 25 }
      ],
      scoring_weight: { budget: 0.25 }
    },
    {
      id: "recent_incidents",
      type: "single_choice", 
      required: true,
      question: "¿Has tenido incidentes de ciberseguridad en los últimos 12 meses?",
      options: [
        { value: "urgent", label: "Sí, y necesitamos ayuda urgente", score: 35 },
        { value: "resolved", label: "Sí, pero ya lo resolvimos", score: 20 },
        { value: "preventive", label: "No, pero queremos prevenirlo", score: 10 },
        { value: "unsure", label: "No estoy seguro", score: 5 }
      ],
      scoring_weight: { urgency: 0.35 }
    },
    // Optional Questions (shown if user continues)
    {
      id: "sector",
      type: "single_choice",
      required: false,
      question: "¿En qué sector opera tu empresa?",
      options: [
        { value: "finance", label: "Finanzas" },
        { value: "health", label: "Salud" },
        { value: "retail", label: "Retail" },
        { value: "tech", label: "Tecnología" },
        { value: "manufacturing", label: "Manufactura" },
        { value: "other", label: "Otro" }
      ],
      scoring_weight: { engagement: 0.02 }
    }
    // ... more optional questions
  ],
  scoring: {
    thresholds: {
      A1: 85,  // Hot lead
      B1: 60,  // Warm lead
      C1: 30,  // Cold lead
      D1: 0    // Info seeker
    },
    components: {
      urgency: 0.35,
      budget: 0.25,
      fit: 0.20,
      engagement: 0.10,
      decision: 0.10
    }
  },
  ui: {
    progress_bar: true,
    skip_optional_button: true,
    auto_save: true,
    time_tracking: true,
    one_question_per_page: true
  }
};
```

**Implementation Pattern (Following Achromatic Forms)**
```typescript
// app/[locale]/onboarding/page.tsx
// Similar to assessments/new/page.tsx but with comprehensive metrics tracking

export default async function OnboardingPage() {
  const questionnaire = await getActiveQuestionnaire();
  
  return (
    <OnboardingQuestionnaire 
      config={questionnaire.config}
      onComplete={handleLeadQualification}
      trackingEnabled={true}
    />
  );
}
```

**Interaction Metrics Collection During Onboarding**
```typescript
// lib/onboarding-metrics.ts
interface OnboardingMetrics {
  // Per-Question Metrics
  questionMetrics: {
    questionId: string;
    timeSpent: number; // milliseconds
    changesCount: number; // how many times answer changed
    hoverTime: number; // time hovering over options
    abandonedAt?: boolean; // if user stopped here
    tooltipsViewed?: string[]; // which help tooltips clicked
  }[];
  
  // Session Metrics
  sessionMetrics: {
    startTime: Date;
    endTime?: Date;
    totalDuration: number;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    screenResolution: string;
    browser: string;
    referrer: string;
    ipCountry?: string;
  };
  
  // Behavioral Metrics
  behaviorMetrics: {
    backButtonClicks: number; // went to previous question
    skipButtonClicks: number; // skipped optional questions
    helpButtonClicks: number; // clicked help/info buttons
    formAbandoned: boolean;
    abandonmentPoint?: string; // question ID where abandoned
    completionPath: 'linear' | 'back_and_forth' | 'skip_heavy';
  };
  
  // Engagement Scoring Factors
  engagementMetrics: {
    optionalQuestionsAnswered: number;
    freeTextWordCount: number; // for open-ended questions
    totalInteractions: number; // all clicks, hovers, etc.
    averageTimePerQuestion: number;
    consideredAnswers: string[]; // options user hovered but didn't select
  };
}

// Track metrics in real-time
const trackQuestionInteraction = async (event: InteractionEvent) => {
  await db.insert(leadAnalyticsEventTable).values({
    leadQualificationId: session.leadId,
    eventType: event.type, // 'question_viewed', 'answer_selected', 'answer_changed', 'tooltip_clicked'
    questionId: event.questionId,
    previousValue: event.previousValue,
    newValue: event.newValue,
    timeSpent: event.duration,
    metadata: {
      mouseMovements: event.mouseTrackingData,
      hesitationPoints: event.hesitationAnalysis
    },
    createdAt: new Date()
  });
};
```

**Lead Quality Indicators from Metrics**
```typescript
// High-Quality Lead Indicators:
- Fast completion with no changes = Confident, prepared buyer
- High time spent + multiple changes = Careful consideration, serious intent
- All optional questions answered = High engagement
- Specific free text = Clear needs

// Low-Quality Lead Indicators:
- Very fast completion (<30s) = Likely not serious
- No optional questions = Low engagement  
- Generic/no free text = Unclear needs
- High abandonment rate at pricing questions = Budget concerns
```

### Development Setup

**Initial Admin User Creation**
```typescript
// scripts/create-admin.ts
// Run: pnpm tsx scripts/create-admin.ts
import { db } from '@workspace/database';
import { userTable } from '@workspace/database/schema';

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mineryreport.com';
  
  // Check if admin exists
  const existing = await db.select()
    .from(userTable)
    .where(eq(userTable.email, adminEmail));
  
  if (existing.length === 0) {
    console.error('User not found. Please sign up first, then run this script.');
    return;
  }
  
  // Update user to be platform admin
  await db.update(userTable)
    .set({ isPlatformAdmin: true })
    .where(eq(userTable.email, adminEmail));
  
  console.log(`✅ Admin privileges granted to ${adminEmail}`);
}

createAdminUser();
```

**Testing Framework Setup**
```bash
# Install testing dependencies (if not already present)
pnpm add -D @testing-library/react @testing-library/jest-dom vitest @vitejs/plugin-react

# Create vitest config
# vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

**Test Database Configuration**
```bash
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/minery_test"

# Create test database
createdb minery_test

# Run migrations on test database
DATABASE_URL=$DATABASE_URL_TEST pnpm db:migrate
```

### Implementation Phases

**Phase 1: Core Admin & Service Requests (Days 1-4)**

**Day 1: Setup & Service Requests**
- Add isPlatformAdmin to schema
- Create simple serviceRequest table
- Run create-admin script for development
- Add "Request Service" button to services page
- Create basic request form (reuse contact form pattern)
- Send email to contacto@mineryreport.com

**Day 2: Admin Dashboard**
- Create admin routes and middleware
- Dashboard with 4 simple metrics
- Contact messages list (already have getContactMessages)
- Service requests list
- Mark as read functionality

**Day 3: Basic Management**
- Organizations list (reuse existing patterns)
- Users list (reuse existing patterns)
- Update service request status
- WhatsApp link integration

**Day 4: Polish Phase 1**
- Testing
- Deploy

**Phase 2: Lead Qualification System (Days 5-8)**

**Day 5: Onboarding Integration**
- Create questionnaireConfig, leadQualification and leadAnalyticsEvent tables
- Create default questionnaire JSON configuration
- Integrate into existing /onboarding flow
- Implement one-question-at-a-time UI pattern (like assessments/new)
- Add progress bar and auto-save after each question
- Add interaction tracking (time per question, changes, device)

**Day 6: Lead Scoring & Classification**
- Implement lead scoring algorithm
- Auto-classify leads (A1/B1/C1/D1)
- Create lead management admin page
- Display lead details with full responses

**Day 7: Lead Analytics Dashboard**
- Build lead analytics page
- Completion rate metrics
- Abandonment analysis
- Time per question analytics
- Device and session breakdown

**Day 8: Integration & Polish**
- Connect leads to service requests
- Automated notifications based on lead score
- Testing and refinement
- Deploy Phase 2

## 8. What We're NOT Building (Yet)

To avoid overengineering:
- ❌ Complex CRM features
- ❌ Email automation  
- ❌ User management actions
- ❌ Organization suspension
- ❌ Export functionality (CSV/PDF)
- ❌ Real-time updates
- ❌ Audit logs
- ❌ API endpoints
- ❌ Performance metrics
- ❌ Incident monitoring
- ❌ Assessment detailed analytics
- ❌ Built-in messaging (using WhatsApp instead)
- ❌ Automated lead scoring
- ❌ Email sequences
- ❌ Complex permissions

## 9. Success Metrics

**Week 1 After Launch:**
- Admin can see all contact messages and service requests
- Revenue and pipeline visible in dashboard
- Users can request premium services directly
- Response time to contacts < 4 hours
- Admin uses panel daily

**Month 1 - Business Metrics:**
- Conversion rate tracked (target: 10%)
- Average deal size calculated
- Pipeline value visible
- Win/loss reasons documented
- Revenue growth measurable

**Month 3 - Success Indicators:**
- 20% increase in conversion rate
- 50% reduction in time to close
- 100% of deals tracked with values
- Clear visibility of revenue pipeline

## 10. Risks

**Risk 1**: Scope creep
**Mitigation**: Strictly enforce "NOT Building" list

**Risk 2**: Performance with growth
**Mitigation**: Add pagination when >100 messages

## 11. Rollback Procedures

### Database Changes Rollback
1. **isPlatformAdmin flag**
   - Rollback: `ALTER TABLE user DROP COLUMN isPlatformAdmin;`
   - Impact: Admin access removed, no data loss

2. **serviceRequest table**
   - Rollback: `DROP TABLE IF EXISTS serviceRequest CASCADE;`
   - Backup: Export existing requests before rollback
   - Impact: Service request history lost if not backed up

3. **leadQualification tables**
   - Rollback script:
   ```sql
   DROP TABLE IF EXISTS leadAnalyticsEvent CASCADE;
   DROP TABLE IF EXISTS leadQualification CASCADE;
   ```
   - Backup: Export lead data before rollback

### Feature Flag Strategy
- Implement feature flags for:
  - Admin panel access: `FEATURE_ADMIN_PANEL`
  - Service requests: `FEATURE_SERVICE_REQUESTS`
  - Lead qualification: `FEATURE_LEAD_QUALIFICATION`
- Rollback: Toggle flags off without code deployment

### Code Rollback
- Git tags for each deployment: `pre-admin-panel-v1.0`
- Rollback command: `git revert --no-commit <commit-hash>..HEAD`
- CI/CD pipeline supports one-click rollback to previous version

## 12. Testing Strategy for Existing Features

### Pre-Implementation Baseline
1. **Capture Current Behavior**
   - Document existing user flows
   - Screenshot key pages
   - Record API responses
   - Export sample database data

2. **Regression Test Suite**
   ```typescript
   // tests/regression/existing-features.test.ts
   describe('Existing Features Preservation', () => {
     test('Organization dashboard loads correctly', async () => {
       // Test existing /organizations/[slug] route
     });
     
     test('Services page displays all services', async () => {
       // Test existing /services functionality
     });
     
     test('User authentication flow unchanged', async () => {
       // Test login/logout/session management
     });
   });
   ```

3. **Integration Testing Checkpoints**
   - After adding isPlatformAdmin: Verify normal users unaffected
   - After service request UI: Verify existing service page intact
   - After admin routes: Verify no route conflicts

4. **Smoke Tests**
   - User can log in ✓
   - Organization pages load ✓
   - Existing services functional ✓
   - Assessments work ✓
   - Contact forms submit ✓

## 13. Monitoring & Error Handling

### Basic Error Logging
```typescript
// lib/monitoring.ts
export async function logAdminAction(action: string, details: any) {
  console.log(`[ADMIN ACTION] ${action}`, {
    timestamp: new Date().toISOString(),
    user: details.userId,
    ...details
  });
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Future: Send to Sentry/LogRocket/etc
  }
}

// Usage in admin actions
try {
  await updateServiceRequest(id, data);
  await logAdminAction('service_request_updated', { id, status: data.status });
} catch (error) {
  await logAdminAction('service_request_error', { id, error: error.message });
  throw error;
}
```

### Performance Monitoring
```typescript
// Track slow queries
const startTime = performance.now();
const results = await getServiceRequests();
const duration = performance.now() - startTime;

if (duration > 1000) {
  logAdminAction('slow_query', { query: 'getServiceRequests', duration });
}
```

## 14. User Communication & Documentation

### Feature Announcement Banner
```tsx
// components/new-feature-banner.tsx
export function NewFeatureBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Sparkles className="h-4 w-4" />
      <AlertTitle className="ml-6 mt-1">Nueva Funcionalidad: Solicitud de Servicios Premium</AlertTitle>
      <AlertDescription className="mt-1">
        Ahora puedes solicitar servicios premium directamente desde el catálogo.
        <Link href="/help/service-requests" className="underline ml-1">
          Ver cómo funciona →
        </Link>
      </AlertDescription>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
```

### User Guide for Service Requests
```markdown
# Cómo Solicitar Servicios Premium

## Para Usuarios

### Solicitar un Servicio
1. Ve a **Servicios** en el menú lateral
2. Encuentra el servicio que necesitas
3. Haz clic en **"Solicitar Servicio"**
4. Completa el formulario con tu información
5. Opcionalmente, describe tus necesidades específicas
6. Haz clic en **"Enviar Solicitud"**

### Seguimiento de Solicitudes
1. Ve a **Servicios → Mis Solicitudes**
2. Verás todas tus solicitudes con su estado:
   - 🟡 **Pendiente**: Acabas de enviar la solicitud
   - 🔵 **Contactado**: Minery te ha contactado
   - 🟠 **En Progreso**: El servicio está siendo implementado
   - 🟢 **Completado**: El servicio ha sido completado

### Estados de las Solicitudes
- Las solicitudes se procesan en menos de 24 horas
- Recibirás notificaciones por email en cada cambio de estado
- Puedes ver las notas del equipo en el detalle de cada solicitud

## Para Administradores

### Gestión de Solicitudes
1. Accede a `/admin/services`
2. Verás todas las solicitudes ordenadas por fecha
3. Haz clic en una solicitud para ver detalles
4. Actualiza el estado según el progreso
5. Añade notas para el cliente si es necesario

### Priorización
- **A1 (Hot)**: Contactar en <2 horas
- **B1 (Warm)**: Contactar en <24 horas
- **C1/D1**: Seguimiento programado
```

## 15. Future Considerations

Only add features when we have evidence they're needed:
1. If we get >50 messages/day → Add better filtering
2. If we need team access → Add role-based admin
3. If we track revenue → Add MRR dashboard
4. If compliance critical → Add incident monitoring

## 12. Acceptance Criteria

**Phase 1 - Core Admin Panel:**
- [ ] Admin can login with isPlatformAdmin=true (multiple admins supported)
- [ ] Dashboard shows business metrics (revenue, pipeline, conversion)
- [ ] Can see all contact messages
- [ ] Can mark messages as read
- [ ] Users can request premium services from services page
- [ ] Users can view their service requests and status
- [ ] WhatsApp integration for communication
- [ ] Service requests show in pipeline view
- [ ] Admin can track deal values and stages
- [ ] Admin can update status (pending → won/lost)
- [ ] Revenue tracking functional
- [ ] Conversion funnel visible
- [ ] Win/loss reasons tracked
- [ ] Can see all organizations with basic info
- [ ] Can see all users with basic info
- [ ] Can search orgs and users
- [ ] UI matches existing design system

**Phase 2 - Lead Qualification System:**
- [ ] Onboarding form accessible at /onboarding
- [ ] 5 required questions functional
- [ ] 20 optional questions functional
- [ ] Open text field for specific needs
- [ ] Progress bar shows completion status
- [ ] Auto-save on each question
- [ ] Lead scoring algorithm calculates 0-100 score
- [ ] Automatic lead classification (A1/B1/C1/D1)
- [ ] Admin can view all leads at /admin/leads
- [ ] Lead detail page shows all responses
- [ ] Lead analytics dashboard functional
- [ ] Completion rate metrics visible
- [ ] Abandonment analysis available
- [ ] Time per question tracked
- [ ] Device type recorded
- [ ] Automated notifications based on lead score
- [ ] Integration with service requests
- [ ] Response time recommendations displayed

---

**Document Version**: 2.0 (Simplified)
**Created Date**: 2025-01-20
**Status**: Ready for Implementation

## Summary

**Build only what provides immediate business value:**
1. Enable users to request premium services directly
2. Track revenue and pipeline value
3. Monitor conversion rates and deal stages
4. Understand why deals are won or lost
5. Measure customer success metrics

**Technical Approach:**
- **100% built on Achromatic Starter Kit**
- **No new frameworks or dependencies**
- **Reuse all existing patterns and components**
- **Follow docs_achromatic conventions**

**Simplified Service Request Journey:**
1. User requests service via form
2. Admin receives notification
3. Communication happens via WhatsApp
4. Admin tracks deal value and stage
5. Status updates: Lead → Qualified → Proposal → Won/Lost
6. Revenue and metrics automatically calculated

**Key Business Features:**
- **Revenue Dashboard**: MRR, pipeline value, conversion rates
- **Pipeline Management**: Kanban view by stage
- **Deal Tracking**: Values, stages, win/loss reasons
- **Analytics**: Conversion funnel, avg deal size, time to close
- **WhatsApp Integration**: Direct communication link
- **Multi-Admin Support**: Multiple platform admins

**What We're NOT Building:**
- ❌ Built-in messaging system (using WhatsApp)
- ❌ Complex CRM features
- ❌ Email automation
- ❌ Automated scoring
- ❌ New UI frameworks (using existing Achromatic components)

**Timeline: 8 days total**
- Phase 1 (Core Admin): 4 days
- Phase 2 (Lead Qualification): 4 days

**ROI Focus:**
Every feature directly impacts revenue visibility and growth. No vanity features.

**Development Efficiency:**
By building on Achromatic, we can copy patterns from existing pages like organizations, contacts, and incidents - reducing development time by 50%.