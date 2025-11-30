# Story 3.7: Provider Health Check Endpoint

**Status:** ✅ Ready for Review  
**Epic:** Epic 3 - Multi-Provider Integration  
**Sprint:** Sprint 3  
**Story Points:** 2

---

## 📋 Story Description

**As a** Operations Engineer / SRE  
**I want** REST API dedicado para health checks de providers con detalles técnicos y métricas  
**So that** Puedo monitorear disponibilidad de providers, integrar con monitoring tools, y troubleshoot issues rápidamente

---

## 🎯 Business Value

Crea un endpoint REST `/api/v1/admin/providers/health` que complementa Spring Actuator con:

- **Detailed Health Info**: Status + latency + error rates + last check timestamp por provider
- **Admin API**: Separated from `/actuator` (production firewall rules)
- **Troubleshooting**: Detailed error messages, retry counts, circuit breaker status
- **Monitoring Integration**: JSON response fácil de parsear (Prometheus, Grafana, Datadog)
- **On-Demand Checks**: Force refresh (bypass cache) vía query param `?refresh=true`
- **Security**: ROLE_ADMIN required (Spring Security)

---

## ✅ Acceptance Criteria

- [ ] **AC1:** Endpoint GET `/api/v1/admin/providers/health` creado
- [ ] **AC2:** Response JSON con array de providers: name, type, status (UP/DOWN), details
- [ ] **AC3:** Cada provider incluye: lastCheckTimestamp, latencyMs, errorMessage (si DOWN)
- [ ] **AC4:** Query param `?refresh=true` fuerza health check inmediato (bypass cache)
- [ ] **AC5:** Default behavior: usa cached health status (30s TTL de cada provider)
- [ ] **AC6:** Security: `@PreAuthorize("hasRole('ADMIN')")` requerido
- [ ] **AC7:** HTTP 200 siempre (incluso si todos DOWN) - status en JSON body
- [ ] **AC8:** HTTP 401 si no autenticado, HTTP 403 si no ROLE_ADMIN
- [ ] **AC9:** Response incluye aggregated status: overallStatus (UP/DEGRADED/DOWN)
- [ ] **AC10:** OpenAPI docs en `/swagger-ui.html` con ejemplos
- [ ] **AC11:** Unit tests para controller (4+ tests)
- [ ] **AC12:** Integration test con TestRestTemplate (@SpringBootTest)

---

## 🏗️ Tasks

### Task 1: Create ProviderHealthResponse DTOs
**Estimated:** 30min

#### Subtasks:
1. [ ] Crear ProviderHealthResponse record con fields:
   - name (String)
   - type (ProviderType enum)
   - status (HealthStatus.Status: UP/DOWN)
   - details (String)
   - lastCheckTimestamp (Instant)
   - latencyMs (Long, nullable)
   - errorMessage (String, nullable)
2. [ ] Crear AggregatedHealthResponse record con:
   - overallStatus (String: UP/DEGRADED/DOWN)
   - providers (List<ProviderHealthResponse>)
   - timestamp (Instant)
3. [ ] Add Jackson annotations para JSON serialization
4. [ ] JavaDoc completo

**Files to Create:**
- `src/main/java/com/bank/signature/application/dto/response/ProviderHealthResponse.java`
- `src/main/java/com/bank/signature/application/dto/response/AggregatedHealthResponse.java`

---

### Task 2: Create ProviderHealthService
**Estimated:** 45min

#### Subtasks:
1. [ ] Crear ProviderHealthService interface
2. [ ] Method: `AggregatedHealthResponse getProvidersHealth(boolean forceRefresh)`
3. [ ] Implementation: ProviderHealthServiceImpl
4. [ ] Inject ApplicationContext para discover providers
5. [ ] Si forceRefresh=false: Call provider.checkHealth() (usa cache interno de cada provider)
6. [ ] Si forceRefresh=true: Invalidar cache (future enhancement, por ahora ignora cache)
7. [ ] Measure latency de cada health check (Timer.Sample)
8. [ ] Construir ProviderHealthResponse por cada provider
9. [ ] Determinar overallStatus: UP (all up), DEGRADED (some down), DOWN (all down)
10. [ ] Return AggregatedHealthResponse

**Files to Create:**
- `src/main/java/com/bank/signature/application/service/ProviderHealthService.java` (interface)
- `src/main/java/com/bank/signature/application/service/ProviderHealthServiceImpl.java` (implementation)

---

### Task 3: Create ProviderHealthController
**Estimated:** 30min

