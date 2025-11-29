# Story 9.6: SLO Compliance Reporting & Error Budget Tracking

**Status:** drafted  
**Epic:** Epic 9 - Observability & SLO Tracking  
**Sprint:** Sprint 9  
**Story Points:** 5  
**Created:** 2025-11-29

---

## 📋 Story Description

**As a** SRE Team & Engineering Management  
**I want** Automated SLO error budget calculation, weekly/monthly compliance reports, and stakeholder dashboards  
**So that** Puedo monitorear cumplimiento de SLOs (≥99.9% availability, P99 <300ms), planificar releases basado en error budget remaining, y generar reports ejecutivos para stakeholders bancarios

---

## 🎯 Business Value

Implementa **SLO compliance tracking & error budget management** que permite:

- **Error Budget Management**: Calcular error budget remaining en tiempo real (0.1% failed requests allowed = 43 min/month downtime)
- **Release Planning**: Decidir si hay budget suficiente para deployments riesgosos (freeze releases si budget <20%)
- **Executive Reporting**: Weekly/monthly SLO reports automatizados para management (PDF/Email)
- **Incident Impact Quantification**: Medir impacto de incidents en error budget (¿cuánto budget consumió el incident?)
- **SLO Breach History**: Tracking histórico de SLO violations para identificar patrones
- **Proactive SLO Management**: Alertas cuando error budget <50% (warning), <20% (critical)

**NFR Mapping**:
- **NFR-O10**: SLO tracking ✅
- **NFR-O11**: Error budget calculation ✅
- **NFR-A1**: 99.9% availability SLO ✅
- **NFR-P1**: P99 < 300ms SLO ✅

**Business Impact**:
- **Contract Compliance**: Evita penalizaciones contractuales por incumplimiento de SLAs bancarios ($50K-$200K/incident)
- **Release Velocity**: Permite deployments frecuentes mientras se cumple SLO (error budget como "safety margin")
- **Executive Visibility**: Management puede ver SLO compliance en reports semanales
- **Customer Satisfaction**: 99.9% uptime mejora NPS (Net Promoter Score) bancario
- **Incident Prioritization**: Cuantifica impacto de incidents en error budget (prioriza fixes críticos)

---

## ✅ Acceptance Criteria

### AC1: SLO Calculator Service - Error Budget Calculation

**Given** SLOCalculator service está implementado  
**When** calculo error budget para el mes actual  
**Then** obtengo SLO report con:
- Total requests del mes
- Failed requests (5xx errors)
- Availability actual (%)
- Error budget allowed (0.1% = 43 min/month)
- Error budget consumed (%)
- Error budget remaining (%)
- SLO status (COMPLIANT / AT_RISK / VIOLATED)

**Validation:**
```java
SLOReport report = sloCalculator.calculateMonthly(YearMonth.now());

assertThat(report.getAvailability()).isGreaterThanOrEqualTo(0.999); // 99.9%
assertThat(report.getErrorBudgetRemaining()).isGreaterThan(0); // Positive budget
assertThat(report.getSloStatus()).isEqualTo(SLOStatus.COMPLIANT);
```

