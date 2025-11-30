# Testing Guide - Signature Router

Complete guide for testing the Signature Router in local development.

## Prerequisites

Ensure all services are running:

```powershell
# Verify Docker containers
docker ps

# Verify Spring Boot application
curl http://localhost:8080/actuator/health
```

## Automated Testing with PowerShell

### Complete Flow Test (Recommended)

```powershell
.\scripts\test-complete-flow.ps1
```

This script:
1. Obtains admin token from Keycloak
2. Creates a signature request
3. Extracts the challenge ID
4. Queries PostgreSQL for the challenge code
5. Completes the signature

### Get Challenge Code

```powershell
# Get latest challenge code
.\scripts\get-challenge-code.ps1

# Get specific challenge code
.\scripts\get-challenge-code.ps1 -ChallengeId "019acfcf-16b3-7b6e-820f-9320a61d0520"
```

The code is automatically copied to your clipboard.

## Manual Testing with Postman

### Import Collection

1. Import: `postman/Signature-Router-v2.postman_collection.json`
2. Import: `postman/Signature-Router-Local.postman_environment.json`
3. Select environment: **Signature Router - Local**

### Test Flow

1. **Get Admin Token** - Sets `admin_token` variable automatically
2. **Create Signature Request - SMS (Admin)** - Sets `signature_request_id` automatically
3. **Get Signature Request by ID** - Sets `challenge_id` automatically
4. **Get challenge code**: Run `.\scripts\get-challenge-code.ps1`
5. **Update** `challenge_code` variable in Postman Environment
6. **Verify Challenge** - Completes the signature

## Troubleshooting

### Error: "Invalid challenge code"

**Solution:** Get the correct code from the database:
```powershell
.\scripts\get-challenge-code.ps1
```

### Error: "NOT_FOUND" when completing signature

**Cause:** Using `challenge_id` instead of `signature_request_id` in URL.

**Solution:** URL must be `/api/v1/signatures/{signature_request_id}/complete`

### PostgreSQL not responding

**Solution:**
```powershell
# Check Docker container
docker ps -a | findstr postgres

# Start if stopped
docker start signature-router-postgres

# If port conflict with local PostgreSQL (e.g., Supabase)
net stop postgresql-x64-17  # Requires admin PowerShell
```

## Postman Environment Variables

| Variable | Set by | Example |
|----------|--------|---------|
| `admin_token` | Get Admin Token | `eyJhbGci...` |
| `signature_request_id` | Create Signature Request | `019acfcf-16b2...` |
| `challenge_id` | Get Signature Request by ID | `019acfcf-16b3...` |
| `challenge_code` | **Manual** (via script) | `904961` |

## Next Steps

Once the basic flow works, try:
1. Other channels: PUSH, VOICE, BIOMETRIC
2. Routing rules: Create dynamic routing rules
3. Fallback: Test behavior when provider fails
4. Admin Portal: Use web interface for management