#### Subtasks:
1. [ ] Crear ProviderHealthController
2. [ ] Endpoint: GET `/api/v1/admin/providers/health`
3. [ ] @PreAuthorize("hasRole('ADMIN')")
4. [ ] Query param: @RequestParam(defaultValue = "false") boolean refresh
5. [ ] Call providerHealthService.getProvidersHealth(refresh)
6. [ ] Return ResponseEntity<AggregatedHealthResponse> HTTP 200
7. [ ] OpenAPI annotations: @Operation, @ApiResponse, @Parameter
8. [ ] Example responses en @ApiResponse

**Files to Create:**
- `src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/admin/ProviderHealthController.java`

---

### Task 4: Unit Tests - Service Layer
**Estimated:** 45min

#### Subtasks:
1. [ ] Crear ProviderHealthServiceImplTest
2. [ ] Test: getProvidersHealth_whenAllUp_shouldReturnUp()
3. [ ] Test: getProvidersHealth_whenAllDown_shouldReturnDown()
4. [ ] Test: getProvidersHealth_whenSomeDown_shouldReturnDegraded()
5. [ ] Test: getProvidersHealth_whenForceRefresh_shouldCallProviders()
6. [ ] Mock ApplicationContext, SignatureProviderPort beans
7. [ ] Verify ProviderHealthResponse construction
8. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/application/service/ProviderHealthServiceImplTest.java`

---

### Task 5: Unit Tests - Controller Layer
**Estimated:** 30min

#### Subtasks:
1. [ ] Crear ProviderHealthControllerTest
2. [ ] Test: getHealth_shouldReturnAggregatedHealth()
3. [ ] Test: getHealth_withRefreshTrue_shouldForceRefresh()
4. [ ] Test: getHealth_withoutAdminRole_shouldReturn403()
5. [ ] Test: getHealth_unauthenticated_shouldReturn401()
6. [ ] Mock ProviderHealthService
7. [ ] Usar @WebMvcTest para controller tests
8. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/adapter/inbound/rest/admin/ProviderHealthControllerTest.java`

---

### Task 6: Integration Tests
**Estimated:** 30min

#### Subtasks:
1. [ ] Crear ProviderHealthEndpointIntegrationTest
2. [ ] @SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
3. [ ] Test: GET /api/v1/admin/providers/health con ROLE_ADMIN → HTTP 200
4. [ ] Test: GET con refresh=true → HTTP 200
5. [ ] Test: GET sin auth → HTTP 401
6. [ ] Test: GET con ROLE_USER (no ADMIN) → HTTP 403
7. [ ] Verify JSON response structure (overallStatus, providers array)
8. [ ] Ejecutar tests y verificar PASS

**Files to Create:**
- `src/test/java/com/bank/signature/infrastructure/adapter/inbound/rest/admin/ProviderHealthEndpointIntegrationTest.java`

---

### Task 7: Update Documentation
**Estimated:** 30min

#### Subtasks:
1. [ ] Actualizar README.md con endpoint usage:
   - curl examples
   - Response structure
   - Query params
   - Authentication
2. [ ] Actualizar CHANGELOG.md
3. [ ] OpenAPI annotations completas

**Files to Modify:**
- `README.md`
- `CHANGELOG.md`

---

## 📐 Architecture Context

### Provider Health Check Flow

```
Client (Admin)
   ↓ GET /api/v1/admin/providers/health?refresh=true
ProviderHealthController
   ↓ @PreAuthorize("hasRole('ADMIN')")
   ↓ providerHealthService.getProvidersHealth(refresh)
ProviderHealthServiceImpl
   ↓ discover all SignatureProviderPort beans
   ↓ for each provider:
   │   ↓ checkHealth(providerType)
   │   ↓ measure latency
   │   ↓ build ProviderHealthResponse
   ↓ aggregate: UP/DEGRADED/DOWN
   ↓ return AggregatedHealthResponse
ProviderHealthController
   ↓ ResponseEntity<AggregatedHealthResponse> HTTP 200
Client (Admin)
```

### Response Structure

```json
{
  "overallStatus": "DEGRADED",
  "timestamp": "2025-11-27T10:30:00Z",
  "providers": [
    {
      "name": "smsProvider",
      "type": "SMS",
      "status": "UP",
      "details": "Twilio SMS operational",
      "lastCheckTimestamp": "2025-11-27T10:29:45Z",
      "latencyMs": 120,
      "errorMessage": null
    },
    {
      "name": "pushProvider",
      "type": "PUSH",
      "status": "UP",
      "details": "FCM Push operational",
      "lastCheckTimestamp": "2025-11-27T10:29:45Z",
      "latencyMs": 85,
      "errorMessage": null
    },
    {
      "name": "voiceProvider",
      "type": "VOICE",
      "status": "DOWN",
      "details": "Voice provider disabled",
      "lastCheckTimestamp": "2025-11-27T10:29:45Z",
      "latencyMs": 5,
      "errorMessage": "Provider disabled via configuration"
    },
    {
      "name": "biometricProvider",
      "type": "BIOMETRIC",
      "status": "DOWN",
      "details": "Biometric provider disabled",
      "lastCheckTimestamp": "2025-11-27T10:29:45Z",
      "latencyMs": 3,
      "errorMessage": "Provider disabled via configuration"
    }
  ]
}
```

