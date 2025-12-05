# 🚀 Guía de Despliegue - Signature Router

Esta guía documenta cómo desplegar el proyecto en los diferentes entornos, con especial énfasis en la gestión segura de secrets.

---

## 📋 Índice

1. [Resumen de Entornos](#resumen-de-entornos)
2. [Gestión de Secrets por Entorno](#gestión-de-secrets-por-entorno)
3. [Despliegue en Local](#despliegue-en-local)
4. [Despliegue en DEV/QA](#despliegue-en-devqa)
5. [Despliegue en PRE/PRO](#despliegue-en-prepro)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Verificación del Despliegue](#verificación-del-despliegue)
8. [Rollback](#rollback)

---

## 🌍 Resumen de Entornos

| Entorno | Backend Profile | Keycloak | Vault | Base de Datos |
|---------|-----------------|----------|-------|---------------|
| **Local** | `local` | Docker (localhost:8180) | Docker (dev mode) | Docker (localhost:5432) |
| **Local + AD** | `local,dev-remote` | SBTech (identitydev.sbtech.es) | Docker (dev mode) | Docker (localhost:5432) |
| **DEV** | `dev` | SBTech DEV | Vault DEV | PostgreSQL DEV |
| **QA** | `qa` | SBTech QA | Vault QA | PostgreSQL QA |
| **PRE** | `pre` | SBTech PRE | Vault PRE | PostgreSQL PRE |
| **PRO** | `prod` | SBTech PRO | Vault PRO (HA) | PostgreSQL PRO (HA) |

---

## 🔐 Gestión de Secrets por Entorno

### Principio fundamental

> ⚠️ **NUNCA se comitean secrets en el repositorio.**  
> Los secrets se gestionan de forma diferente según el entorno.

### Resumen de métodos

| Entorno | Frontend | Backend | Método |
|---------|----------|---------|--------|
| **Local** | `.env.local` (gitignore) | `application-local.yml` | Archivos locales |
| **DEV/QA** | Kubernetes Secrets | HashiCorp Vault | Inyección en runtime |
| **PRE/PRO** | Kubernetes Secrets | HashiCorp Vault + rotación | Inyección segura |

---

## 💻 Despliegue en Local

Ver guía detallada: [GUIA-ARRANQUE-KEYCLOAK.md](./GUIA-ARRANQUE-KEYCLOAK.md)

### Arquitectura Local = Misma que Producción

En local usamos **exactamente la misma arquitectura** que en otros entornos:
- Backend obtiene secrets de Vault (Docker)
- Frontend obtiene secrets de variables de entorno

```
┌─────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA LOCAL                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐         ┌──────────────────────┐         │
│   │   Frontend   │         │      Backend         │         │
│   │   Next.js    │────────▶│    Spring Boot       │         │
│   └──────┬───────┘         └──────────┬───────────┘         │
│          │                            │                      │
│          │ .env.local                 │ Spring Cloud Vault   │
│          │ (gitignore)                │                      │
│          ▼                            ▼                      │
│   ┌──────────────┐         ┌──────────────────────┐         │
│   │  Variables   │         │   Vault (Docker)     │         │
│   │  de Entorno  │         │   localhost:8200     │         │
│   └──────────────┘         └──────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1. Levantar Vault y Cargar Secrets

```powershell
cd svc-signature-router

# Levantar Vault
docker-compose up -d vault

# Inicializar secrets (solo primera vez)
docker-compose exec vault sh /vault/scripts/vault-init.sh

# Verificar secrets cargados
docker-compose exec vault vault kv get secret/signature-router
```

### 2. Actualizar Secrets para Keycloak Remoto (AD)

Si vas a usar el Keycloak de desarrollo (AD), actualiza los secrets en Vault (solicitar valores a infraestructura):

**PowerShell (Windows):**
```powershell
docker-compose exec vault vault kv patch secret/signature-router keycloak.client-id="<client-id-real>"
docker-compose exec vault vault kv patch secret/signature-router keycloak.client-secret="<client-secret-real>"
docker-compose exec vault vault kv patch secret/signature-router keycloak.issuer-uri="https://identitydev.sbtech.es/realms/customer"

# Verificar
docker-compose exec vault vault kv get secret/signature-router
```

**Bash (Linux/Mac):**
```bash
docker-compose exec vault vault kv patch secret/signature-router \
  keycloak.client-id="<client-id-real>" \
  keycloak.client-secret="<client-secret-real>" \
  keycloak.issuer-uri="https://identitydev.sbtech.es/realms/customer"

# Verificar
docker-compose exec vault vault kv get secret/signature-router
```

### 3. Acceder a Vault UI (opcional)

- **URL:** http://localhost:8200/ui
- **Token:** `dev-token-123`
- **Path:** `secret/signature-router`

### 4. Secrets del Frontend (.env.local)

El frontend aún necesita `.env.local` porque Next.js no tiene integración nativa con Vault:

```powershell
cd app-signature-router-admin
copy env.local.example .env.local
notepad .env.local
```

> 💡 **Tip:** Los valores de `.env.local` deben coincidir con los de Vault para consistencia.

---

## 🧪 Despliegue en DEV/QA

### 1. Secrets del Backend (Vault)

Los secrets se almacenan en HashiCorp Vault y se inyectan automáticamente via Spring Cloud Vault.

**Estructura de secrets en Vault:**

```
secret/signature-router-dev/
├── database.password
├── keycloak.client-secret
├── kafka.sasl-jaas-config
├── twilio.api-key
├── twilio.api-secret
├── push-service.api-key
└── biometric-sdk.license
```

**Configuración del backend (`bootstrap-dev.yml`):**

```yaml
spring:
  cloud:
    vault:
      enabled: true
      uri: https://vault-dev.sbtech.es:8200
      authentication: KUBERNETES
      kubernetes:
        role: signature-router-dev
        service-account-token-file: /var/run/secrets/kubernetes.io/serviceaccount/token
      kv:
        enabled: true
        backend: secret
        default-context: signature-router-dev
```

### 2. Secrets del Frontend (Kubernetes Secrets)

Los secrets de Next.js se inyectan como variables de entorno desde Kubernetes Secrets.

**Crear el Secret en Kubernetes:**

```yaml
# k8s/overlays/dev/frontend-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: signature-router-admin-secrets
  namespace: signature-router-dev
type: Opaque
stringData:
  AUTH_SECRET: "<valor-desde-pipeline>"
  KEYCLOAK_CLIENT_ID: "<valor-desde-vault>"
  KEYCLOAK_CLIENT_SECRET: "<valor-desde-vault>"
```

> ⚠️ **Este archivo NO se commitea.** Se genera en el pipeline CI/CD.

**Deployment del Frontend:**

```yaml
# k8s/base/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: signature-router-admin
spec:
  template:
    spec:
      containers:
        - name: frontend
          image: signature-router-admin:latest
          env:
            - name: AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: signature-router-admin-secrets
                  key: AUTH_SECRET
            - name: KEYCLOAK_CLIENT_ID
              valueFrom:
                secretKeyRef:
                  name: signature-router-admin-secrets
                  key: KEYCLOAK_CLIENT_ID
            - name: KEYCLOAK_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: signature-router-admin-secrets
                  key: KEYCLOAK_CLIENT_SECRET
            - name: KEYCLOAK_ISSUER
              value: "https://identitydev.sbtech.es/realms/customer"
            - name: NEXTAUTH_URL
              value: "https://signature-router-dev.sbtech.es"
```

### 3. Desplegar

```bash
# Backend
kubectl apply -k k8s/overlays/dev/

# Frontend
kubectl apply -f k8s/overlays/dev/frontend-deployment.yaml
```

---

## 🏭 Despliegue en PRE/PRO

### Diferencias con DEV/QA

| Aspecto | DEV/QA | PRE/PRO |
|---------|--------|---------|
| Vault HA | No | Sí (3 nodos Raft) |
| Auto-unseal | No | Sí (Azure Key Vault) |
| Rotación secrets | Manual | Automática (90 días) |
| TLS | Opcional | Obligatorio |
| Audit logs | Opcional | Obligatorio |

### 1. Configuración Vault PRO

**`bootstrap-prod.yml`:**

```yaml
spring:
  cloud:
    vault:
      enabled: true
      uri: https://vault-prod.sbtech.es:8200
      authentication: KUBERNETES
      kubernetes:
        role: signature-router-prod
        service-account-token-file: /var/run/secrets/kubernetes.io/serviceaccount/token
      kv:
        enabled: true
        backend: secret
        default-context: signature-router-prod
      ssl:
        trust-store: classpath:vault-truststore.jks
        trust-store-password: ${VAULT_TRUSTSTORE_PASSWORD}
      fail-fast: true  # No arrancar si Vault no disponible
```

### 2. Política Vault (Least Privilege)

```hcl
# vault-policy-signature-router-prod.hcl
path "secret/data/signature-router-prod" {
  capabilities = ["read"]
}

path "secret/data/signature-router-prod/*" {
  capabilities = ["read"]
}

# Denegar escritura explícitamente
path "secret/data/signature-router-prod" {
  capabilities = ["deny"]
  denied_parameters = {
    "*" = []
  }
}
```

### 3. Secrets con Rotación Automática

Para secrets que requieren rotación (API keys, tokens):

```yaml
# Vault dynamic secrets (futuro - Epic 5)
spring:
  cloud:
    vault:
      database:
        enabled: true
        role: signature-router-db-role
        backend: postgres-prod
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (ejemplo)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. Obtener secrets de Vault
      - name: Import Secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: ${{ secrets.VAULT_URL }}
          method: jwt
          role: github-actions-role
          secrets: |
            secret/data/signature-router-${{ env.ENVIRONMENT }} keycloak_client_id | KEYCLOAK_CLIENT_ID ;
            secret/data/signature-router-${{ env.ENVIRONMENT }} keycloak_client_secret | KEYCLOAK_CLIENT_SECRET ;
            secret/data/signature-router-${{ env.ENVIRONMENT }} auth_secret | AUTH_SECRET

      # 2. Crear Kubernetes Secret
      - name: Create K8s Secrets
        run: |
          kubectl create secret generic signature-router-admin-secrets \
            --from-literal=AUTH_SECRET="${AUTH_SECRET}" \
            --from-literal=KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID}" \
            --from-literal=KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET}" \
            --dry-run=client -o yaml | kubectl apply -f -

      # 3. Deploy Backend
      - name: Deploy Backend
        run: |
          kubectl apply -k k8s/overlays/${{ env.ENVIRONMENT }}/

      # 4. Deploy Frontend
      - name: Deploy Frontend
        run: |
          kubectl set image deployment/signature-router-admin \
            frontend=ghcr.io/singular-bank/signature-router-admin:${{ github.sha }}
```

### Azure DevOps (ejemplo)

```yaml
# azure-pipelines.yml
trigger:
  - main
  - develop

variables:
  - group: signature-router-secrets-$(Environment)

stages:
  - stage: Deploy
    jobs:
      - deployment: DeployToK8s
        environment: $(Environment)
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: 'createSecret'
                    secretType: 'generic'
                    secretName: 'signature-router-admin-secrets'
                    secretArguments: |
                      --from-literal=AUTH_SECRET=$(AUTH_SECRET)
                      --from-literal=KEYCLOAK_CLIENT_ID=$(KEYCLOAK_CLIENT_ID)
                      --from-literal=KEYCLOAK_CLIENT_SECRET=$(KEYCLOAK_CLIENT_SECRET)

                - task: KubernetesManifest@0
                  inputs:
                    action: 'deploy'
                    manifests: 'k8s/overlays/$(Environment)/'
```

---

## ✅ Verificación del Despliegue

### 1. Health Checks

```bash
# Backend
curl https://signature-router-dev.sbtech.es/actuator/health

# Vault connectivity
curl https://signature-router-dev.sbtech.es/actuator/health/vault

# Frontend
curl https://signature-router-admin-dev.sbtech.es/api/health
```

### 2. Verificar autenticación

1. Acceder al frontend: `https://signature-router-admin-dev.sbtech.es`
2. Login con usuario de Active Directory
3. Verificar que el dashboard carga datos del backend

### 3. Logs

```bash
# Backend logs
kubectl logs -f deployment/signature-router -n signature-router-dev

# Frontend logs
kubectl logs -f deployment/signature-router-admin -n signature-router-dev
```

---

## ⏪ Rollback

### Rollback rápido

```bash
# Ver historial de deployments
kubectl rollout history deployment/signature-router

# Rollback a versión anterior
kubectl rollout undo deployment/signature-router

# Rollback a versión específica
kubectl rollout undo deployment/signature-router --to-revision=3
```

### Rollback de secrets en Vault

```bash
# Ver versiones del secret
vault kv metadata get secret/signature-router-dev

# Rollback a versión anterior
vault kv rollback -version=2 secret/signature-router-dev
```

---

## 📚 Referencias

- [Vault Secrets Management](./development/vault-secrets.md) - Documentación detallada de Vault
- [Guía de Arranque Keycloak](./GUIA-ARRANQUE-KEYCLOAK.md) - Desarrollo local
- [Keycloak Configuration](./keycloak/) - Configuración de Keycloak

---

**Última actualización:** 2025-12-05  
**Contacto:** Equipo de DevOps / Infraestructura para solicitar accesos y credenciales
