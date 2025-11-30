# ⏳ STORY 8.5: VAULT SECRET ROTATION - PARTIAL IMPLEMENTATION

**Epic:** 8 - Security & Compliance  
**Story:** 8.5 - Vault Secret Rotation  
**Status:** ⏳ **PARCIALMENTE IMPLEMENTADA** (10%)  
**Start Date:** 2025-11-29  
**Story Points:** 5 SP  
**Priority:** HIGH  

---

## 📊 **Estado de Implementación: 10%**

Story 8.5 requiere **infraestructura Vault avanzada** (dynamic secrets, PostgreSQL database engine) que excede el alcance de la sesión actual. Se ha creado el **domain port interface** como base para futura implementación.

---

## ✅ **Componentes Implementados (1 archivo)**

1. ✅ `SecretRotationService.java` - Domain port interface

---

## ⏳ **Componentes Pendientes (Infraestructura Vault Requerida)**

### **Vault Infrastructure (No disponible actualmente):**

**1. Vault PostgreSQL Database Engine**
```bash
# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/signature-router \
  plugin_name=postgresql-database-plugin \
  allowed_roles="signature-router-role" \
  connection_url="postgresql://{{username}}:{{password}}@localhost:5432/signature_router" \
  username="vault_admin" \
  password="vault_admin_password"

# Create role with 90-day TTL
vault write database/roles/signature-router-role \
  db_name=signature-router \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="2160h" \
  max_ttl="8760h"
```

**2. Spring Cloud Vault @RefreshScope**
```java
@Configuration
@RefreshScope
public class DataSourceConfig {
    
    @Value("${spring.cloud.vault.database.role}")
    private String vaultDatabaseRole;
    
    @Bean
    @RefreshScope
    public DataSource dataSource(VaultTemplate vaultTemplate) {
        // Read dynamic credentials from Vault
        VaultResponse response = vaultTemplate.read("database/creds/" + vaultDatabaseRole);
        String username = (String) response.getData().get("username");
        String password = (String) response.getData().get("password");
        
        return DataSourceBuilder.create()
            .url("jdbc:postgresql://localhost:5432/signature_router")
            .username(username)
            .password(password)
            .build();
    }
}
```

**3. Vault Lease Renewal**
```yaml
spring:
  cloud:
    vault:
      config:
        lifecycle:
          enabled: true
          min-renewal: 300s  # 5 min
          expiry-threshold: 600s  # 10 min
      database:
        enabled: true
        role: signature-router-role
        backend: database
```

**4. Secret Rotation Event Listener**
```java
@Component
@RequiredArgsConstructor
public class SecretRotationEventListener {
    
    private final AuditService auditService;
    
    @EventListener
    public void onLeaseRenewed(VaultLeaseRenewalEvent event) {
        auditService.log(new AuditEvent(
            AuditEventType.SECRET_ROTATED,
            "VAULT_SECRET",
            null,
            AuditAction.UPDATE,
            "vault-auto-rotation",
            "SYSTEM",
            Map.of(
                "leaseId", event.getSource().getLeaseId(),
                "ttl", event.getSource().getLeaseDuration().getSeconds()
            ),
            null,
            null,
            MDC.get("traceId")
        ));
    }
}
```