### Controller Example

```java
@RestController
@RequestMapping("/api/v1/admin/providers")
@RequiredArgsConstructor
@Slf4j
public class ProviderHealthController {
    
    private final ProviderHealthService providerHealthService;
    
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get provider health status",
        description = "Returns health status of all signature providers (SMS, Push, Voice, Biometric)"
    )
    @ApiResponse(responseCode = "200", description = "Health status retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required")
    @ApiResponse(responseCode = "403", description = "Forbidden - ROLE_ADMIN required")
    public ResponseEntity<AggregatedHealthResponse> getProvidersHealth(
        @RequestParam(defaultValue = "false") 
        @Parameter(description = "Force refresh (bypass cache)")
        boolean refresh
    ) {
        log.info("Provider health check requested (refresh={})", refresh);
        AggregatedHealthResponse health = providerHealthService.getProvidersHealth(refresh);
        return ResponseEntity.ok(health);
    }
}
```

---

## 🔗 Dependencies

### Prerequisites
- ✅ **Story 3.6**: ProviderHealthIndicator (reutiliza lógica similar)
- ✅ **Story 3.1-3.5**: Todos los providers implementados

### Enables
- ⏭️ **Monitoring Integration**: Prometheus scraping, Grafana dashboards
- ⏭️ **Alerting**: PagerDuty, Opsgenie integration
- ⏭️ **Epic 4**: Circuit Breaker status en health response

---

## 🧪 Test Strategy

### Unit Tests
- **Service Layer**: Mock providers, verify aggregation logic
- **Controller Layer**: Mock service, verify HTTP responses + security

### Integration Tests
- **Full Stack**: @SpringBootTest, TestRestTemplate
- **Security**: Test ROLE_ADMIN enforcement (401, 403 scenarios)
- **Response Validation**: Verify JSON structure

**Target Coverage:** > 85%

---

## 📝 Dev Notes

### Differences from Spring Actuator `/actuator/health/providers`

**Actuator Endpoint:**
- Purpose: Infrastructure health (K8s probes, load balancers)
- Audience: Platform (automated systems)
- Response: Spring Health format (status, components)
- Security: Often public (liveness) or basic auth

**Admin API Endpoint (`/api/v1/admin/providers/health`):**
- Purpose: Operations monitoring, troubleshooting
- Audience: Humans (SRE, ops engineers)
- Response: Custom JSON with latency, error details, timestamps
- Security: ROLE_ADMIN required (OAuth2 JWT)
- Features: Force refresh, detailed error messages, aggregated metrics

### Cache Strategy

**Default (refresh=false):**
- Uses cached health status from each provider (30s TTL)
- Fast response (~10ms)
- Good for dashboard polling

**Force Refresh (refresh=true):**
- Bypasses cache (calls provider.checkHealth() directly)
- Slower response (~200-500ms depending on providers)
- Use for troubleshooting, after config changes

**Future Enhancement:**
- Cache invalidation API: POST `/api/v1/admin/providers/{name}/invalidate-cache`
- Per-provider refresh: GET `/api/v1/admin/providers/{name}/health?refresh=true`

---

## 🎯 Definition of Done

- [ ] **Code Complete**: Controller + Service + DTOs implementados
- [ ] **Tests Passing**: Unit tests (8+) + Integration test (4+) PASS
- [ ] **Coverage**: > 85%
- [ ] **Security**: ROLE_ADMIN enforcement working (401, 403 tests)
- [ ] **OpenAPI Docs**: Swagger UI muestra endpoint con ejemplos
- [ ] **Response Format**: JSON válido con overallStatus + providers array
- [ ] **Query Param**: refresh=true funciona (fuerza health check)
- [ ] **Error Handling**: HTTP 200 siempre (status en body, no HTTP status code)
- [ ] **Documentation**: README con curl examples, CHANGELOG actualizado
- [ ] **Integration**: Endpoint funcional end-to-end

---

## 📚 References

**Spring Security @PreAuthorize:**
- https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html

**OpenAPI Annotations:**
- https://springdoc.org/#spring-webmvc-support

**Spring Actuator Health:**
- https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints.health

---

**Story Created:** 2025-11-27  
**Previous Story:** 3.6 - Provider Configuration Management  
**Next Story:** 3.8 - Provider Timeout Configuration

