-- Admin Panel Database Schema
-- SQL migration for admin panel tables

-- ================================================
-- 1. Add isPlatformAdmin flag to existing user table
-- ================================================
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "isPlatformAdmin" BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_user_platform_admin 
ON "user"("isPlatformAdmin") 
WHERE "isPlatformAdmin" = TRUE;

-- ================================================
-- 2. Service Requests Table
-- ================================================
CREATE TABLE IF NOT EXISTS "serviceRequest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  
  -- Service details
  "serviceType" VARCHAR(50) NOT NULL,
  "serviceName" VARCHAR(255) NOT NULL,
  
  -- Status and lifecycle
  "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  "conversionStage" VARCHAR(20) DEFAULT 'lead' CHECK ("conversionStage" IN ('lead', 'qualified', 'opportunity', 'customer')),
  
  -- Contact information
  "contactName" VARCHAR(255) NOT NULL,
  "contactEmail" VARCHAR(255) NOT NULL,
  "contactPhone" VARCHAR(50),
  
  -- Messages and notes
  "message" TEXT, -- Initial request message
  "adminNotes" TEXT, -- Admin internal notes
  
  -- Business metrics
  "estimatedValue" DECIMAL(10, 2), -- Estimated deal value
  "actualValue" DECIMAL(10, 2), -- Actual closed value
  "lostReason" VARCHAR(255), -- Why deal was lost
  
  -- Follow-up
  "nextFollowUp" TIMESTAMP,
  
  -- Timestamps
  "wonDate" TIMESTAMP, -- When deal was won
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_request_organization 
ON "serviceRequest"("organizationId");

CREATE INDEX IF NOT EXISTS idx_service_request_user 
ON "serviceRequest"("userId");

CREATE INDEX IF NOT EXISTS idx_service_request_status 
ON "serviceRequest"("status");

CREATE INDEX IF NOT EXISTS idx_service_request_stage 
ON "serviceRequest"("conversionStage");

CREATE INDEX IF NOT EXISTS idx_service_request_created 
ON "serviceRequest"("createdAt" DESC);

-- ================================================
-- 3. Lead Qualification Table
-- ================================================
CREATE TABLE IF NOT EXISTS "leadQualification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  
  -- Required questions
  "mainConcern" VARCHAR(100) CHECK ("mainConcern" IN ('security_level', 'vulnerabilities', 'no_team', 'incident_response')),
  "complianceRequirements" TEXT[], -- Array of compliance requirements
  "complianceOther" TEXT, -- Free text for other requirements
  "itTeamSize" VARCHAR(50) CHECK ("itTeamSize" IN ('dedicated', 'small', 'external', 'none')),
  "companySize" VARCHAR(50) CHECK ("companySize" IN ('1-10', '11-50', '51-200', '200+')),
  "recentIncidents" VARCHAR(50) CHECK ("recentIncidents" IN ('urgent', 'resolved', 'preventive', 'unsure')),
  
  -- Optional questions (stored as JSONB for flexibility)
  "optionalResponses" JSONB,
  
  -- Open text question
  "specificNeeds" TEXT,
  
  -- Scoring and classification
  "leadScore" INTEGER CHECK ("leadScore" >= 0 AND "leadScore" <= 100),
  "leadClassification" VARCHAR(10) CHECK ("leadClassification" IN ('A1', 'B1', 'C1', 'D1')),
  "scoreComponents" JSONB, -- {urgency: 35, budget: 25, fit: 20, engagement: 10, decision: 10}
  
  -- Interaction metrics
  "completionTime" INTEGER, -- seconds
  "questionsAnswered" INTEGER,
  "optionalAnswered" INTEGER,
  "deviceType" VARCHAR(20),
  "abandonmentPoint" VARCHAR(50), -- question ID if abandoned
  "timePerQuestion" JSONB, -- {q1: 15, q2: 20, ...}
  
  -- Timestamps
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for lead management
CREATE INDEX IF NOT EXISTS idx_lead_organization 
ON "leadQualification"("organizationId");

CREATE INDEX IF NOT EXISTS idx_lead_user 
ON "leadQualification"("userId");

CREATE INDEX IF NOT EXISTS idx_lead_classification 
ON "leadQualification"("leadClassification");

CREATE INDEX IF NOT EXISTS idx_lead_score 
ON "leadQualification"("leadScore" DESC);

CREATE INDEX IF NOT EXISTS idx_lead_created 
ON "leadQualification"("createdAt" DESC);

-- ================================================
-- 4. Lead Analytics Events Table
-- ================================================
CREATE TABLE IF NOT EXISTS "leadAnalyticsEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "leadQualificationId" UUID NOT NULL REFERENCES "leadQualification"("id") ON DELETE CASCADE,
  
  "eventType" VARCHAR(50) NOT NULL, -- question_answered/question_changed/tooltip_clicked/form_abandoned
  "questionId" VARCHAR(50),
  "previousValue" TEXT,
  "newValue" TEXT,
  "timeSpent" INTEGER, -- milliseconds
  "metadata" JSONB, -- Additional event data
  
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_lead_event_qualification 
ON "leadAnalyticsEvent"("leadQualificationId");

CREATE INDEX IF NOT EXISTS idx_lead_event_type 
ON "leadAnalyticsEvent"("eventType");

CREATE INDEX IF NOT EXISTS idx_lead_event_created 
ON "leadAnalyticsEvent"("createdAt" DESC);

-- ================================================
-- 5. Questionnaire Configuration Table
-- ================================================
CREATE TABLE IF NOT EXISTS "questionnaireConfig" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "version" INTEGER DEFAULT 1,
  "isActive" BOOLEAN DEFAULT TRUE,
  "config" JSONB NOT NULL, -- Stores the complete questionnaire structure
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Only one active config at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_questionnaire_active 
ON "questionnaireConfig"("isActive") 
WHERE "isActive" = TRUE;

-- ================================================
-- 6. Updated timestamp trigger function
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updatedAt
DROP TRIGGER IF EXISTS update_service_request_updated_at ON "serviceRequest";
CREATE TRIGGER update_service_request_updated_at
    BEFORE UPDATE ON "serviceRequest"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_qualification_updated_at ON "leadQualification";
CREATE TRIGGER update_lead_qualification_updated_at
    BEFORE UPDATE ON "leadQualification"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questionnaire_config_updated_at ON "questionnaireConfig";
CREATE TRIGGER update_questionnaire_config_updated_at
    BEFORE UPDATE ON "questionnaireConfig"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 7. Initial Data - Create First Admin User
-- ================================================
-- IMPORTANT: Run this after signing up your admin user
-- Replace 'admin@mineryreport.com' with your actual admin email

-- UPDATE "user" 
-- SET "isPlatformAdmin" = TRUE 
-- WHERE "email" = 'admin@mineryreport.com';

-- ================================================
-- 8. Verification Queries
-- ================================================
-- Check admin users:
-- SELECT "id", "name", "email", "isPlatformAdmin" FROM "user" WHERE "isPlatformAdmin" = TRUE;

-- Check service requests:
-- SELECT COUNT(*) as total FROM "serviceRequest";

-- Check leads:
-- SELECT COUNT(*) as total, "leadClassification", AVG("leadScore") 
-- FROM "leadQualification" 
-- GROUP BY "leadClassification";