**File:** `SLOCalculator.java`
```java
@Service
public class SLOCalculator {
    
    @Autowired
    private PrometheusQueryService prometheusQueryService;
    
    public SLOReport calculateMonthly(YearMonth month) {
        // Query Prometheus for total requests in month
        double totalRequests = prometheusQueryService.query(
            "sum(increase(http_server_requests_seconds_count[30d]))"
        );
        
        // Query Prometheus for failed requests (5xx)
        double failedRequests = prometheusQueryService.query(
            "sum(increase(http_server_requests_seconds_count{status=~\"5..\"}[30d]))"
        );
        
        // Calculate availability
        double availability = totalRequests > 0 
            ? 1.0 - (failedRequests / totalRequests)
            : 1.0;
        
        // Error budget: 0.1% (99.9% SLO = 0.1% failures allowed)
        double errorBudgetAllowed = 0.001;
        double errorBudgetConsumed = failedRequests / totalRequests;
        double errorBudgetRemaining = errorBudgetAllowed - errorBudgetConsumed;
        
        // Determine SLO status
        SLOStatus status;
        if (errorBudgetRemaining > 0.0005) { // >50% remaining
            status = SLOStatus.COMPLIANT;
        } else if (errorBudgetRemaining > 0.0002) { // >20% remaining
            status = SLOStatus.AT_RISK;
        } else {
            status = SLOStatus.VIOLATED;
        }
        
        return SLOReport.builder()
            .month(month)
            .totalRequests((long) totalRequests)
            .failedRequests((long) failedRequests)
            .availability(availability)
            .errorBudgetAllowed(errorBudgetAllowed)
            .errorBudgetConsumed(errorBudgetConsumed)
            .errorBudgetRemaining(errorBudgetRemaining)
            .sloStatus(status)
            .build();
    }
    
    public SLOReport calculateWeekly(LocalDate weekStart) {
        // Similar logic for weekly period (7 days)
        // Error budget: 0.1% of weekly requests = ~6 minutes downtime/week
        // ...
    }
}
```

---

### AC2: Prometheus Query Service - PromQL Integration

**Given** PrometheusQueryService está implementado  
**When** ejecuto query PromQL contra Prometheus  
**Then** obtengo resultado numérico parseado

**Validation:**
```java
double result = prometheusQueryService.query(
    "sum(increase(http_server_requests_seconds_count[1h]))"
);

assertThat(result).isGreaterThan(0);
```

**File:** `PrometheusQueryService.java`
```java
@Service
public class PrometheusQueryService {
    
    @Value("${prometheus.url:http://localhost:9090}")
    private String prometheusUrl;
    
    private final RestTemplate restTemplate;
    
    public double query(String promql) {
        String url = prometheusUrl + "/api/v1/query?query=" + 
            URLEncoder.encode(promql, StandardCharsets.UTF_8);
        
        ResponseEntity<PrometheusResponse> response = 
            restTemplate.getForEntity(url, PrometheusResponse.class);
        
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new PrometheusQueryException("Query failed: " + response.getStatusCode());
        }
        
        PrometheusResponse body = response.getBody();
        if (body == null || body.getData() == null || body.getData().getResult().isEmpty()) {
            return 0.0;
        }
        
        // Parse result: [timestamp, value]
        List<Object> resultArray = body.getData().getResult().get(0).getValue();
        String valueStr = resultArray.get(1).toString();
        
        return Double.parseDouble(valueStr);
    }
}
```

---

### AC3: Weekly SLO Report Scheduler - Automated Reports

**Given** SLOReportScheduler está configurado con cron job  
**When** llega el lunes 9:00 AM  
**Then** se genera reporte SLO semanal automáticamente  
**And** se envía email a stakeholders

**Validation:**
```java
// Manual test: Trigger scheduler method
sloReportScheduler.generateWeeklySLOReport();

// Verify email sent (mock email service)
verify(emailService).sendSLOReport(any(SLOReport.class), eq("sre-team@bank.com"));
```

**File:** `SLOReportScheduler.java`
```java
@Service
@EnableScheduling
public class SLOReportScheduler {
    
    @Autowired
    private SLOCalculator sloCalculator;
    
    @Autowired
    private SLOReportService sloReportService;
    
    @Autowired
    private EmailService emailService;
    
    @Scheduled(cron = "0 0 9 * * MON") // Every Monday at 9:00 AM
    public void generateWeeklySLOReport() {
        log.info("Generating weekly SLO report...");
        
        LocalDate weekStart = LocalDate.now().minusWeeks(1).with(DayOfWeek.MONDAY);
        SLOReport report = sloCalculator.calculateWeekly(weekStart);
        
        // Generate PDF report
        byte[] pdfReport = sloReportService.generatePDF(report);
        
        // Send email to stakeholders
        emailService.sendSLOReport(
            report,
            pdfReport,
            List.of("sre-team@bank.com", "management@bank.com")
        );
        
        log.info("Weekly SLO report sent successfully. Status: {}", report.getSloStatus());
    }
    
    @Scheduled(cron = "0 0 9 1 * *") // First day of month at 9:00 AM
    public void generateMonthlySLOReport() {
        log.info("Generating monthly SLO report...");
        
        YearMonth previousMonth = YearMonth.now().minusMonths(1);
        SLOReport report = sloCalculator.calculateMonthly(previousMonth);
        
        byte[] pdfReport = sloReportService.generatePDF(report);
        
        emailService.sendSLOReport(
            report,
            pdfReport,
            List.of("sre-team@bank.com", "management@bank.com", "executives@bank.com")
        );
        
        log.info("Monthly SLO report sent successfully. Status: {}", report.getSloStatus());
    }
}
```