**5. Pseudonymization Key Rotation (Manual)**
```java
@Service
@RequiredArgsConstructor
public class VaultSecretRotationServiceImpl implements SecretRotationService {
    
    private final VaultTemplate vaultTemplate;
    private final AuditService auditService;
    
    @Override
    public int rotatePseudonymizationKey() {
        // Generate new 256-bit HMAC key
        byte[] newKey = new byte[32];
        new SecureRandom().nextBytes(newKey);
        String newKeyHex = HexFormat.of().formatHex(newKey);
        
        // Get current version
        int currentVersion = getCurrentKeyVersion();
        int newVersion = currentVersion + 1;
        
        // Store new key in Vault KV v2
        Map<String, Object> data = Map.of(
            "key", newKeyHex,
            "version", newVersion,
            "created_at", Instant.now().toString(),
            "expires_at", Instant.now().plus(97, ChronoUnit.DAYS).toString() // 90 days + 7 grace
        );
        
        vaultTemplate.write(
            "secret/data/signature-router/pseudonymization-key-v" + newVersion,
            data
        );
        
        // Log rotation
        auditService.log(new AuditEvent(
            AuditEventType.SECRET_ROTATED,
            "PSEUDONYMIZATION_KEY",
            null,
            AuditAction.UPDATE,
            "system",
            "SYSTEM",
            Map.of("oldVersion", currentVersion, "newVersion", newVersion),
            null,
            null,
            MDC.get("traceId")
        ));
        
        return newVersion;
    }
    
    @Override
    public int getCurrentKeyVersion() {
        // Read current version from Vault metadata
        VaultResponse response = vaultTemplate.read("secret/metadata/signature-router/pseudonymization-key");
        return response != null ? (int) response.getData().get("current_version") : 1;
    }
    
    @Override
    public boolean isRotationDue() {
        VaultResponse response = vaultTemplate.read("secret/data/signature-router/pseudonymization-key");
        if (response == null) return false;
        
        String createdAtStr = (String) response.getData().get("created_at");
        Instant createdAt = Instant.parse(createdAtStr);
        Instant rotationDue = createdAt.plus(90, ChronoUnit.DAYS);
        
        return Instant.now().isAfter(rotationDue);
    }
}
```

**6. Scheduled Rotation Job**
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class SecretRotationScheduler {
    
    private final SecretRotationService secretRotationService;
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void checkAndRotateSecrets() {
        log.info("Checking if secret rotation is due...");
        
        if (secretRotationService.isRotationDue()) {
            log.warn("Secret rotation is DUE. Initiating rotation...");
            
            try {
                int newVersion = secretRotationService.rotatePseudonymizationKey();
                log.info("✅ Secret rotated successfully to version {}", newVersion);
            } catch (Exception e) {
                log.error("❌ Secret rotation FAILED: {}", e.getMessage(), e);
                // TODO: Send alert to monitoring system (Prometheus, PagerDuty)
            }
        } else {
            log.info("Secret rotation not due yet.");
        }
    }
}
```

**7. Prometheus Metrics**
```java
@Component
@RequiredArgsConstructor
public class SecretRotationMetrics {
    
    private final MeterRegistry meterRegistry;
    
    public void recordRotationSuccess(int newVersion) {
        meterRegistry.counter("vault.secret.rotation.success",
            "version", String.valueOf(newVersion)
        ).increment();
    }
    
    public void recordRotationFailure(String reason) {
        meterRegistry.counter("vault.secret.rotation.failures.total",
            "reason", reason
        ).increment();
    }
}
```

**8. Integration Tests**
```java
@SpringBootTest
@ActiveProfiles("test")
public class SecretRotationIntegrationTest {
    
    @Autowired
    private SecretRotationService secretRotationService;
    
    @Test
    @DisplayName("Should rotate pseudonymization key and increment version")
    void shouldRotateKey() {
        // Given
        int currentVersion = secretRotationService.getCurrentKeyVersion();
        
        // When
        int newVersion = secretRotationService.rotatePseudonymizationKey();
        
        // Then
        assertThat(newVersion).isEqualTo(currentVersion + 1);
    }
    
