# 🔌 Integración MuleSoft: Arquitectura Plug & Play

**Proyecto:** Signature Router  
**Fecha:** 2025-11-30  
**Autor:** Equipo Signature Router  
**Versión:** 1.0

---

## 📋 Tabla de Contenidos

1. [Contexto y Normativa](#contexto-y-normativa)
2. [Arquitectura Hexagonal](#arquitectura-hexagonal)
3. [Cómo Funciona el Plug & Play](#cómo-funciona-el-plug--play)
4. [Escenarios de Canales Disponibles](#escenarios-de-canales-disponibles)
5. [Agregar Nuevo Canal](#agregar-nuevo-canal)
6. [Quitar Canal Existente](#quitar-canal-existente)
7. [Implementación Técnica](#implementación-técnica)
8. [Ventajas del Diseño](#ventajas-del-diseño)
9. [Decisiones de Arquitectura](#decisiones-de-arquitectura)

---

## 🎯 Contexto y Normativa

### Normativa Corporativa

**REGLA ABSOLUTA:** La organización **EXIGE** que toda comunicación con providers externos (Twilio, Firebase, etc.) se realice **EXCLUSIVAMENTE** a través de **MuleSoft API Gateway** como orquestador EBS.

```
┌─────────────────┐
│ Signature Router│
└────────┬────────┘
         │
         │ ✅ PERMITIDO (única vía)
         ▼
┌─────────────────┐
│  MuleSoft API   │
│    Gateway      │
└────────┬────────┘
         │
         │ MuleSoft se comunica con providers
         ▼
┌─────────────────┐
│ Twilio, Firebase│
│   BioCatch...   │
└─────────────────┘
```

**❌ PROHIBIDO:**
```
┌─────────────────┐
│ Signature Router│────────> Twilio (directo)
└─────────────────┘────────> Firebase (directo)
                  ────────> BioCatch (directo)
```

### Implicación Crítica

**Si MuleSoft NO tiene un canal implementado → Ese canal NO estará disponible en Signature Router**

No hay plan B, no hay fallback, no hay excepciones.

---

## 🏗️ Arquitectura Hexagonal

Signature Router implementa **Hexagonal Architecture (Ports & Adapters)** que permite cambiar providers sin afectar el dominio.

### Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   API REST (Controllers)                │
│              POST /api/v1/signature-requests            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 DOMAIN (Use Cases)                      │
│                                                         │
│  CreateSignatureRequestUseCase                          │
│  ValidateSignatureUseCase                               │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │  SignatureProvider (INTERFACE/PORT)  │ ◄────────────┤ ABSTRACCIÓN
│  │                                      │              │
│  │  + sendChallenge(...)                │              │
│  │  + validateResponse(...)             │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Implementado por...
                         ▼
┌─────────────────────────────────────────────────────────┐
│            ADAPTERS (Implementaciones)                  │
│                                                         │
│  ┌───────────────────────────────────────┐             │
│  │   MuleSoftApiProvider                 │             │
│  │   implements SignatureProvider        │             │
│  │                                       │             │
│  │   - Llama a MuleSoft API Gateway      │             │
│  │   - Maneja SMS, PUSH, VOICE, etc.     │             │
│  │   - Config-driven (YAML)              │             │
│  └───────────────────────────────────────┘             │
│                                                         │
│  Antiguos adapters (DEPRECATED):                       │
│  ┌─ TwilioSmsProvider (ya NO se usa)                   │
│  ┌─ TwilioVoiceProvider (ya NO se usa)                 │
│  ┌─ FcmPushProvider (ya NO se usa)                     │
└─────────────────────────────────────────────────────────┘
```

### Principio Clave: Inversión de Dependencias

El **dominio** (lógica de negocio) **NO DEPENDE** de la infraestructura.

```java
// ❌ MAL - Domain depende de implementación concreta
public class CreateSignatureRequestUseCase {
    private MuleSoftApiProvider provider;  // Acoplamiento fuerte
}

// ✅ BIEN - Domain depende de abstracción
public class CreateSignatureRequestUseCase {
    private SignatureProvider provider;  // Interface - Puede ser cualquier implementación
}
```

**Ventaja:** Podemos cambiar de MuleSoft a otro sistema futuro sin tocar el dominio.

---

## 🔌 Cómo Funciona el Plug & Play

### 1. Interface del Domain (Port)

El dominio define **QUÉ** necesita, no **CÓMO** se implementa:

```java
// Domain Layer - NUNCA CAMBIA
public interface SignatureProvider {
    ProviderResult sendChallenge(
        SignatureChallenge challenge, 
        ChallengeRecipient recipient
    );
    
    ValidationResult validateResponse(
        String challengeId,
        String userResponse
    );
}

public enum ChannelType {
    SMS,
    VOICE,
    PUSH,
    BIOMETRIC
}
```

### 2. Configuración Declarativa (YAML)

Los canales disponibles se definen en **configuración**, no en código:

```yaml
# application.yml
providers:
  mulesoft:
    enabled: true
    base-url: https://mulesoft.company.com/api/v1
    
    # Lista de canales que MuleSoft tiene disponibles
    supported-channels:
      - SMS
      - PUSH
      # VOICE: NO disponible en MuleSoft
      # BIOMETRIC: NO disponible en MuleSoft
    
    endpoints:
      sms: /notifications/sms
      push: /notifications/push
      # voice: NO EXISTE
      # biometric: NO EXISTE
    
    auth:
      type: OAUTH2
      token-url: https://auth.company.com/oauth/token
      client-id: ${MULESOFT_CLIENT_ID}
      client-secret: ${MULESOFT_CLIENT_SECRET}
    
    resilience:
      timeout: 5000ms
      circuit-breaker:
        failure-threshold: 5
        wait-duration: 10s
```

### 3. Adapter Implementación

El adapter **lee la configuración** y valida canales dinámicamente:

```java
@Service
@RequiredArgsConstructor
public class MuleSoftApiProvider implements SignatureProvider {
    
    private final MuleSoftConfig config;
    private final RestTemplate restTemplate;
    
    @Override
    public ProviderResult sendChallenge(
        SignatureChallenge challenge, 
        ChallengeRecipient recipient
    ) {
        ChannelType channelType = challenge.getChannelType();
        
        // ✅ VALIDACIÓN DINÁMICA basada en configuración
        if (!config.getSupportedChannels().contains(channelType)) {
            throw new UnsupportedChannelException(
                String.format(
                    "Channel %s is not supported by MuleSoft. Available channels: %s",
                    channelType,
                    config.getSupportedChannels()
                )
            );
        }
        
        // Construir request según el canal
        String endpoint = buildEndpoint(channelType);
        MuleSoftRequest request = buildRequest(challenge, recipient, channelType);
        
        // Llamar a MuleSoft
        MuleSoftResponse response = restTemplate.postForObject(
            config.getBaseUrl() + endpoint,
            request,
            MuleSoftResponse.class
        );
        
        return mapResponse(response);
    }
    
    private String buildEndpoint(ChannelType channelType) {
        return switch (channelType) {
            case SMS -> config.getEndpoints().get("sms");
            case PUSH -> config.getEndpoints().get("push");
            case VOICE -> throw new UnsupportedChannelException("VOICE not available");
            case BIOMETRIC -> throw new UnsupportedChannelException("BIOMETRIC not available");
        };
    }
    
    private MuleSoftRequest buildRequest(
        SignatureChallenge challenge,
        ChallengeRecipient recipient,
        ChannelType channelType
    ) {
        return switch (channelType) {
            case SMS -> MuleSoftRequest.builder()
                .channel("sms")
                .recipient(recipient.getPhoneNumber())
                .message(challenge.getMessage())
                .build();
                
            case PUSH -> MuleSoftRequest.builder()
                .channel("push")
                .deviceToken(recipient.getDeviceToken())
                .title(challenge.getTitle())
                .body(challenge.getMessage())
                .build();
                
            default -> throw new UnsupportedChannelException(
                "Channel " + channelType + " not implemented"
            );
        };
    }
}
```

### 4. Manejo de Errores en el Domain

El use case captura la excepción y devuelve error al cliente:

```java
@Service
@RequiredArgsConstructor
public class CreateSignatureRequestUseCase {
    
    private final SignatureProvider provider;  // Inyección de MuleSoftApiProvider
    
    public SignatureRequestResponse execute(CreateSignatureRequest request) {
        
        try {
            // Intentar enviar challenge
            ProviderResult result = provider.sendChallenge(challenge, recipient);
            
            // Guardar en BD, continuar flujo...
            
        } catch (UnsupportedChannelException e) {
            // Canal no disponible en MuleSoft
            throw new BusinessException(
                ErrorCode.CHANNEL_NOT_AVAILABLE,
                String.format(
                    "The requested channel %s is not available. Available channels: %s",
                    request.getChannelType(),
                    provider.getSupportedChannels()  // De la config
                ),
                HttpStatus.NOT_IMPLEMENTED  // 501
            );
        } catch (ProviderException e) {
            // MuleSoft falló (503, timeout, etc.)
            throw new BusinessException(
                ErrorCode.PROVIDER_ERROR,
                "Failed to send challenge via MuleSoft: " + e.getMessage(),
                HttpStatus.SERVICE_UNAVAILABLE  // 503
            );
        }
    }
}
```

### 5. Respuesta al Cliente

```http
# Request
POST /api/v1/signature-requests
{
  "channelType": "VOICE",
  "documentId": "DOC-12345",
  "recipient": {
    "phoneNumber": "+34612345678"
  }
}

# Response (si VOICE no está disponible)
HTTP/1.1 501 Not Implemented
Content-Type: application/json

{
  "code": "CHANNEL_NOT_AVAILABLE",
  "message": "The requested channel VOICE is not available. Available channels: [SMS, PUSH]",
  "timestamp": "2025-11-30T10:00:00Z",
  "availableChannels": ["SMS", "PUSH"],
  "requestedChannel": "VOICE"
}
```

---

## 📊 Escenarios de Canales Disponibles

### Escenario 1: MuleSoft tiene SMS y PUSH

```yaml
# application.yml
providers:
  mulesoft:
    supported-channels:
      - SMS
      - PUSH
```

**Resultado:**
- ✅ Requests con `channelType: SMS` → **Funcionan**
- ✅ Requests con `channelType: PUSH` → **Funcionan**
- ❌ Requests con `channelType: VOICE` → **HTTP 501 Not Implemented**
- ❌ Requests con `channelType: BIOMETRIC` → **HTTP 501 Not Implemented**

**Código del domain/adapters:** NO CAMBIA  
**Solo cambia:** `application.yml` + validación en el adapter

---

### Escenario 2: MuleSoft solo tiene SMS

```yaml
# application.yml
providers:
  mulesoft:
    supported-channels:
      - SMS
```

**Resultado:**
- ✅ Requests con `channelType: SMS` → **Funcionan**
- ❌ Requests con `channelType: PUSH` → **HTTP 501 Not Implemented**
- ❌ Requests con `channelType: VOICE` → **HTTP 501 Not Implemented**
- ❌ Requests con `channelType: BIOMETRIC` → **HTTP 501 Not Implemented**

**Acción del proyecto:**
- Actualizar PRD para indicar que solo SMS está disponible
- Remover Epics de PUSH, VOICE, BIOMETRIC (o marcarlas como bloqueadas)
- Comunicar a stakeholders la limitación

---

### Escenario 3: MuleSoft tiene todos los canales

```yaml
# application.yml
providers:
  mulesoft:
    supported-channels:
      - SMS
      - PUSH
      - VOICE
      - BIOMETRIC
```

**Resultado:**
- ✅ Todos los canales funcionan
- ✅ Epic 11 completa sin limitaciones

---

## ➕ Agregar Nuevo Canal

### Situación: MuleSoft implementa VOICE en 3 meses

**Paso 1:** MuleSoft te avisa: "Ya tenemos endpoint de VOICE"

**Paso 2:** Actualizar configuración

```yaml
# application.yml (ANTES)
providers:
  mulesoft:
    supported-channels:
      - SMS
      - PUSH

# application.yml (DESPUÉS)
providers:
  mulesoft:
    supported-channels:
      - SMS
      - PUSH
      - VOICE  # ← NUEVO
    
    endpoints:
      sms: /notifications/sms
      push: /notifications/push
      voice: /notifications/voice  # ← NUEVO
```

**Paso 3:** Actualizar adapter (solo el switch)

```java
private String buildEndpoint(ChannelType channelType) {
    return switch (channelType) {
        case SMS -> config.getEndpoints().get("sms");
        case PUSH -> config.getEndpoints().get("push");
        case VOICE -> config.getEndpoints().get("voice");  // ← Ya no lanza excepción
        case BIOMETRIC -> throw new UnsupportedChannelException("BIOMETRIC not available");
    };
}

private MuleSoftRequest buildRequest(..., ChannelType channelType) {
    return switch (channelType) {
        case SMS -> buildSmsRequest(...);
        case PUSH -> buildPushRequest(...);
        case VOICE -> buildVoiceRequest(...);  // ← NUEVO método
        default -> throw new UnsupportedChannelException(...);
    };
}

private MuleSoftRequest buildVoiceRequest(
    SignatureChallenge challenge,
    ChallengeRecipient recipient
) {
    return MuleSoftRequest.builder()
        .channel("voice")
        .recipient(recipient.getPhoneNumber())
        .message(challenge.getVoiceScript())
        .language("es-ES")
        .build();
}
```

**Paso 4:** Testing

```bash
# Probar endpoint
curl -X POST http://localhost:8080/api/v1/signature-requests \
  -H "Content-Type: application/json" \
  -d '{
    "channelType": "VOICE",
    "documentId": "DOC-12345",
    "recipient": {
      "phoneNumber": "+34612345678"
    }
  }'

# Respuesta esperada: 200 OK (ahora funciona)
```

**Paso 5:** Deploy

```bash
# DEV
mvn spring-boot:run -Dspring.profiles.active=dev

# UAT
./deploy-uat.sh

# PROD (canary deployment)
./deploy-prod-canary.sh --percentage=10
```

### Código Afectado

| Componente | ¿Cambia? | Impacto |
|------------|----------|---------|
| **Domain (Use Cases)** | ❌ NO | Cero impacto |
| **Controllers (API REST)** | ❌ NO | Cero impacto |
| **SignatureProvider interface** | ❌ NO | Cero impacto |
| **application.yml** | ✅ SÍ | Agregar canal a lista + endpoint |
| **MuleSoftApiProvider** | ✅ SÍ | 1 línea en switch + método builder |
| **Tests** | ✅ SÍ | Agregar tests para VOICE |

**Effort estimado:** 2-4 horas (la mayor parte es testing)

---

## ➖ Quitar Canal Existente

### Situación: La organización descontinúa BIOMETRIC

**Paso 1:** Actualizar configuración

```yaml
# application.yml (ANTES)
providers:
  mulesoft:
    supported-channels:
      - SMS
      - PUSH
      - BIOMETRIC

# application.yml (DESPUÉS)
providers:
  mulesoft:
    supported-channels:
      - SMS
      - PUSH
      # - BIOMETRIC  ← REMOVIDO (comentado para histórico)
```

**Paso 2:** Actualizar adapter (opcional - quitar código)

```java
private String buildEndpoint(ChannelType channelType) {
    return switch (channelType) {
        case SMS -> config.getEndpoints().get("sms");
        case PUSH -> config.getEndpoints().get("push");
        // case BIOMETRIC -> config.getEndpoints().get("biometric");  ← REMOVIDO
        default -> throw new UnsupportedChannelException(...);
    };
}
```

> **Nota:** No es necesario quitar el código. La validación `if (!config.getSupportedChannels().contains(channelType))` ya bloquea el canal.

**Paso 3:** Deploy

**Resultado automático:**
- ❌ Requests con `channelType: BIOMETRIC` → **HTTP 501 Not Implemented**

**Paso 4:** Comunicación

```markdown
# BREAKING CHANGE - v2.5.0

## ⚠️ BIOMETRIC Channel Discontinued

As of 2025-12-01, the BIOMETRIC channel is no longer available.

**Impact:**
- API requests with `channelType: BIOMETRIC` will receive `501 Not Implemented`
- Available channels: SMS, PUSH

**Migration:**
- Update your integrations to use SMS or PUSH
- Contact support if you require biometric authentication
```

---

## 💻 Implementación Técnica Completa

### Estructura de Archivos

```
svc-signature-router/
├── src/main/java/com/company/signature/
│   ├── domain/
│   │   ├── model/
│   │   │   ├── SignatureChallenge.java
│   │   │   ├── ChallengeRecipient.java
│   │   │   ├── ChannelType.java  ← ENUM con los 4 canales
│   │   │   └── ProviderResult.java
│   │   ├── port/
│   │   │   └── SignatureProvider.java  ← INTERFACE (puerto)
│   │   └── usecase/
│   │       └── CreateSignatureRequestUseCase.java
│   │
│   ├── infrastructure/
│   │   ├── adapter/
│   │   │   └── provider/
│   │   │       ├── MuleSoftApiProvider.java  ← IMPLEMENTACIÓN
│   │   │       ├── model/
│   │   │       │   ├── MuleSoftRequest.java
│   │   │       │   └── MuleSoftResponse.java
│   │   │       └── config/
│   │   │           └── MuleSoftConfig.java  ← Lee YAML
│   │   │
│   │   └── rest/
│   │       └── SignatureRequestController.java
│   │
│   └── exception/
│       ├── UnsupportedChannelException.java
│       └── ProviderException.java
│
└── src/main/resources/
    ├── application.yml  ← Configuración de canales
    ├── application-dev.yml
    ├── application-uat.yml
    └── application-prod.yml
```

### Código Completo de Componentes Clave

#### 1. ChannelType.java (Domain)

```java
package com.company.signature.domain.model;

public enum ChannelType {
    SMS("sms", "SMS Message"),
    VOICE("voice", "Voice Call"),
    PUSH("push", "Push Notification"),
    BIOMETRIC("biometric", "Biometric Authentication");
    
    private final String code;
    private final String description;
    
    ChannelType(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDescription() {
        return description;
    }
}
```

#### 2. MuleSoftConfig.java (Infrastructure)

```java
package com.company.signature.infrastructure.adapter.provider.config;

import com.company.signature.domain.model.ChannelType;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Data
@Component
@ConfigurationProperties(prefix = "providers.mulesoft")
public class MuleSoftConfig {
    
    /**
     * Indica si MuleSoft está habilitado
     */
    private boolean enabled;
    
    /**
     * URL base de MuleSoft API Gateway
     */
    private String baseUrl;
    
    /**
     * Canales soportados por MuleSoft
     * Solo estos canales estarán disponibles en la aplicación
     */
    private Set<ChannelType> supportedChannels;
    
    /**
     * Endpoints específicos por canal
     */
    private Map<String, String> endpoints;
    
    /**
     * Configuración de autenticación
     */
    private AuthConfig auth;
    
    /**
     * Configuración de resiliencia
     */
    private ResilienceConfig resilience;
    
    @Data
    public static class AuthConfig {
        private String type;  // OAUTH2, API_KEY, MTLS
        private String tokenUrl;
        private String clientId;
        private String clientSecret;
        private String scope;
    }
    
    @Data
    public static class ResilienceConfig {
        private int timeout;
        private CircuitBreakerConfig circuitBreaker;
        private RetryConfig retry;
    }
    
    @Data
    public static class CircuitBreakerConfig {
        private int failureThreshold;
        private long waitDuration;
    }
    
    @Data
    public static class RetryConfig {
        private int maxAttempts;
        private long backoff;
    }
}
```

#### 3. MuleSoftApiProvider.java (Infrastructure - Adapter)

```java
package com.company.signature.infrastructure.adapter.provider;

import com.company.signature.domain.model.*;
import com.company.signature.domain.port.SignatureProvider;
import com.company.signature.exception.UnsupportedChannelException;
import com.company.signature.exception.ProviderException;
import com.company.signature.infrastructure.adapter.provider.config.MuleSoftConfig;
import com.company.signature.infrastructure.adapter.provider.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "providers.mulesoft.enabled", havingValue = "true")
public class MuleSoftApiProvider implements SignatureProvider {
    
    private final MuleSoftConfig config;
    private final RestTemplate restTemplate;
    private final MuleSoftAuthService authService;
    
    @Override
    public ProviderResult sendChallenge(
        SignatureChallenge challenge, 
        ChallengeRecipient recipient
    ) {
        ChannelType channelType = challenge.getChannelType();
        
        // 1. Validar que el canal está soportado
        validateChannelSupported(channelType);
        
        // 2. Construir request según el canal
        String endpoint = getEndpoint(channelType);
        MuleSoftRequest request = buildRequest(challenge, recipient, channelType);
        
        // 3. Obtener token de autenticación
        String token = authService.getAccessToken();
        
        // 4. Llamar a MuleSoft API
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(token);
            
            HttpEntity<MuleSoftRequest> httpRequest = new HttpEntity<>(request, headers);
            
            String url = config.getBaseUrl() + endpoint;
            log.info("Sending challenge via MuleSoft: channel={}, endpoint={}", channelType, url);
            
            ResponseEntity<MuleSoftResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                httpRequest,
                MuleSoftResponse.class
            );
            
            MuleSoftResponse responseBody = response.getBody();
            log.info("MuleSoft response: status={}, messageId={}", 
                response.getStatusCode(), 
                responseBody != null ? responseBody.getMessageId() : null
            );
            
            return mapToProviderResult(responseBody, channelType);
            
        } catch (Exception e) {
            log.error("Failed to send challenge via MuleSoft: channel={}, error={}", 
                channelType, e.getMessage(), e);
            throw new ProviderException(
                "MuleSoft API call failed for channel " + channelType,
                e
            );
        }
    }
    
    @Override
    public Set<ChannelType> getSupportedChannels() {
        return config.getSupportedChannels();
    }
    
    // ========== PRIVATE METHODS ==========
    
    private void validateChannelSupported(ChannelType channelType) {
        if (!config.getSupportedChannels().contains(channelType)) {
            throw new UnsupportedChannelException(
                String.format(
                    "Channel %s is not supported by MuleSoft. Available channels: %s",
                    channelType,
                    config.getSupportedChannels()
                )
            );
        }
    }
    
    private String getEndpoint(ChannelType channelType) {
        return switch (channelType) {
            case SMS -> config.getEndpoints().get("sms");
            case PUSH -> config.getEndpoints().get("push");
            case VOICE -> config.getEndpoints().get("voice");
            case BIOMETRIC -> config.getEndpoints().get("biometric");
        };
    }
    
    private MuleSoftRequest buildRequest(
        SignatureChallenge challenge,
        ChallengeRecipient recipient,
        ChannelType channelType
    ) {
        return switch (channelType) {
            case SMS -> buildSmsRequest(challenge, recipient);
            case PUSH -> buildPushRequest(challenge, recipient);
            case VOICE -> buildVoiceRequest(challenge, recipient);
            case BIOMETRIC -> buildBiometricRequest(challenge, recipient);
        };
    }
    
    private MuleSoftRequest buildSmsRequest(
        SignatureChallenge challenge,
        ChallengeRecipient recipient
    ) {
        return MuleSoftRequest.builder()
            .channel("sms")
            .recipient(MuleSoftRecipient.builder()
                .phoneNumber(recipient.getPhoneNumber())
                .build())
            .message(MuleSoftMessage.builder()
                .body(challenge.getMessage())
                .build())
            .metadata(MuleSoftMetadata.builder()
                .challengeId(challenge.getId())
                .documentId(challenge.getDocumentId())
                .build())
            .build();
    }
    
    private MuleSoftRequest buildPushRequest(
        SignatureChallenge challenge,
        ChallengeRecipient recipient
    ) {
        return MuleSoftRequest.builder()
            .channel("push")
            .recipient(MuleSoftRecipient.builder()
                .deviceToken(recipient.getDeviceToken())
                .build())
            .message(MuleSoftMessage.builder()
                .title(challenge.getTitle())
                .body(challenge.getMessage())
                .build())
            .metadata(MuleSoftMetadata.builder()
                .challengeId(challenge.getId())
                .documentId(challenge.getDocumentId())
                .build())
            .build();
    }
    
    private MuleSoftRequest buildVoiceRequest(
        SignatureChallenge challenge,
        ChallengeRecipient recipient
    ) {
        return MuleSoftRequest.builder()
            .channel("voice")
            .recipient(MuleSoftRecipient.builder()
                .phoneNumber(recipient.getPhoneNumber())
                .build())
            .message(MuleSoftMessage.builder()
                .body(challenge.getVoiceScript())
                .language("es-ES")
                .build())
            .metadata(MuleSoftMetadata.builder()
                .challengeId(challenge.getId())
                .documentId(challenge.getDocumentId())
                .build())
            .build();
    }
    
    private MuleSoftRequest buildBiometricRequest(
        SignatureChallenge challenge,
        ChallengeRecipient recipient
    ) {
        return MuleSoftRequest.builder()
            .channel("biometric")
            .recipient(MuleSoftRecipient.builder()
                .userId(recipient.getUserId())
                .build())
            .metadata(MuleSoftMetadata.builder()
                .challengeId(challenge.getId())
                .documentId(challenge.getDocumentId())
                .biometricType(challenge.getBiometricType())
                .build())
            .build();
    }
    
    private ProviderResult mapToProviderResult(
        MuleSoftResponse response,
        ChannelType channelType
    ) {
        return ProviderResult.builder()
            .messageId(response.getMessageId())
            .status(mapStatus(response.getStatus()))
            .channelType(channelType)
            .provider("MULESOFT")
            .timestamp(response.getTimestamp())
            .build();
    }
    
    private ProviderStatus mapStatus(String muleSoftStatus) {
        return switch (muleSoftStatus) {
            case "SENT", "DELIVERED" -> ProviderStatus.SUCCESS;
            case "PENDING" -> ProviderStatus.PENDING;
            case "FAILED" -> ProviderStatus.FAILED;
            default -> ProviderStatus.UNKNOWN;
        };
    }
}
```

#### 4. application.yml (Configuración)

```yaml
# Application Configuration
spring:
  application:
    name: svc-signature-router

# MuleSoft Provider Configuration
providers:
  mulesoft:
    # Habilitar/deshabilitar MuleSoft
    enabled: true
    
    # URL base del API Gateway de MuleSoft
    base-url: https://mulesoft.company.com/api/v1
    
    # Canales soportados (CRÍTICO - define qué está disponible)
    supported-channels:
      - SMS
      - PUSH
      # - VOICE      # Comentado = NO disponible
      # - BIOMETRIC  # Comentado = NO disponible
    
    # Endpoints por canal
    endpoints:
      sms: /notifications/sms
      push: /notifications/push
      voice: /notifications/voice      # Endpoint existe pero canal no habilitado
      biometric: /notifications/biometric  # Endpoint existe pero canal no habilitado
    
    # Autenticación
    auth:
      type: OAUTH2
      token-url: https://auth.company.com/oauth/token
      client-id: ${MULESOFT_CLIENT_ID}
      client-secret: ${MULESOFT_CLIENT_SECRET}
      scope: notifications.send
    
    # Configuración de resiliencia
    resilience:
      timeout: 5000  # 5 segundos
      circuit-breaker:
        failure-threshold: 5
        wait-duration: 10000  # 10 segundos
      retry:
        max-attempts: 3
        backoff: 1000  # 1 segundo
```

---

## ✅ Ventajas del Diseño

### 1. ✅ Configuración sin Código

**Agregar/quitar canales = cambiar YAML**

```yaml
# Habilitar VOICE
supported-channels:
  - SMS
  - PUSH
  - VOICE  # ← Solo agregar esta línea
```

**NO requiere:**
- ❌ Recompilar
- ❌ Refactoring
- ❌ Cambios en el domain
- ❌ Cambios en controllers

**Solo requiere:**
- ✅ Actualizar `application.yml`
- ✅ Agregar 1 método en adapter (builder para el nuevo canal)
- ✅ Restart (con hot reload ni siquiera)

### 2. ✅ Domain Inmutable

El **dominio** (lógica de negocio) **NUNCA cambia** cuando:
- Agregamos un canal
- Quitamos un canal
- Cambiamos de MuleSoft a otro sistema
- Cambiamos autenticación de MuleSoft

**Ejemplo:**

```java
// Use Case - NUNCA CAMBIA
@Service
public class CreateSignatureRequestUseCase {
    private final SignatureProvider provider;  // Abstracción
    
    public SignatureRequestResponse execute(CreateSignatureRequest request) {
        // Esta lógica es IGUAL si usamos MuleSoft, Twilio, o lo que sea
        ProviderResult result = provider.sendChallenge(challenge, recipient);
        // ... resto de la lógica
    }
}
```

### 3. ✅ Testing Simplificado

Podemos **mockear** el provider fácilmente:

```java
@Test
void whenChannelNotSupported_thenThrowsException() {
    // Arrange
    SignatureProvider mockProvider = mock(SignatureProvider.class);
    when(mockProvider.sendChallenge(any(), any()))
        .thenThrow(new UnsupportedChannelException("VOICE not available"));
    
    CreateSignatureRequestUseCase useCase = new CreateSignatureRequestUseCase(mockProvider);
    
    // Act & Assert
    assertThrows(BusinessException.class, () -> {
        useCase.execute(createRequest(ChannelType.VOICE));
    });
}
```

### 4. ✅ Migración sin Downtime

**Canary deployment por canal:**

```yaml
# Paso 1: 10% tráfico SMS a MuleSoft
feature-flags:
  mulesoft-sms-percentage: 10

# Paso 2: 50% tráfico SMS a MuleSoft
feature-flags:
  mulesoft-sms-percentage: 50

# Paso 3: 100% tráfico SMS a MuleSoft
feature-flags:
  mulesoft-sms-percentage: 100
```

### 5. ✅ Rollback Inmediato

Si MuleSoft falla:

```yaml
# Deshabilitar MuleSoft (fallback a providers directos si permitido)
providers:
  mulesoft:
    enabled: false  # ← 1 línea
```

> ⚠️ **Nota:** Esto solo funciona si la normativa **permite** fallback temporal. Si no, no hay rollback posible.

### 6. ✅ Múltiples Ambientes

```yaml
# application-dev.yml (sandbox de MuleSoft)
providers:
  mulesoft:
    base-url: https://mulesoft-dev.company.com
    supported-channels: [SMS]  # Solo SMS en DEV

# application-uat.yml
providers:
  mulesoft:
    base-url: https://mulesoft-uat.company.com
    supported-channels: [SMS, PUSH]  # SMS y PUSH en UAT

# application-prod.yml
providers:
  mulesoft:
    base-url: https://mulesoft.company.com
    supported-channels: [SMS, PUSH, VOICE]  # Todos en PROD
```

### 7. ✅ Observabilidad

Podemos ver qué canales están activos:

```java
@RestController
@RequestMapping("/actuator/signature-provider")
public class ProviderActuatorController {
    
    private final SignatureProvider provider;
    
    @GetMapping("/info")
    public ProviderInfo getInfo() {
        return ProviderInfo.builder()
            .providerType("MULESOFT")
            .supportedChannels(provider.getSupportedChannels())
            .baseUrl(config.getBaseUrl())
            .enabled(config.isEnabled())
            .build();
    }
}
```

**Respuesta:**

```json
{
  "providerType": "MULESOFT",
  "supportedChannels": ["SMS", "PUSH"],
  "baseUrl": "https://mulesoft.company.com/api/v1",
  "enabled": true
}
```

---

## 📚 Decisiones de Arquitectura

### ADR-003: MuleSoft Integration con Hexagonal Architecture

**Contexto:**
- Normativa corporativa exige MuleSoft como único orquestador
- Necesitamos flexibilidad para agregar/quitar canales
- MuleSoft puede no tener todos los canales disponibles inicialmente

**Decisión:**
Implementar **Hexagonal Architecture** con **Adapter Pattern** para provider communication.

**Alternativas rechazadas:**

#### ❌ Opción 1: Hardcodear MuleSoft en Use Cases
```java
// MAL
public class CreateSignatureRequestUseCase {
    private MuleSoftApiClient muleSoftClient;  // Acoplamiento fuerte
}
```

**Problema:** Imposible testear sin MuleSoft real, imposible cambiar provider futuro.

#### ❌ Opción 2: Mantener adapters directos + MuleSoft (híbrido)
```java
// MAL
if (muleSoftAvailable) {
    muleSoftProvider.send();
} else {
    twilioProvider.send();  // Fallback
}
```

**Problema:** Viola normativa corporativa (prohibido comunicación directa).

#### ✅ Opción 3: Hexagonal Architecture (SELECCIONADA)
```java
// BIEN
public class CreateSignatureRequestUseCase {
    private SignatureProvider provider;  // Abstracción - puede ser cualquier implementación
}
```

**Ventajas:**
- ✅ Domain independiente de infraestructura
- ✅ Fácil testing (mocks)
- ✅ Canales configurables sin cambiar código
- ✅ Preparado para futuros cambios (MuleSoft v2, otro gateway, etc.)

**Consecuencias positivas:**
- ✅ Agregar/quitar canales = cambiar configuración YAML
- ✅ Domain inmutable (99% del código nunca cambia)
- ✅ Testing simplificado
- ✅ Migración gradual por canal

**Consecuencias negativas:**
- ⚠️ Más abstracción (más archivos, más complejidad inicial)
- ⚠️ Curva de aprendizaje para desarrolladores junior
- ⚠️ Overhead de configuración

**Compliance:**
- ✅ Cumple normativa: Solo MuleSoft (no hay comunicación directa)
- ✅ Cumple SOLID principles (Dependency Inversion)
- ✅ Cumple Clean Architecture guidelines

---

## 🎓 Resumen Ejecutivo

### ¿Qué es Plug & Play?

**Signature Router puede agregar/quitar canales de comunicación SIN cambiar el código del dominio.**

### ¿Cómo funciona?

1. **Domain** define **QUÉ** necesita (interface `SignatureProvider`)
2. **Adapter** implementa **CÓMO** se hace (clase `MuleSoftApiProvider`)
3. **Configuración** define **QUÉ CANALES** están disponibles (YAML)

### ¿Qué pasa si MuleSoft NO tiene un canal?

**Ese canal NO estará disponible en Signature Router.**

- Request con ese canal → HTTP 501 Not Implemented
- NO hay fallback a providers directos (normativa)
- Actualizar PRD/Epics para remover funcionalidad

### ¿Qué pasa si MuleSoft AGREGA un canal?

**Se activa con cambio de configuración.**

1. Actualizar `supported-channels` en YAML
2. Agregar endpoint en YAML
3. Agregar builder method en adapter (1 método)
4. Deploy

**Effort:** 2-4 horas

### ¿Qué código NUNCA cambia?

- ✅ Domain (Use Cases)
- ✅ Controllers (API REST)
- ✅ Interfaces (Ports)
- ✅ Models del domain

### ¿Qué código SÍ cambia?

- ⚙️ `application.yml` (configuración)
- ⚙️ `MuleSoftApiProvider` (agregar método builder)
- ⚙️ Tests (agregar casos para nuevo canal)

---

## 🚀 Próximos Pasos

### Después de la Reunión del Lunes

1. **Documentar canales disponibles:**
   - Crear `docs/architecture/mulesoft-canales-disponibles.md`
   - Listar qué canales SÍ tiene MuleSoft
   - Listar qué canales NO tiene MuleSoft

2. **Actualizar configuración:**
   - Modificar `application.yml` con canales reales
   - Agregar endpoints reales de MuleSoft
   - Configurar autenticación (OAuth2, API Key, etc.)

3. **Actualizar Epic 11:**
   - Incluir SOLO canales disponibles
   - Marcar canales no disponibles como bloqueados
   - Estimar effort real (basado en canales confirmados)

4. **Implementar adapter:**
   - Completar `MuleSoftApiProvider` con canales disponibles
   - Testing unitario
   - Testing de integración con sandbox de MuleSoft

5. **Plan de migración:**
   - Canary deployment por canal
   - Monitoreo de métricas (latency, error rate)
   - Rollback plan (si la normativa lo permite)

---

**Fecha de creación:** 2025-11-30  
**Última actualización:** 2025-11-30  
**Autor:** Equipo Signature Router  
**Revisado por:** [Pendiente revisión post-reunión MuleSoft]

---

## 📖 Referencias

- [docs/architecture/08-mulesoft-integration-strategy.md](./08-mulesoft-integration-strategy.md)
- [docs/architecture/adr/ADR-003-mulesoft-integration.md](./adr/ADR-003-mulesoft-integration.md)
- [docs/executive/INFORME-MIGRACION-MULESOFT-2025-11-28.md](../executive/INFORME-MIGRACION-MULESOFT-2025-11-28.md)
- [docs/PREGUNTAS-MULESOFT-REUNION-LUNES.md](../PREGUNTAS-MULESOFT-REUNION-LUNES.md)

