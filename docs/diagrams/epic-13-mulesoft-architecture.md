# Epic 13: MuleSoft Integration - Architecture Diagrams

**Fecha:** 5 de diciembre de 2025

---

## 🏗️ Arquitectura General

```mermaid
flowchart TB
    subgraph Admin["Admin Portal (Next.js)"]
        UI[Provider Management UI]
    end
    
    subgraph Backend["Signature Router (Spring Boot)"]
        API[Provider Catalog API]
        Sync[Provider Sync Service]
        Selection[Provider Selection Service]
        Client[MuleSoft Client]
        DB[(PostgreSQL<br/>provider_catalog)]
    end
    
    subgraph MuleSoft["MuleSoft ESB"]
        Gateway[API Gateway]
        Routes[Provider Routes]
    end
    
    subgraph Providers["External Providers"]
        Twilio[Twilio SMS/Voice]
        AWS[AWS SNS]
        FCM[Firebase FCM]
        Veridas[Veridas Biometric]
    end
    
    UI -->|REST API| API
    API --> Sync
    API --> Selection
    Sync -->|Scheduled| Client
    Selection --> Client
    API --> DB
    Sync --> DB
    Selection --> DB
    
    Client -->|HTTPS| Gateway
    Gateway --> Routes
    
    Routes -->|SMS/Voice| Twilio
    Routes -->|SMS| AWS
    Routes -->|Push| FCM
    Routes -->|Biometric| Veridas
    
    style Admin fill:#e1f5ff
    style Backend fill:#fff4e1
    style MuleSoft fill:#ffe1f5
    style Providers fill:#e1ffe1
```

---

## 🔄 Flujo de Sincronización

```mermaid
sequenceDiagram
    participant Scheduler
    participant SyncService
    participant MuleSoftClient
    participant MuleSoft
    participant Database
    
    Note over Scheduler: Every 5 minutes
    Scheduler->>SyncService: @Scheduled trigger
    SyncService->>MuleSoftClient: listAvailableProviders()
    MuleSoftClient->>MuleSoft: GET /api/v1/signature/providers
    MuleSoft-->>MuleSoftClient: List<MuleSoftProviderDto>
    
    loop For each provider
        SyncService->>Database: findByMuleSoftProviderId(id)
        alt Provider exists
            SyncService->>Database: UPDATE status, endpoint, last_sync_at
        else New provider
            SyncService->>Database: INSERT new provider (enabled=false)
        end
    end
    
    SyncService-->>Scheduler: Sync completed
    
    Note over Database: Catalog updated
```

---

## 💚 Flujo de Health Check

```mermaid
sequenceDiagram
    participant Scheduler
    participant SyncService
    participant MuleSoftClient
    participant MuleSoft
    participant Database
    
    Note over Scheduler: Every 1 minute
    Scheduler->>SyncService: healthCheckEnabledProviders()
    SyncService->>Database: findByEnabled(true)
    Database-->>SyncService: List<EnabledProviders>
    
    loop For each enabled provider
        SyncService->>MuleSoftClient: checkProviderHealth(providerId)
        MuleSoftClient->>MuleSoft: GET /providers/{id}/health
        MuleSoft-->>MuleSoftClient: HealthStatus
        SyncService->>Database: UPDATE health_status, last_health_check_at
    end
    
    SyncService-->>Scheduler: Health checks completed
```

---

## 📤 Flujo de Envío con Fallback

