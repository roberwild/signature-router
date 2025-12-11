# ⚠️ DEPRECATED - Monorepo Archived

**Date:** 11 Diciembre 2025  
**Reason:** Repository split into separate backend and frontend repositories following Singular Bank corporate standards

---

## 📦 This Monorepo Has Been Separated

This repository has been **archived** and split into two independent repositories following Singular Bank's naming conventions and organizational structure:

### 🔐 Backend Repository (Spring Boot + Java)

**Name:** `svc-signature-routing-process-java`  
**Repository:** https://github.com/roberwild/svc-signature-routing-process-java  
**Description:** Multi-Provider Signature Orchestration Microservice

**Tech Stack:**
- Spring Boot 3.2.0 + Java 21
- PostgreSQL 15 + Liquibase
- Kafka + Avro
- Keycloak OAuth2 + JWT
- Prometheus + Grafana + Jaeger
- HashiCorp Vault
- Circuit Breaker + Retry + Rate Limiting

**Package:** `com.singularbank.signature.routing`  
**Port:** 8080

---

### 🎨 Frontend Repository (Next.js + React)

**Name:** `app-signature-router-admin-web-react`  
**Repository:** https://github.com/roberwild/app-signature-router-admin-web-react  
**Description:** Signature Router Admin Portal

**Tech Stack:**
- Next.js 15.2.1 + React 19
- TypeScript 5.3.3
- Tailwind CSS 3.4.17 + Shadcn UI
- NextAuth 5.0 (Keycloak)

**Features:**
- Dashboard with metrics
- Routing rules management (CRUD)
- Signature requests monitoring
- Provider health dashboard
- Advanced metrics visualization

**Port:** 3000

---

## 🚫 No Further Development Here

**⚠️ IMPORTANT:** This monorepo is **no longer maintained**.

All future development should be done in the separated repositories above.

### Migration Notes

- **Commit History:** The initial commit in each new repo references this monorepo as the source
- **Documentation:** Split by component (backend docs in backend repo, frontend docs in frontend repo)
- **Shared Documentation:** Duplicated in both repos where applicable (Epic 12, corporate standards, etc.)

### Why the Split?

1. **Corporate Standards:** Singular Bank requires separate repositories per component
2. **Naming Convention:** Follow `svc-*-process-java` and `app-*-web-react` patterns
3. **Team Organization:** Separate CI/CD, permissions, and deployment cycles
4. **Clarity:** Clear separation of concerns between backend and frontend

---

## 📅 Timeline

| Date | Event |
|------|-------|
| **2025-12-11** | Repository separated into backend and frontend |
| **2025-12-11** | Monorepo archived (this message added) |
| **Future** | This repository will be archived in GitHub settings |

---

## 🔗 Quick Links

### Backend
- Repository: https://github.com/roberwild/svc-signature-routing-process-java
- README: See backend repo
- API Docs: See `docs/api/` in backend repo
- Quick Start: See backend repo `QUICK-START.md`

### Frontend
- Repository: https://github.com/roberwild/app-signature-router-admin-web-react
- README: See frontend repo
- Component Docs: See `docs/` in frontend repo
- Quick Start: See frontend repo `QUICK-START.md`

---

## 💾 Backup

A full backup of this monorepo (including Git history) was created before the split:

**Backup File:** `signature-router-backup-2025-12-11.bundle`  
**Location:** `C:\Proyectos\`

To restore from backup:
```bash
git clone signature-router-backup-2025-12-11.bundle signature-router-restored
```

---

## ✅ For New Contributors

If you're starting work on Signature Router:

1. **Clone the appropriate repository** (backend or frontend, not this one)
2. **Follow the setup instructions** in each repo's README
3. **Ignore this archived monorepo** (unless you need historical reference)

---

**Questions?** Contact the Tech Lead or refer to the separated repositories above.

**Status:** 🔴 ARCHIVED - DO NOT USE FOR NEW DEVELOPMENT

