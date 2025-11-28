# ADR-003: MuleSoft Integration as API Gateway for Provider Communication

**Status:** Accepted  
**Date:** 2025-11-28  
**Deciders:** Architecture Team, Signature Router Team  
**Technical Story:** Epic 3 - Multi-Provider Integration

---

## Context and Problem Statement

El **Signature Router** necesita integrarse con múltiples providers externos (Twilio SMS/Voice, Firebase Cloud Messaging, Biometric APIs). La organización planea centralizar todas las integraciones externas a través de **MuleSoft API Gateway**.

**Pregunta clave:** ¿Cómo integrar providers externos minimizando acoplamiento y permitiendo migración sin impacto cuando MuleSoft esté disponible?

---

## Decision Drivers

### Business Drivers
- **Estandarización:** Todas las aplicaciones de la organización deben usar MuleSoft para integraciones externas
- **Governance:** Control centralizado de costos, rate limiting, compliance
- **Time-to-Market:** MVP debe estar operativo antes de que MuleSoft API esté lista

### Technical Drivers
- **Desacoplamiento:** Minimizar dependencias a SDKs externos
- **Testabilidad:** Facilitar testing sin dependencias externas
- **Resiliencia:** Circuit breakers, retries, timeouts independientes de providers
- **Observabilidad:** Métricas consistentes independiente del mecanismo de integración

---

## Considered Options

### Option 1: Esperar a MuleSoft (⛔ REJECTED)

**Descripción:** No implementar nada hasta que MuleSoft API Gateway esté disponible.

**Pros:**
- ✅ Zero rework (implementación directa final)
- ✅ No código legacy a eliminar

**Cons:**
- ❌ **Bloqueo de MVP:** 3-6 meses de retraso esperando MuleSoft specs
- ❌ No delivery de valor al negocio
- ❌ Dependencia externa crítica (MuleSoft team bandwidth)
- ❌ No feedback temprano de usuarios

**Decisión:** **REJECTED** - Impacto en time-to-market inaceptable.

---

### Option 2: Conectores Directos con Re-work Futuro (⚠️ ANTI-PATTERN)

**Descripción:** Implementar conectores directos sin abstracción, luego refactorizar todo cuando MuleSoft esté listo.

```java
// ANTI-PATTERN: Acoplamiento directo
public class CreateSignatureUseCase {
    private TwilioClient twilioClient;  // ❌ Acoplamiento
    
    public void execute() {
        twilioClient.sendSms(...);  // ❌ Lógica de negocio acoplada a SDK
    }
}
```

**Pros:**
- ✅ Rápido de implementar (corto plazo)

**Cons:**
- ❌ **Rework masivo:** Cambios en domain layer, use cases, tests
- ❌ Alto riesgo de introducir bugs en migración
- ❌ Testing complejo (acoplamiento a SDKs)
- ❌ Viola principios SOLID (Dependency Inversion)

**Decisión:** **REJECTED** - Technical debt inaceptable.

---

### Option 3: Hexagonal Architecture con Adapter Pattern (✅ SELECTED)

**Descripción:** Implementar abstracción `SignatureProvider` (port), con adapters intercambiables (direct providers ahora, MuleSoft después).

```java
// ✅ CLEAN ARCHITECTURE
public interface SignatureProvider {  // Port (domain)
    ProviderResult sendChallenge(SignatureChallenge challenge, ChallengeRecipient recipient);
}

// ✅ Adapter temporal (infrastructure)
@Service
@ConditionalOnProperty(name = "providers.twilio.enabled", havingValue = "true")
public class TwilioSmsProvider implements SignatureProvider {
    // Implementation using Twilio SDK
}

// ✅ Adapter futuro (infrastructure)
@Service
@ConditionalOnProperty(name = "providers.mulesoft.enabled", havingValue = "true")
public class MuleSoftApiProvider implements SignatureProvider {
    // Implementation using REST calls to MuleSoft
}
```

**Pros:**
- ✅ **Zero impacto en domain/use cases** durante migración
- ✅ **Plug & Play:** Solo cambiar adapter, no lógica de negocio
- ✅ Testabilidad: mocks simples, no SDKs reales
- ✅ Flexibilidad: múltiples adapters activos simultáneamente (canary deployment)
- ✅ Cumple principios SOLID (Dependency Inversion, Open/Closed)
- ✅ MVP rápido + migración sin riesgo

**Cons:**
- ⚠️ Código temporal se eliminará (TwilioSmsProvider, FcmPushProvider)
- ⚠️ Pequeño overhead de abstracción

**Decisión:** **SELECTED** ✅

---

## Decision Outcome

### Chosen Option: **Hexagonal Architecture con Adapter Pattern**

**Estrategia de implementación:**

#### Phase 1: MVP (Current - Sprint 1-5) ✅
```
SignatureProvider (Port Interface)
    ↓
├── TwilioSmsProvider (Adapter)
├── TwilioVoiceProvider (Adapter)
├── FcmPushProvider (Adapter)
└── BiometricStubProvider (Adapter)
```

**Status:** IMPLEMENTED ✅