```mermaid
flowchart TD
    Start([Send Challenge]) --> GetProviders[Get enabled providers<br/>ordered by priority]
    GetProviders --> Check{Any providers<br/>available?}
    
    Check -->|No| Error[Throw NoProviderAvailableException]
    Check -->|Yes| TryProvider1[Try Provider 1<br/>priority=1]
    
    TryProvider1 --> Send1[MuleSoft.sendChallenge]
    Send1 --> Success1{Success?}
    
    Success1 -->|Yes| Return1[Return ProviderResult.success]
    Success1 -->|No| Log1[Log: Provider 1 failed]
    
    Log1 --> CheckNext1{More providers?}
    CheckNext1 -->|No| AllFailed[Throw AllProvidersFailedException]
    CheckNext1 -->|Yes| TryProvider2[Try Provider 2<br/>priority=2]
    
    TryProvider2 --> Send2[MuleSoft.sendChallenge]
    Send2 --> Success2{Success?}
    
    Success2 -->|Yes| Return2[Return ProviderResult.success<br/>with fallback flag]
    Success2 -->|No| Log2[Log: Provider 2 failed]
    
    Log2 --> CheckNext2{More providers?}
    CheckNext2 -->|No| AllFailed
    CheckNext2 -->|Yes| Continue[Continue with next...]
    
    style Start fill:#90EE90
    style Return1 fill:#90EE90
    style Return2 fill:#FFA500
    style Error fill:#FF6B6B
    style AllFailed fill:#FF6B6B
```

---

## 🖥️ Admin UI - User Flow

```mermaid
flowchart LR
    Start([Admin accede a<br/>Provider Management]) --> Load[GET /api/v1/admin/providers]
    
    Load --> Display[Mostrar catálogo<br/>agrupado por tipo]
    
    Display --> Actions{Acción del admin}
    
    Actions -->|Sync manual| Sync[POST /providers/sync]
    Actions -->|Enable provider| Enable[PUT /providers/{id}/enable]
    Actions -->|Disable provider| Disable[PUT /providers/{id}/disable]
    Actions -->|Change priority| Priority[PUT /providers/{id}/priority]
    Actions -->|Check health| Health[GET /providers/{id}/health]
    
    Sync --> Reload[Reload UI]
    Enable --> Reload
    Disable --> Reload
    Priority --> Reload
    Health --> ShowHealth[Mostrar estado de salud]
    
    Reload --> Display
    ShowHealth --> Display
    
    style Start fill:#e1f5ff
    style Display fill:#fff4e1
    style Sync fill:#90EE90
    style Enable fill:#90EE90
    style Disable fill:#FF6B6B
    style Priority fill:#FFA500
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    PROVIDER_CATALOG {
        uuid id PK
        varchar mulesoft_provider_id UK "ID en MuleSoft"
        varchar provider_name "Nombre display"
        varchar provider_type "SMS|PUSH|VOICE|BIOMETRIC"
        varchar mulesoft_endpoint "URL endpoint"
        varchar mulesoft_status "available|configured|down"
        boolean enabled "Control local"
        integer priority "Fallback order"
        integer timeout_seconds
        integer retry_max_attempts
        varchar health_status "healthy|unhealthy|unknown"
        timestamptz last_health_check_at
        timestamptz last_sync_at
        timestamptz created_at
        timestamptz updated_at
        varchar updated_by
    }
```

---

## 🔐 Security Flow

```mermaid
sequenceDiagram
    participant Admin
    participant AdminPortal
    participant Backend
    participant MuleSoft
    
    Admin->>AdminPortal: Login (OAuth2)
    AdminPortal->>Backend: Request with JWT
    Backend->>Backend: Validate JWT + Check ADMIN role
    
    alt Authorized
        Backend->>MuleSoft: Request with Client Credentials
        MuleSoft->>MuleSoft: Validate client_id + client_secret
        MuleSoft-->>Backend: Provider data
        Backend-->>AdminPortal: Response
        AdminPortal-->>Admin: Display data
    else Unauthorized
        Backend-->>AdminPortal: 403 Forbidden
        AdminPortal-->>Admin: Access Denied
    end
```

---

## 📊 Component Interaction