---

### AC4: SLO Report Service - PDF Report Generation

**Given** SLOReportService está implementado  
**When** genero PDF report a partir de SLOReport  
**Then** obtengo PDF con:
- Executive summary (SLO status, availability %, error budget %)
- Charts (availability trend, error budget consumption)
- Incident history table (SLO breaches del período)
- Recommendations (si SLO violated: action items)

**Validation:**
```java
SLOReport report = createMockReport();
byte[] pdf = sloReportService.generatePDF(report);

assertThat(pdf).isNotEmpty();
assertThat(pdf).startsWith(new byte[] {0x25, 0x50, 0x44, 0x46}); // PDF header "%PDF"
```

**File:** `SLOReportService.java`
```java
@Service
public class SLOReportService {
    
    public byte[] generatePDF(SLOReport report) {
        // Use iText or similar library to generate PDF
        // Include:
        // - Cover page with SLO summary
        // - Availability chart (line graph)
        // - Error budget gauge
        // - Incident table (if any SLO breaches)
        // - Recommendations section
        
        return pdfBytes;
    }
    
    public String generateMarkdown(SLOReport report) {
        return String.format("""
            # SLO Compliance Report
            
            **Period:** %s
            **Status:** %s
            
            ## Summary
            - **Availability:** %.4f%% (Target: ≥99.9%%)
            - **Total Requests:** %,d
            - **Failed Requests:** %,d
            - **Error Budget Remaining:** %.2f%% (of 0.1%%)
            
            ## Recommendations
            %s
            """,
            report.getMonth(),
            report.getSloStatus(),
            report.getAvailability() * 100,
            report.getTotalRequests(),
            report.getFailedRequests(),
            report.getErrorBudgetRemaining() * 100,
            getRecommendations(report)
        );
    }
    
    private String getRecommendations(SLOReport report) {
        if (report.getSloStatus() == SLOStatus.VIOLATED) {
            return """
                ⚠️ **CRITICAL:** SLO violated this period.
                - Freeze non-critical deployments
                - Focus on stability improvements
                - Review incident postmortems
                - Add preventive monitoring
                """;
        } else if (report.getSloStatus() == SLOStatus.AT_RISK) {
            return """
                ⚠️ **WARNING:** Error budget below 50%.
                - Reduce deployment frequency
                - Test thoroughly before releases
                - Monitor error rates closely
                """;
        } else {
            return """
                ✅ **HEALTHY:** SLO compliance maintained.
                - Continue current practices
                - Safe to deploy new features
                """;
        }
    }
}
```

---

### AC5: Grafana SLO Compliance Dashboard - Stakeholder Visibility