#### Phase 2: MuleSoft Integration (Future - TBD)
```
SignatureProvider (Port Interface)
    ↓
└── MuleSoftApiProvider (Single Adapter)
        ↓
    MuleSoft API Gateway
        ↓
    External Providers (Twilio, FCM, etc.)
```

**Status:** PENDING (waiting for MuleSoft API specs)

#### Phase 3: Migration (Canary Deployment)
```
SignatureProvider (Port Interface)
    ↓
├── [DEPRECATED] TwilioSmsProvider (10% traffic)
└── [NEW] MuleSoftApiProvider (90% traffic)
```

**Status:** PLANNED

#### Phase 4: Cleanup
```
SignatureProvider (Port Interface)
    ↓
└── MuleSoftApiProvider (100% traffic)

DELETE:
├── ❌ TwilioSmsProvider
├── ❌ TwilioVoiceProvider
├── ❌ FcmPushProvider
└── ❌ BiometricStubProvider
```

**Status:** PLANNED

---

## Consequences

### Positive Consequences

#### Business Impact
- ✅ **Time-to-Market:** MVP operativo en Sprint 5 (no bloqueado por MuleSoft)
- ✅ **Zero Downtime Migration:** Canary deployment permite rollback sin impacto
- ✅ **Risk Mitigation:** Arquitectura validada con providers reales antes de MuleSoft

#### Technical Impact
- ✅ **Maintainability:** Clean separation domain/infrastructure
- ✅ **Testability:** 95%+ coverage sin dependencias externas
- ✅ **Flexibility:** Soporte multi-provider simultáneo (A/B testing)
- ✅ **Resilience:** Circuit Breaker, Retry, Timeout independientes de provider implementation

### Negative Consequences

#### Short-term
- ⚠️ **Code Disposal:** ~2000 LOC (adapters) serán eliminados en Phase 4
  - **Mitigación:** Código temporal bien documentado, bajo costo de desarrollo (≈3 sprints)
- ⚠️ **Dependency Management:** SDKs temporales (Twilio, Firebase)
  - **Mitigación:** Isolated en infrastructure layer, fácil cleanup

#### Long-term
- ✅ No negative consequences (architecture is future-proof)

---

## Compliance and Alignment

### Enterprise Architecture Alignment
- ✅ **API Gateway Strategy:** Migración a MuleSoft alineada con estrategia enterprise
- ✅ **Hexagonal Architecture:** Patrón aprobado por Architecture Review Board
- ✅ **Zero Trust Security:** MuleSoft maneja autenticación, Signature Router valida tokens

### Regulatory Compliance
- ✅ **PCI-DSS:** SMS OTP cumple requisitos MFA
- ✅ **GDPR:** PII handling via MuleSoft (centralized DPO oversight)
- ✅ **SOC 2:** Audit logs en MuleSoft + Signature Router

---

## Implementation Notes

### Feature Flags Strategy

```yaml
# application.yml
providers:
  # Phase 1: MVP (current)
  twilio:
    enabled: true
  push:
    enabled: true
  
  # Phase 2: MuleSoft (future)
  mulesoft:
    enabled: false  # Flip when MuleSoft ready
    canary-percentage: 0
```

### Metrics Continuity

**Garantía:** Mismas métricas Prometheus independiente del adapter.

```java
// ✅ Metrics tracked in adapter layer (transparent to domain)
providerMetrics.recordProviderCall(
    provider,
    channelType,
    result,
    duration
);
```

**Métricas conservadas:**
- `provider.calls.total{provider, status}`
- `provider.latency{provider, status}`
- `provider.error.rate{provider}`
- `circuit_breaker.state{provider}`

### Rollback Strategy

**If MuleSoft integration fails:**
1. Flip feature flag: `providers.mulesoft.enabled: false`
2. Re-enable legacy providers: `providers.twilio.enabled: true`
3. Zero code changes required (adapters remain in codebase during transition)
4. Rollback time: < 5 minutes (config change only)

---

## Related Decisions

- **ADR-001:** Hexagonal Architecture for Domain Isolation
- **ADR-002:** Resilience4j for Circuit Breaker Pattern
- **ADR-004:** Prometheus for Observability (pending)

---

## References

- [MuleSoft Integration Strategy](../08-mulesoft-integration-strategy.md)
- [Provider Abstraction Design](../04-provider-abstraction.md)
- [Hexagonal Architecture Overview](../01-hexagonal-architecture.md)
- [Epic 3: Multi-Provider Integration](../../sprint-artifacts/epic-3-multi-provider-integration.md)

---

**ADR Status Workflow:**
1. **Proposed** → Discussion ongoing
2. **Accepted** → Decision finalized (current status)
3. **Implemented** → Code deployed (Phase 1 ✅)
4. **Deprecated** → Replaced by newer ADR
5. **Superseded** → Replaced by ADR-XXX

---

**Approval:**
- ✅ Architecture Review Board: Approved 2025-11-28
- ✅ Tech Lead (Signature Router): Approved
- ✅ MuleSoft Integration Team: Acknowledged

**Review Schedule:** Review migration to Phase 2 when MuleSoft API specs available (ETA: Q1 2026)