    @Test
    @DisplayName("Should detect when rotation is due (90 days)")
    void shouldDetectRotationDue() {
        // Requires time manipulation or mocking
        // Testcontainers with Vault required
    }
}
```

---

## 📋 **Acceptance Criteria Status**

| AC# | Criterio | Status | Blocker |
|-----|----------|--------|---------|
| AC1 | Vault dynamic secrets configurados | ❌ BLOCKED | Requiere Vault PostgreSQL engine |
| AC2 | Spring Cloud Vault @RefreshScope | ❌ BLOCKED | Requiere Vault dynamic secrets |
| AC3 | Config refresh cada 5 minutos | ❌ BLOCKED | Requiere AC2 |
| AC4 | Grace period de 7 días | ❌ BLOCKED | Requiere versioned secrets en Vault |
| AC5 | Audit log de rotaciones | ⏳ PARTIAL | Domain interface creado, impl pending |
| AC6 | Alerting si rotación falla | ❌ BLOCKED | Requiere Prometheus integration |
| AC7 | Integration tests | ❌ BLOCKED | Requiere Testcontainers + Vault |

**Completion:** 0/7 AC completados (AC5 parcial)

---

## 🚧 **Blockers**

### **1. Vault Infrastructure Not Available**

**Requerido:**
- HashiCorp Vault server con PostgreSQL database engine
- Vault admin credentials para configurar dynamic secrets
- PostgreSQL admin user (`vault_admin`) con permisos para crear roles dinámicos

**Alternativa (Future):**
- Usar Testcontainers con Vault image para development
- Vault en Kubernetes (Helm chart) para UAT/Prod

### **2. Spring Cloud Vault Dependency Missing**

**Requerido:**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-vault-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-vault-config-databases</artifactId>
</dependency>
```

### **3. DataSource Dynamic Configuration**

Actualmente `DataSource` está configurado con credenciales estáticas en `application-local.yml`. Migrar a Vault dynamic secrets requiere refactoring significativo.

---

## 🎯 **Recomendación**

**Story 8.5 requiere infraestructura Vault avanzada** que no está disponible actualmente. Opciones:

### **Opción A: Posponer Story 8.5 (Recomendado)**
- Marcar como `blocked` hasta tener Vault infrastructure
- Continuar con Story 8.6 (TLS Certificate Management) o 8.8 (Security Headers)
- Retomar Story 8.5 en siguiente sprint con Vault setup completo

### **Opción B: Implementación Parcial (Solo Pseudonymization Key)**
- Implementar rotación manual de pseudonymization key (sin dynamic secrets)
- Usar Vault KV v2 versioned secrets
- Grace period manual (mantener v1 y v2 simultáneamente)
- **Tiempo estimado:** 4-6 horas
- **Limitación:** No rota DB credentials (requiere dynamic secrets)

### **Opción C: Setup Vault Infrastructure First**
- Configurar Vault server (Docker/Testcontainers)
- Enable PostgreSQL database engine
- Configurar dynamic secrets
- **Tiempo estimado:** 8-12 horas (incluye learning curve)

---

## 📊 **Impacto en Epic 8**

Si Story 8.5 se marca como **blocked**:

```
Epic 8 Progress (sin 8.5):
✅ 8.1 OAuth2 Resource Server  100%
✅ 8.2 RBAC                    100%
✅ 8.3 Pseudonymization        100%
✅ 8.4 Audit Log               100%
🚧 8.5 Vault Secret Rotation   BLOCKED (Vault infra required)
⬜ 8.6 TLS Certificate Mgmt      0%
✅ 8.7 Rate Limiting           100%
⬜ 8.8 Security Headers          0%

Progress: 4/8 stories (50%) - 26/36 SP (72%)
```

**Compliance Impact:**
- PCI-DSS Req 8.3.9 (Password rotation): ⏳ Parcialmente cubierto por OAuth2 JWT TTL
- SOC 2 CC6.1 (Access security): ✅ Cubierto por Stories 8.1-8.4

---

## 💡 **Sugerencia**

**Marcar Story 8.5 como `blocked`** y continuar con:
- **Story 8.6:** TLS Certificate Management (3 SP, más factible)
- **Story 8.8:** Security Headers Configuration (2 SP, más factible)

Completar Story 8.5 en un sprint futuro cuando Vault infrastructure esté disponible.

---

**Story Status:** 🚧 **BLOCKED** (10% complete, Vault infra required)  
**Blocker:** HashiCorp Vault PostgreSQL database engine not configured  
**Estimated Time to Complete (con infra):** 8-12 horas  

---

*Análisis completado: 2025-11-29*  
*Mode: YOLO (Pragmatic Assessment)*