**Given** Grafana dashboard `slo-compliance.json` existe  
**When** abro dashboard en Grafana  
**Then** veo 6 panels:
1. **Error Budget Remaining (Gauge)** - % remaining (green >50%, yellow >20%, red <20%)
2. **Availability Trend (30 days)** - Line graph con threshold line a 99.9%
3. **Performance P99 Trend (30 days)** - Line graph con threshold line a 300ms
4. **SLO Breach History (Table)** - Incidents con: fecha, duración, impacto en error budget
5. **Error Budget Consumption Rate** - Burn rate (how fast we're consuming budget)
6. **Time to Error Budget Exhaustion** - Predicción de cuándo se agotará budget si continúa el burn rate actual

**Validation:**
```bash
# Access Grafana
open http://localhost:3000/d/slo-compliance

# Verify dashboard exists
curl -u admin:admin http://localhost:3000/api/search?query=slo-compliance | jq
```

**File:** `observability/grafana/dashboards/slo-compliance.json`

---

### AC6: SLO Status Endpoint - REST API

**Given** REST endpoint `/api/v1/slo/status` está implementado  
**When** hago GET request  
**Then** obtengo JSON con SLO status actual

**Validation:**
```bash
curl http://localhost:8080/api/v1/slo/status | jq

# Expected output:
{
  "month": "2025-11",
  "availability": 0.9995,
  "errorBudgetRemaining": 0.0005,
  "sloStatus": "COMPLIANT",
  "lastUpdated": "2025-11-29T10:00:00Z"
}
```

**File:** `SLOController.java`
```java
@RestController
@RequestMapping("/api/v1/slo")
public class SLOController {
    
    @Autowired
    private SLOCalculator sloCalculator;
    
    @GetMapping("/status")
    public ResponseEntity<SLOReport> getSLOStatus() {
        SLOReport report = sloCalculator.calculateMonthly(YearMonth.now());
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/status/weekly")
    public ResponseEntity<SLOReport> getWeeklySLOStatus() {
        LocalDate weekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        SLOReport report = sloCalculator.calculateWeekly(weekStart);
        return ResponseEntity.ok(report);
    }
}
```

---

### AC7: Incident Postmortem Template - Documentation

**Given** template `INCIDENT_POSTMORTEM_TEMPLATE.md` existe  
**When** ocurre incident que viola SLO  
**Then** SRE team usa template para documentar postmortem  
**And** template incluye sección para calcular error budget consumed

**Validation:**
```bash
# Verify template exists
cat docs/observability/INCIDENT_POSTMORTEM_TEMPLATE.md

# Template should include:
# - Incident timeline
# - Root cause analysis
# - Error budget impact calculation
# - Action items with owners
# - Lessons learned
```

**File:** `docs/observability/INCIDENT_POSTMORTEM_TEMPLATE.md`

---

### AC8: Error Budget Alert Rules - Proactive Warnings

**Given** Prometheus alert rules están configurados  
**When** error budget remaining < 50%  
**Then** alert `ErrorBudgetLow` se dispara (warning)  
**When** error budget remaining < 20%  
**Then** alert `ErrorBudgetCritical` se dispara (critical)

**Validation:**
```bash
# Check alerts in Prometheus
curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | select(.name == "slo-error-budget")'
```

**File:** `observability/prometheus/alerts/slo-error-budget-alerts.yml`
```yaml
groups:
  - name: slo-error-budget-alerts
    interval: 60s
    rules:
      - alert: ErrorBudgetLow
        expr: |
          (
            sum(increase(http_server_requests_seconds_count{status=~"5.."}[30d]))
            /
            sum(increase(http_server_requests_seconds_count[30d]))
          ) > 0.0005  # 50% of 0.1% budget consumed
        for: 10m
        labels:
          severity: warning
          team: sre
        annotations:
          summary: "Error Budget Below 50%"
          description: |
            Error budget remaining is below 50%.
            Current consumption: {{ $value | humanizePercentage }}
            Recommendation: Reduce deployment frequency and focus on stability.
          
      - alert: ErrorBudgetCritical
        expr: |
          (
            sum(increase(http_server_requests_seconds_count{status=~"5.."}[30d]))
            /
            sum(increase(http_server_requests_seconds_count[30d]))
          ) > 0.0008  # 80% of 0.1% budget consumed (only 20% remaining)
        for: 10m
        labels:
          severity: critical
          team: sre
        annotations:
          summary: "Error Budget CRITICAL - Below 20%"
          description: |
            Error budget remaining is below 20%.
            Current consumption: {{ $value | humanizePercentage }}
            IMMEDIATE ACTION REQUIRED:
            - Freeze all non-critical deployments
            - Review and fix recent incidents
            - Escalate to Engineering Manager
```

---

### AC9: SLO Report History Storage - Audit Trail

**Given** SLO reports se generan semanalmente  
**When** report es generado  
**Then** se guarda en tabla `slo_reports` para historical tracking

**Validation:**
```sql
SELECT * FROM slo_reports 
WHERE month = '2025-11' 
ORDER BY created_at DESC;

-- Expected columns:
-- id, month, total_requests, failed_requests, availability, 
-- error_budget_remaining, slo_status, created_at
```

**File:** `SLOReport.java` (JPA entity)
```java
@Entity
@Table(name = "slo_reports")
public class SLOReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private YearMonth month;
    
    private Long totalRequests;
    private Long failedRequests;
    
    private Double availability;
    private Double errorBudgetAllowed;
    private Double errorBudgetConsumed;
    private Double errorBudgetRemaining;
    
    @Enumerated(EnumType.STRING)
    private SLOStatus sloStatus;
    
    private Instant createdAt;
    
    // Getters, setters, builder
}
```

**Migration:** `db/changelog/0030_slo_reports_table.yaml`

---

### AC10: Unit Tests - SLO Calculator Logic

**Given** SLOCalculator tests están implementados  
**When** ejecuto `mvn test -Dtest=SLOCalculatorTest`  
**Then** todos los tests pasan (100%)

**Test Coverage:**
- `testCalculateMonthly_CompliantSLO()` - Happy path con 99.95% availability
- `testCalculateMonthly_AtRiskSLO()` - 30% error budget remaining
- `testCalculateMonthly_ViolatedSLO()` - 99.85% availability (SLO violated)
- `testCalculateMonthly_ZeroRequests()` - Edge case: no traffic
- `testCalculateMonthly_AllFailures()` - Edge case: 100% error rate
- `testCalculateWeekly()` - Weekly calculation logic

**File:** `SLOCalculatorTest.java`

---

### AC11: Integration Tests - Prometheus Integration

**Given** Integration test está implementado  
**When** ejecuto `mvn test -Dtest=SLOIntegrationTest`  
**Then** test valida:
- Prometheus query service conecta correctamente
- PromQL queries retornan resultados válidos
- SLO calculation usa datos reales de Prometheus

**File:** `SLOIntegrationTest.java`

---

## 🏗️ Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│             Prometheus Metrics Store                    │
│  - http_server_requests_seconds_count{status="5.."}    │
│  - 30 days retention                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ PromQL Query
                         ▼
┌─────────────────────────────────────────────────────────┐
│         PrometheusQueryService                          │
│  - query(promql) → double                              │
│  - HTTP client to Prometheus API                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              SLOCalculator                              │
│  - calculateMonthly(YearMonth) → SLOReport             │
│  - calculateWeekly(LocalDate) → SLOReport              │
│  - Error budget logic (0.1% allowed)                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│         SLOReportScheduler (Cron Jobs)                  │
│  - Monday 9am: Weekly report                           │
│  - 1st of month 9am: Monthly report                    │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│          SLOReportService                               │
│  - generatePDF(SLOReport) → byte[]                     │
│  - generateMarkdown(SLOReport) → String                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│           EmailService                                  │
│  - sendSLOReport(report, recipients)                   │
│  - Attach PDF, send to stakeholders                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Tasks

### Task 1: Create SLOReport Domain Model (30 min)
**Subtasks:**
1. Create `SLOReport.java` DTO/Entity
2. Add fields: month, totalRequests, failedRequests, availability, errorBudget*
3. Add `SLOStatus` enum (COMPLIANT, AT_RISK, VIOLATED)
4. Add builder pattern
5. Add JPA annotations for persistence

### Task 2: Create PrometheusQueryService (1 hora)
**Subtasks:**
1. Create `PrometheusQueryService.java`
2. Add `RestTemplate` configuration
3. Implement `query(String promql)` method
4. Parse JSON response from Prometheus API
5. Handle errors (connection failures, invalid queries)
6. Add unit tests

### Task 3: Create SLOCalculator Service (2 horas)
**Subtasks:**
1. Create `SLOCalculator.java`
2. Inject `PrometheusQueryService`
3. Implement `calculateMonthly(YearMonth)` method
4. Implement `calculateWeekly(LocalDate)` method
5. Add error budget calculation logic (0.1% allowed)
6. Add SLO status determination logic (COMPLIANT/AT_RISK/VIOLATED)
7. Add unit tests (6 test cases)

### Task 4: Create SLOReportService (1.5 horas)
**Subtasks:**
1. Create `SLOReportService.java`
2. Implement `generatePDF(SLOReport)` using iText library
3. Add PDF template (cover page, charts, tables)
4. Implement `generateMarkdown(SLOReport)` for email body
5. Add recommendations logic based on SLO status

### Task 5: Create SLOReportScheduler (1 hora)
**Subtasks:**
1. Create `SLOReportScheduler.java`
2. Enable `@EnableScheduling` in config
3. Add `generateWeeklySLOReport()` with cron: `0 0 9 * * MON`
4. Add `generateMonthlySLOReport()` with cron: `0 0 9 1 * *`
5. Inject dependencies (SLOCalculator, SLOReportService, EmailService)
6. Add logging

### Task 6: Create SLOController REST API (30 min)
**Subtasks:**
1. Create `SLOController.java`
2. Add `/api/v1/slo/status` GET endpoint (monthly)
3. Add `/api/v1/slo/status/weekly` GET endpoint (weekly)
4. Add OpenAPI documentation
5. Add integration test

### Task 7: Create Database Migration for slo_reports Table (30 min)
**Subtasks:**
1. Create `db/changelog/0030_slo_reports_table.yaml`
2. Add table: id, month, total_requests, failed_requests, availability, error_budget_*, slo_status, created_at
3. Add indexes on month, slo_status
4. Test migration

### Task 8: Create Grafana SLO Compliance Dashboard (2 horas)
**Subtasks:**
1. Create `observability/grafana/dashboards/slo-compliance.json`
2. Add panel 1: Error Budget Remaining (Gauge)
3. Add panel 2: Availability Trend (Time Series)
4. Add panel 3: Performance P99 Trend (Time Series)
5. Add panel 4: SLO Breach History (Table) - Query from slo_reports table
6. Add panel 5: Error Budget Burn Rate (Graph)
7. Add panel 6: Time to Budget Exhaustion (Stat panel)

### Task 9: Create Error Budget Alert Rules (30 min)
**Subtasks:**
1. Create `observability/prometheus/alerts/slo-error-budget-alerts.yml`
2. Add alert: `ErrorBudgetLow` (warning, >50% consumed)
3. Add alert: `ErrorBudgetCritical` (critical, >80% consumed)
4. Add annotations with recommendations
5. Test alerts

### Task 10: Create Incident Postmortem Template (30 min)
**Subtasks:**
1. Create `docs/observability/INCIDENT_POSTMORTEM_TEMPLATE.md`
2. Add sections: Timeline, Root Cause, Error Budget Impact, Action Items, Lessons Learned
3. Include example postmortem
4. Add to README.md

### Task 11: Integration Testing (2 horas)
**Subtasks:**
1. Create `SLOIntegrationTest.java`
2. Test Prometheus query service with test data
3. Test SLO calculation end-to-end
4. Test REST API endpoints
5. Test scheduler (manual trigger)
6. Validate PDF generation

### Task 12: Documentation (1 hora)
**Subtasks:**
1. Create `docs/observability/SLO_COMPLIANCE_REPORTING.md`
2. Document error budget concept
3. Document SLO targets (99.9% availability, P99 <300ms)
4. Document report schedule (weekly/monthly)
5. Document alert thresholds
6. Update README.md with SLO reporting section
7. Update CHANGELOG.md

---

## 📂 Files to Create

1. **`SLOReport.java`** (~80 lines) - Domain model/DTO/Entity
2. **`SLOStatus.java`** (~10 lines) - Enum (COMPLIANT, AT_RISK, VIOLATED)
3. **`PrometheusQueryService.java`** (~100 lines) - PromQL query client
4. **`PrometheusResponse.java`** (~50 lines) - DTO for Prometheus API response
5. **`SLOCalculator.java`** (~150 lines) - Error budget calculation logic
6. **`SLOReportService.java`** (~200 lines) - PDF/Markdown generation
7. **`SLOReportScheduler.java`** (~80 lines) - Cron jobs
8. **`SLOController.java`** (~60 lines) - REST API
9. **`db/changelog/0030_slo_reports_table.yaml`** (~40 lines) - Database migration
10. **`observability/grafana/dashboards/slo-compliance.json`** (~500 lines) - Grafana dashboard
11. **`observability/prometheus/alerts/slo-error-budget-alerts.yml`** (~60 lines) - Alert rules
12. **`docs/observability/INCIDENT_POSTMORTEM_TEMPLATE.md`** (~150 lines) - Template
13. **`docs/observability/SLO_COMPLIANCE_REPORTING.md`** (~400 lines) - Documentation
14. **`SLOCalculatorTest.java`** (~250 lines) - Unit tests
15. **`SLOIntegrationTest.java`** (~150 lines) - Integration tests

---

## 📝 Files to Modify

1. **`application.yml`** (+5 lines) - Enable scheduling, Prometheus URL config
2. **`pom.xml`** (+10 lines) - Add iText dependency for PDF generation
3. **`README.md`** (+30 lines) - Add SLO Compliance Reporting section
4. **`CHANGELOG.md`** (+60 lines) - Add Story 9.6 entry

---

## 🧪 Testing Strategy

### Unit Tests
1. **SLOCalculatorTest** (6 tests)
   - Test compliant SLO (99.95% availability)
   - Test at-risk SLO (30% budget remaining)
   - Test violated SLO (99.85% availability)
   - Test zero requests edge case
   - Test all failures edge case
   - Test weekly calculation

2. **PrometheusQueryServiceTest** (3 tests)
   - Test successful query
   - Test connection failure
   - Test invalid PromQL syntax

3. **SLOReportServiceTest** (2 tests)
   - Test PDF generation
   - Test Markdown generation

### Integration Tests
1. **SLOIntegrationTest** (3 tests)
   - Test Prometheus query service with real Prometheus
   - Test SLO calculation end-to-end
   - Test REST API `/api/v1/slo/status`

### Manual Testing
1. **Scheduler Test**: Trigger cron jobs manually, verify email sent
2. **Dashboard Test**: Open Grafana, verify all 6 panels render correctly
3. **Alert Test**: Simulate high error rate, verify `ErrorBudgetLow` alert fires

---

## 📚 Dependencies

- **Story 9.2** (Prometheus Metrics): REQUIRED - metrics must exist
- **Story 9.3** (Grafana Dashboards): REQUIRED - Grafana provisioning must work
- **Story 9.5** (Alertmanager): REQUIRED - Alertmanager must be running for alerts
- **Prometheus**: REQUIRED - running and scraping metrics
- **Email Service** (optional): For automated reports (can use mock for testing)

---

## 🎯 Definition of Done

- [ ] SLOCalculator service implemented with error budget logic
- [ ] PrometheusQueryService integrates with Prometheus API
- [ ] SLOReportScheduler generates weekly/monthly reports
- [ ] SLOReportService generates PDF reports
- [ ] REST API `/api/v1/slo/status` working
- [ ] Database table `slo_reports` created with migration
- [ ] Grafana SLO Compliance dashboard (6 panels) created
- [ ] Error budget alert rules configured (2 alerts)
- [ ] Incident postmortem template created
- [ ] Unit tests: 11+ tests, 85%+ coverage
- [ ] Integration tests: 3+ tests
- [ ] Documentation: SLO_COMPLIANCE_REPORTING.md
- [ ] README.md + CHANGELOG.md updated

**Story Status:** ✅ READY FOR DEVELOPMENT  
**Next Step:** Execute implementation (estimated 5 SP, ~1 week)

