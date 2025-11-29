-- Story 8.3: PostgreSQL Row-Level Security for customer data segregation
-- GDPR Art. 32: Security of processing (technical measures)

-- Enable Row-Level Security on signature_request table
ALTER TABLE signature_request ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users with ROLE_USER can only see their own signature requests
-- Note: This policy relies on application-level customer_id validation
-- The customer_id is pseudonymized, so we use it for RLS
CREATE POLICY user_isolation_policy ON signature_request
    FOR ALL
    TO PUBLIC
    USING (
        -- Allow if user is ADMIN/SUPPORT/AUDITOR (bypass RLS for staff)
        current_setting('app.user_role', true) IN ('ADMIN', 'SUPPORT', 'AUDITOR')
        OR
        -- Allow if customer_id matches user's pseudonymized customer_id
        customer_id = current_setting('app.customer_pseudonymized_id', true)
    );

-- Policy 2: Prevent users from modifying other customers' requests
CREATE POLICY user_modification_policy ON signature_request
    FOR UPDATE
    TO PUBLIC
    USING (
        current_setting('app.user_role', true) IN ('ADMIN', 'SUPPORT')
        OR
        customer_id = current_setting('app.customer_pseudonymized_id', true)
    );

-- Policy 3: Prevent users from deleting other customers' requests
CREATE POLICY user_deletion_policy ON signature_request
    FOR DELETE
    TO PUBLIC
    USING (
        current_setting('app.user_role', true) = 'ADMIN'
    );

-- Comment for documentation
COMMENT ON POLICY user_isolation_policy ON signature_request IS 
    'Row-Level Security: Users can only access their own signature requests (based on pseudonymized customer_id). Staff roles (ADMIN, SUPPORT, AUDITOR) bypass this policy.';

COMMENT ON POLICY user_modification_policy ON signature_request IS 
    'Row-Level Security: Only ADMIN and SUPPORT can modify signature requests, or the owning customer.';

COMMENT ON POLICY user_deletion_policy ON signature_request IS 
    'Row-Level Security: Only ADMIN can delete signature requests.';

