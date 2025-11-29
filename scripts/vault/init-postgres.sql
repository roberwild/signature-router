-- PostgreSQL initialization script for Vault integration
-- Story 8.5: Vault Secret Rotation

-- Create Vault user with privileges to manage database users
CREATE ROLE vault_admin WITH LOGIN PASSWORD 'vault_admin_password_123' SUPERUSER;

-- Create application user (will be managed by Vault)
CREATE ROLE app_user WITH LOGIN PASSWORD 'initial_password_123';

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE signature_router_dev TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Enable Row Level Security for audit log (if not already enabled)
-- This will be managed by Liquibase, but included here for reference
-- ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL initialized for Vault integration';
  RAISE NOTICE 'Vault admin user: vault_admin';
  RAISE NOTICE 'Application user: app_user';
END $$;