```mermaid
graph TD
    subgraph Controllers["REST Controllers"]
        ProviderCatalogController
    end
    
    subgraph Services["Application Services"]
        ProviderCatalogService
        ProviderSyncService
        ProviderSelectionService
    end
    
    subgraph Clients["External Clients"]
        MuleSoftProviderClient
    end
    
    subgraph Repositories["Data Access"]
        ProviderCatalogRepository
    end
    
    subgraph Entities["Domain Entities"]
        ProviderCatalog
    end
    
    ProviderCatalogController --> ProviderCatalogService
    ProviderCatalogController --> ProviderSyncService
    
    ProviderCatalogService --> MuleSoftProviderClient
    ProviderCatalogService --> ProviderCatalogRepository
    
    ProviderSyncService --> MuleSoftProviderClient
    ProviderSyncService --> ProviderCatalogRepository
    
    ProviderSelectionService --> MuleSoftProviderClient
    ProviderSelectionService --> ProviderCatalogRepository
    
    ProviderCatalogRepository --> ProviderCatalog
    
    style Controllers fill:#e1f5ff
    style Services fill:#fff4e1
    style Clients fill:#ffe1f5
    style Repositories fill:#e1ffe1
    style Entities fill:#ffe1e1
```

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph K8S["Kubernetes Cluster"]
        subgraph Pods["Signature Router Pods"]
            Pod1[Pod 1<br/>Sync enabled]
            Pod2[Pod 2<br/>Sync enabled]
            Pod3[Pod 3<br/>Sync enabled]
        end
        
        Service[K8S Service<br/>Load Balancer]
        
        Pod1 --> Service
        Pod2 --> Service
        Pod3 --> Service
    end
    
    subgraph External["External Services"]
        MuleSoft[MuleSoft ESB<br/>api.mulesoft.singular.com]
        DB[(PostgreSQL<br/>provider_catalog)]
    end
    
    Service -->|HTTPS| MuleSoft
    Pod1 -->|JDBC| DB
    Pod2 -->|JDBC| DB
    Pod3 -->|JDBC| DB
    
    Note1[Note: Sync ejecuta en todos los pods<br/>pero usa DB lock para evitar duplicados]
    
    style K8S fill:#e1f5ff
    style External fill:#fff4e1
```

---

## 📈 State Diagram - Provider Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Detected: Provider creado en MuleSoft
    Detected --> Synced: Sync automático<br/>(enabled=false)
    Synced --> Enabled: Admin enable
    Enabled --> Healthy: Health check OK
    Enabled --> Unhealthy: Health check FAIL
    Healthy --> Unhealthy: Health check FAIL
    Unhealthy --> Healthy: Health check OK
    Enabled --> Disabled: Admin disable
    Disabled --> Enabled: Admin enable
    Disabled --> [*]: Provider eliminado en MuleSoft
    
    note right of Detected
        Provider existe en MuleSoft
        pero no en Signature Router
    end note
    
    note right of Synced
        Provider visible en Admin UI
        pero deshabilitado
    end note
    
    note right of Enabled
        Provider disponible para uso
        Health checks activos
    end note
```

---

## 🔄 Data Flow - Provider Configuration

```mermaid
flowchart LR
    subgraph MuleSoft["MuleSoft (Source of Truth)"]
        MS_Config[Provider Config]
        MS_Creds[Credentials]
    end
    
    subgraph SignatureRouter["Signature Router"]
        Sync[Sync Service]
        DB[(provider_catalog)]
        Selection[Selection Logic]
    end
    
    subgraph AdminPortal["Admin Portal"]
        UI[Management UI]
        LocalConfig[Local Settings:<br/>- enabled<br/>- priority]
    end
    
    MS_Config -->|Sync every 5min| Sync
    Sync -->|Update| DB
    DB -->|Read| UI
    UI -->|Update local config| LocalConfig
    LocalConfig -->|Save| DB
    DB -->|Read for selection| Selection
    Selection -->|Use enabled providers| MS_Config
    
    MS_Creds -.->|Never synced| SignatureRouter
    
    style MuleSoft fill:#ffe1f5
    style SignatureRouter fill:#fff4e1
    style AdminPortal fill:#e1f5ff
```

---

**Documento creado:** 5 de diciembre de 2025  
**Última actualización:** 5 de diciembre de 2025  
**Owner:** Architecture Team
