# 📚 Guía Completa de Routing Rules y SpEL

**Proyecto:** Signature Router  
**Fecha:** Diciembre 2025  
**Versión:** 1.0

---

## 📖 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema de Routing](#arquitectura-del-sistema-de-routing)
3. [Modelo de Datos](#modelo-de-datos)
4. [Flujo Completo de Evaluación](#flujo-completo-de-evaluación)
5. [Spring Expression Language (SpEL)](#spring-expression-language-spel)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Configuración de Reglas](#configuración-de-reglas)
8. [Troubleshooting](#troubleshooting)
9. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

### ¿Qué son las Routing Rules?

Las **Routing Rules** son reglas de negocio configurables que determinan:

1. **Qué canal de firma** usar (SMS, PUSH, VOICE, BIOMETRIC)
2. **Qué proveedor específico** ejecutará el envío
3. **Cuándo aplicar** cada combinación canal/proveedor

Las reglas se evalúan dinámicamente basándose en el **contexto de cada transacción**, permitiendo personalización avanzada sin modificar código.

### Casos de Uso

- ✅ **Seguridad adaptativa**: Transacciones >10,000€ → Biométrico
- ✅ **Optimización de costos**: SMS premium vs estándar según cliente
- ✅ **Experiencia de usuario**: PUSH para usuarios con app, SMS para otros
- ✅ **Balanceo de carga**: Distribuir entre múltiples proveedores
- ✅ **Cumplimiento normativo**: Canales específicos según regulación

---

## 🏗️ Arquitectura del Sistema de Routing

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    Signature Request                        │
│  {customerId, phoneNumber, transactionContext}              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RoutingServiceImpl                             │
│  - Carga reglas activas (enabled=true)                      │
│  - Ordena por prioridad ASC                                 │
│  - Evalúa condiciones SpEL                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SpEL Evaluation Engine                         │
│  - StandardEvaluationContext                                │
│  - RoutingContext JavaBean                                  │
│  - Seguridad: sin T(), sin bean resolution                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Primera Regla Matched                          │
│  targetChannel + providerId                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Provider Adapter (Twilio, AWS SNS, etc)            │
│  Envío real del desafío de firma                            │
└─────────────────────────────────────────────────────────────┘
```

### Capa de Dominio

```java
// Domain Model
RoutingRule {
  UUID id;
  String name;                    // "SMS Premium - Twilio"
  String description;             // "Transacciones >1000 EUR"
  String condition;               // "amountValue > 1000.00"
  ChannelType targetChannel;      // SMS, PUSH, VOICE, BIOMETRIC
  UUID providerId;                // Proveedor específico
  Integer priority;               // 1 = más alta, 100 = más baja
  Boolean enabled;                // true/false
  // ... audit fields
}
```

### Capa de Aplicación

```java
// Use Case
public interface SelectChannelUseCase {
    ChannelSelectionResult selectChannel(TransactionContext context);
}

// Result
record ChannelSelectionResult(
    ChannelType channel,
    UUID providerId,
    List<RoutingEvent> timeline
) {}
```

### Capa de Infraestructura

```java
// SpEL Evaluation
@Component
public class RoutingServiceImpl {
    public ChannelSelectionResult evaluate(TransactionContext ctx) {
        // 1. Cargar reglas
        List<RoutingRule> rules = repository.findActiveRulesOrderByPriority();
        
        // 2. Evaluar con SpEL
        for (RoutingRule rule : rules) {
            if (evaluateCondition(rule.getCondition(), ctx)) {
                return new ChannelSelectionResult(
                    rule.getTargetChannel(),
                    rule.getProviderId(),
                    buildTimeline(rule)
                );
            }
        }
        
        // 3. Fallback
        return defaultChannel();
    }
}
```

---

## 📊 Modelo de Datos

### Tabla `routing_rule`

```sql
CREATE TABLE routing_rule (
    id                UUID PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    description       TEXT,
    condition         VARCHAR(1000) NOT NULL,  -- Expresión SpEL
    target_channel    VARCHAR(20) NOT NULL,    -- SMS, PUSH, VOICE, BIOMETRIC
    provider_id       UUID,                    -- FK a provider_config
    priority          INTEGER NOT NULL,        -- Orden de evaluación
    enabled           BOOLEAN NOT NULL,        -- Activar/Desactivar regla
    
    -- Auditoría
    created_at        TIMESTAMPTZ NOT NULL,
    created_by        VARCHAR(255) NOT NULL,
    modified_at       TIMESTAMPTZ,
    modified_by       VARCHAR(255),
    
    -- Soft delete
    deleted           BOOLEAN NOT NULL DEFAULT false,
    deleted_at        TIMESTAMPTZ,
    deleted_by        VARCHAR(255),
    
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) 
        REFERENCES provider_config(id)
);

CREATE INDEX idx_routing_rule_priority 
    ON routing_rule(priority ASC) 
    WHERE enabled = true AND deleted = false;
```

### Ejemplo de Datos

```sql
INSERT INTO routing_rule (
    id, name, description, condition, target_channel, provider_id, priority, enabled
) VALUES (
    gen_random_uuid(),
    'SMS Premium - Twilio',
    'Enruta transacciones de alto valor (>1000 EUR) a SMS mediante Twilio',
    'amountValue > 1000.00',
    'SMS',
    'd43a15ca-8fa0-4b57-85b2-a18f2d97c7b8',  -- UUID de Twilio SMS
    1,
    true
);
```

---

## 🔄 Flujo Completo de Evaluación

### Paso 1: Recepción de Solicitud

**Endpoint:** `POST /api/v1/signatures`

```json
{
  "customerId": "CUST-12345",
  "phoneNumber": "+34612345678",
  "transactionContext": {
    "amount": {
      "value": 1500.00,
      "currency": "EUR"
    },
    "merchantId": "MERCHANT-001",
    "orderId": "ORDER-789",
    "description": "Transferencia internacional urgente"
  }
}
```

### Paso 2: Construcción del Contexto de Routing

El `TransactionContext` se mapea a un `RoutingContext` JavaBean:

```java
public record RoutingContext(
    BigDecimal amountValue,      // 1500.00
    String amountCurrency,       // "EUR"
    String merchantId,           // "MERCHANT-001"
    String orderId,              // "ORDER-789"
    String description           // "Transferencia internacional urgente"
) {
    // Getters implícitos en record
}
```

### Paso 3: Carga de Reglas Activas

```sql
SELECT * FROM routing_rule
WHERE enabled = true 
  AND deleted = false
ORDER BY priority ASC;
```

**Resultado:**

| Priority | Name | Condition | Channel | Provider |
|----------|------|-----------|---------|----------|
| 1 | SMS Premium - Twilio | `amountValue > 1000.00` | SMS | Twilio SMS |
| 2 | PUSH - FCM | `amountValue >= 100.00 && amountValue <= 1000.00` | PUSH | Firebase |
| 3 | VOICE - Twilio | `amountValue < 100.00` | VOICE | Twilio Voice |
| 4 | SMS Standard - AWS SNS | `description matches '.*urgente.*'` | SMS | AWS SNS |

### Paso 4: Evaluación SpEL

Para cada regla (en orden de prioridad):

#### **Regla 1: SMS Premium - Twilio**

```java
// Condición SpEL
String condition = "amountValue > 1000.00";

// Contexto
RoutingContext context = new RoutingContext(
    new BigDecimal("1500.00"),  // amountValue
    "EUR",                       // amountCurrency
    "MERCHANT-001",              // merchantId
    "ORDER-789",                 // orderId
    "Transferencia internacional urgente"  // description
);

// Evaluación
StandardEvaluationContext spelContext = new StandardEvaluationContext(context);
ExpressionParser parser = new SpelExpressionParser();
Expression exp = parser.parseExpression(condition);
Boolean result = exp.getValue(spelContext, Boolean.class);

// result = TRUE ✅ (1500.00 > 1000.00)
```

**✅ MATCH → Se detiene la evaluación**

### Paso 5: Registro en Timeline

```json
{
  "routingTimeline": [
    {
      "timestamp": "2025-12-05T10:30:45.123Z",
      "event": "RULE_MATCHED",
      "details": "Rule 'SMS Premium - Twilio' matched (priority 1)"
    },
    {
      "timestamp": "2025-12-05T10:30:45.124Z",
      "event": "CHALLENGE_CREATED",
      "details": "Challenge created for channel SMS using provider Twilio SMS"
    }
  ]
}
```

### Paso 6: Creación y Envío del Desafío

```java
// Se crea el desafío con los datos de la regla
SignatureChallenge challenge = SignatureChallenge.builder()
    .channelType(ChannelType.SMS)  // De la regla
    .providerId(twilioSmsProviderId)  // De la regla
    .code(generateSecureCode())
    .expiresAt(now().plus(3, MINUTES))
    .build();

// El ProviderAdapter correspondiente envía el SMS
TwilioSmsAdapter.send("+34612345678", "Tu código es: 123456");
```

---

## 🚀 Spring Expression Language (SpEL)

### ¿Qué es SpEL?

**Spring Expression Language** es un lenguaje de expresiones que permite consultar y manipular objetos en tiempo de ejecución.

### Características Usadas en Routing

#### **1. Acceso a Propiedades**

```spel
amountValue          // Accede a context.getAmountValue()
amountCurrency       // Accede a context.getAmountCurrency()
merchantId           // Accede a context.getMerchantId()
```

#### **2. Operadores de Comparación**

```spel
amountValue > 1000.00              // Mayor que
amountValue >= 100.00              // Mayor o igual
amountValue < 50.00                // Menor que
amountValue <= 1000.00             // Menor o igual
amountValue == 500.00              // Igual
amountCurrency != 'USD'            // Diferente
```

#### **3. Operadores Lógicos**

```spel
// AND
amountValue > 100.00 && amountValue <= 1000.00

// OR
amountValue > 10000.00 || amountCurrency == 'USD'

// NOT
!(amountValue < 100.00)
```

#### **4. Operadores de Cadenas**

```spel
// Matches (Regex)
description matches '.*urgente.*'
description matches '^PAGO.*'
merchantId matches 'MERCHANT-[0-9]+'

// Comparaciones
merchantId == 'MERCHANT-001'
amountCurrency == 'EUR'
```

#### **5. Operadores Aritméticos**

```spel
amountValue + 100.00
amountValue * 1.21              // +21% IVA
amountValue / 2
amountValue % 100.00            // Módulo
```

### Contexto Disponible (RoutingContext)

```java
public record RoutingContext(
    BigDecimal amountValue,      // Monto de la transacción
    String amountCurrency,       // Moneda (EUR, USD, GBP)
    String merchantId,           // ID del comercio
    String orderId,              // ID del pedido
    String description           // Descripción de la transacción
) {}
```

**Variables accesibles en SpEL:**

| Variable | Tipo | Ejemplo | Descripción |
|----------|------|---------|-------------|
| `amountValue` | `BigDecimal` | `1500.00` | Valor numérico del monto |
| `amountCurrency` | `String` | `"EUR"` | Código ISO de moneda |
| `merchantId` | `String` | `"MERCHANT-001"` | Identificador del comercio |
| `orderId` | `String` | `"ORDER-789"` | Identificador del pedido |
| `description` | `String` | `"Transferencia urgente"` | Descripción de la transacción |

### Configuración de Seguridad

El sistema usa `StandardEvaluationContext` con restricciones de seguridad:

```java
private StandardEvaluationContext createEvaluationContext(TransactionContext tx) {
    RoutingContext rootContext = new RoutingContext(
        tx.amount().amount(),
        tx.amount().currency(),
        tx.merchantId(),
        tx.orderId(),
        tx.description()
    );

    StandardEvaluationContext context = new StandardEvaluationContext(rootContext);
    
    // 🛡️ RESTRICCIONES DE SEGURIDAD
    context.setBeanResolver(null);          // ❌ Sin acceso a beans
    context.setMethodComparator(null);      // ❌ Sin comparación de métodos
    context.setOperatorOverloader(null);    // ❌ Sin sobrecarga de operadores
    context.setConstructorResolver(null);   // ❌ Sin creación de objetos
    
    // ✅ Solo permite acceso a propiedades
    context.setPropertyAccessors(List.of(new DataBindingPropertyAccessor()));
    
    return context;
}
```

**⚠️ Operaciones NO permitidas:**

```spel
T(java.lang.Runtime).getRuntime().exec('ls')  // ❌ Acceso a clases Java
T(java.lang.System).exit(0)                   // ❌ Llamadas a sistema
new java.io.File('/etc/passwd')               // ❌ Creación de objetos
@someBean.someMethod()                        // ❌ Acceso a beans Spring
```

### Validación de Expresiones

Antes de guardar una regla, el sistema valida la expresión SpEL:

```java
@Component
public class SpelValidatorServiceImpl implements SpelValidatorService {
    
    @Override
    public void validate(String expression) {
        try {
            // Crear contexto de prueba
            RoutingContext testContext = new RoutingContext(
                new BigDecimal("100.00"),
                "EUR",
                "merchant-123",
                "order-456",
                "Test transaction"
            );
            
            // Intentar parsear y evaluar
            Expression exp = parser.parseExpression(expression);
            exp.getValue(createSafeContext(testContext), Boolean.class);
            
        } catch (SpelEvaluationException | SpelParseException e) {
            throw new InvalidSpelExpressionException(
                "Invalid SpEL expression: " + e.getMessage()
            );
        }
    }
}
```

---

## 📋 Ejemplos Prácticos

### Ejemplo 1: Routing por Monto

**Objetivo:** Diferentes canales según el valor de la transacción.

```sql
-- Transacciones pequeñas (<100€) → VOICE
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'VOICE - Transacciones Pequeñas',
    'Transacciones menores a 100 EUR usan llamada de voz',
    'amountValue < 100.00',
    'VOICE',
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio Voice'),
    3,
    true
);

-- Transacciones medianas (100€-1000€) → PUSH
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'PUSH - Transacciones Medianas',
    'Transacciones de 100 a 1000 EUR usan notificación push',
    'amountValue >= 100.00 && amountValue <= 1000.00',
    'PUSH',
    (SELECT id FROM provider_config WHERE provider_name = 'Firebase Cloud Messaging'),
    2,
    true
);

-- Transacciones grandes (>1000€) → SMS Premium
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'SMS Premium - Transacciones Grandes',
    'Transacciones mayores a 1000 EUR usan SMS premium',
    'amountValue > 1000.00',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS'),
    1,
    true
);
```

**Pruebas:**

```bash
# Transacción de 50€ → VOICE
curl -X POST /api/v1/signatures -d '{"amount":{"value":50.00,"currency":"EUR"}}'

# Transacción de 500€ → PUSH
curl -X POST /api/v1/signatures -d '{"amount":{"value":500.00,"currency":"EUR"}}'

# Transacción de 2000€ → SMS
curl -X POST /api/v1/signatures -d '{"amount":{"value":2000.00,"currency":"EUR"}}'
```

### Ejemplo 2: Routing por Descripción (Palabras Clave)

**Objetivo:** Transacciones "urgentes" usan canal prioritario.

```sql
-- Transacciones urgentes → SMS inmediato
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'SMS Urgente',
    'Transacciones con palabra "urgente" usan SMS de alta prioridad',
    'description matches ''.*[Uu]rgente.*''',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS'),
    1,  -- ⚠️ PRIORIDAD MÁS ALTA para que se evalúe primero
    true
);
```

**Prueba:**

```json
POST /api/v1/signatures
{
  "transactionContext": {
    "amount": {"value": 50.00, "currency": "EUR"},
    "description": "Transferencia urgente a proveedor"
  }
}
// → SMS (aunque el monto sea <100€, "urgente" tiene prioridad 1)
```

### Ejemplo 3: Routing por Comercio (Merchant)

**Objetivo:** Comercios específicos usan proveedores dedicados.

```sql
-- Comercio VIP → Biométrico
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'Biométrico - Comercio VIP',
    'Comercio MERCHANT-VIP-001 siempre usa verificación biométrica',
    'merchantId == ''MERCHANT-VIP-001''',
    'BIOMETRIC',
    (SELECT id FROM provider_config WHERE provider_name = 'FaceTech'),
    1,  -- Alta prioridad
    true
);

-- Comercios de prueba → Proveedor de test
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'Test - Comercios de Desarrollo',
    'Comercios que empiezan con TEST- usan proveedor de sandbox',
    'merchantId matches ''TEST-.*''',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS Test'),
    99,  -- Baja prioridad (fallback)
    true
);
```

### Ejemplo 4: Routing por Moneda

**Objetivo:** Diferentes proveedores según la divisa.

```sql
-- Transacciones en USD → Proveedor USA
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'SMS USA - Dólares',
    'Transacciones en USD usan proveedor estadounidense',
    'amountCurrency == ''USD''',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS US'),
    1,
    true
);

-- Transacciones en EUR → Proveedor EU
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'SMS Europa - Euros',
    'Transacciones en EUR usan proveedor europeo',
    'amountCurrency == ''EUR''',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'AWS SNS EU'),
    2,
    true
);
```

### Ejemplo 5: Routing Complejo (Múltiples Condiciones)

**Objetivo:** Lógica avanzada con múltiples criterios.

```sql
-- Transacciones grandes en comercios internacionales
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'Biométrico - Alto Valor Internacional',
    'Transacciones >5000€ en comercios internacionales requieren biométrico',
    'amountValue > 5000.00 && amountCurrency == ''EUR'' && merchantId matches ''INTL-.*''',
    'BIOMETRIC',
    (SELECT id FROM provider_config WHERE provider_name = 'Veridas'),
    1,
    true
);

-- Transacciones nocturnas de bajo valor
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'PUSH - Nocturno Bajo Valor',
    'Transacciones <200€ en descripción con palabra "nocturno"',
    'amountValue < 200.00 && description matches ''.*[Nn]octurno.*''',
    'PUSH',
    (SELECT id FROM provider_config WHERE provider_name = 'Firebase Cloud Messaging'),
    2,
    true
);
```

### Ejemplo 6: Balanceo de Carga entre Proveedores

**Objetivo:** Distribuir carga entre múltiples proveedores del mismo canal.

```sql
-- SMS: Proveedor 1 para transacciones con orderId par
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'SMS Load Balance - Provider 1',
    'Transacciones SMS con orderId que termina en número par',
    'orderId matches ''.*[02468]$''',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS'),
    10,
    true
);

-- SMS: Proveedor 2 para transacciones con orderId impar
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'SMS Load Balance - Provider 2',
    'Transacciones SMS con orderId que termina en número impar',
    'orderId matches ''.*[13579]$''',
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'AWS SNS'),
    10,  -- Misma prioridad, pero se evalúa después de la regla par
    true
);
```

---

## ⚙️ Configuración de Reglas

### Desde el Portal de Administración

1. **Navegar a "Reglas de Routing"**
   - URL: `http://localhost:3001/admin/rules`

2. **Crear Nueva Regla**
   - Click en "Nueva Regla"
   - Completar formulario:
     - **Nombre**: Identificador descriptivo
     - **Descripción**: Explicación detallada del propósito
     - **Canal**: SMS, PUSH, VOICE, BIOMETRIC
     - **Proveedor**: Seleccionar de la lista disponible
     - **Prioridad**: 1-100 (menor = mayor prioridad)
     - **Condición SpEL**: Expresión de evaluación
     - **Estado**: Habilitada/Deshabilitada

3. **Validación Automática**
   - El sistema valida la expresión SpEL al guardar
   - Muestra errores si la sintaxis es incorrecta

### Desde el API

#### **Crear Regla**

```bash
POST /api/v1/admin/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "SMS Premium - Alto Valor",
  "description": "Transacciones superiores a 1000 EUR",
  "condition": "amountValue > 1000.00",
  "targetChannel": "SMS",
  "providerId": "d43a15ca-8fa0-4b57-85b2-a18f2d97c7b8",
  "priority": 1,
  "enabled": true
}
```

#### **Actualizar Regla**

```bash
PUT /api/v1/admin/rules/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "SMS Premium - Alto Valor (Actualizada)",
  "description": "Transacciones superiores a 2000 EUR",
  "condition": "amountValue > 2000.00",
  "targetChannel": "SMS",
  "providerId": "d43a15ca-8fa0-4b57-85b2-a18f2d97c7b8",
  "priority": 1,
  "enabled": true
}
```

#### **Listar Reglas**

```bash
GET /api/v1/admin/rules
Authorization: Bearer <token>

Response:
[
  {
    "id": "204cfc87-d6cb-4bf6-8bf1-a13d66588273",
    "name": "SMS Premium - Twilio",
    "description": "Transacciones >1000 EUR",
    "condition": "amountValue > 1000.00",
    "targetChannel": "SMS",
    "providerId": "d43a15ca-8fa0-4b57-85b2-a18f2d97c7b8",
    "priority": 1,
    "enabled": true,
    "createdAt": "2025-11-15T10:00:00Z",
    "modifiedAt": "2025-11-20T14:30:00Z"
  }
]
```

#### **Eliminar Regla (Soft Delete)**

```bash
DELETE /api/v1/admin/rules/{id}
Authorization: Bearer <token>

Response: 204 No Content
```

---

## 🔍 Troubleshooting

### Problema 1: Regla No Hace Match

**Síntoma:** La regla nunca se selecciona, siempre se usa el canal por defecto.

**Diagnóstico:**

1. Revisar `routingTimeline` en la respuesta de la solicitud:

```json
{
  "routingTimeline": [
    {
      "timestamp": "2025-12-05T10:00:00Z",
      "event": "RULE_ERROR",
      "details": "Error evaluating rule 'Mi Regla': Property 'amontValue' not found"
    }
  ]
}
```

2. **Causas comunes:**
   - ❌ Typo en nombre de variable: `amontValue` → `amountValue`
   - ❌ Comparación incorrecta: `amountValue = 1000.00` → `amountValue == 1000.00`
   - ❌ Prioridad muy baja (otras reglas hacen match primero)
   - ❌ Regla deshabilitada (`enabled = false`)

**Solución:**
- Corregir la expresión SpEL
- Verificar prioridad de la regla
- Asegurarse de que `enabled = true`

### Problema 2: Error de SpEL en Runtime

**Síntoma:** `RULE_ERROR` en el timeline con excepción de SpEL.

**Log típico:**

```
EL1008E: Property or field 'amount' cannot be found on object of type 
'com.singularbank.signature.routing.infrastructure.adapter.outbound.routing.RoutingServiceImpl$RoutingContext'
```

**Solución:**

Variables disponibles:
- ✅ `amountValue` (NO `amount` ni `amount.value`)
- ✅ `amountCurrency` (NO `currency`)
- ✅ `merchantId`
- ✅ `orderId`
- ✅ `description`

### Problema 3: Regla con Menor Prioridad Gana

**Síntoma:** Se selecciona una regla con `priority = 5` en lugar de `priority = 1`.

**Causa:** La regla con `priority = 1` tiene `enabled = false` o fue eliminada (soft delete).

**Solución:**

```sql
-- Verificar estado de las reglas
SELECT name, priority, enabled, deleted 
FROM routing_rule 
ORDER BY priority ASC;

-- Reactivar regla si es necesario
UPDATE routing_rule 
SET enabled = true, deleted = false 
WHERE id = '...';
```

### Problema 4: Provider NULL

**Síntoma:** La regla hace match pero no se envía el desafío porque `providerId` es NULL.

**Solución:**

```sql
-- Verificar provider_id de las reglas
SELECT r.name, r.target_channel, r.provider_id, p.provider_name
FROM routing_rule r
LEFT JOIN provider_config p ON r.provider_id = p.id
WHERE r.enabled = true AND r.deleted = false;

-- Asignar provider si falta
UPDATE routing_rule 
SET provider_id = (SELECT id FROM provider_config WHERE provider_name = 'Twilio SMS' LIMIT 1)
WHERE name = 'Mi Regla' AND provider_id IS NULL;
```

### Problema 5: Expresión SpEL Rechazada al Crear Regla

**Síntoma:** Error 400 al crear regla con mensaje "Invalid SpEL expression".

**Causa:** Uso de operadores/funciones no permitidos por seguridad.

```spel
❌ T(java.lang.System).currentTimeMillis()
❌ @myBean.myMethod()
❌ new java.util.Date()
```

**Solución:** Usar solo operadores permitidos y variables del contexto:

```spel
✅ amountValue > 1000.00
✅ description matches '.*urgente.*'
✅ amountCurrency == 'EUR' && merchantId matches 'VIP-.*'
```

---

## 💡 Mejores Prácticas

### 1. Nomenclatura de Reglas

**✅ BIEN:**
```
"SMS Premium - Twilio - Alto Valor"
"PUSH - FCM - Transacciones Medianas"
"BIOMETRIC - FaceTech - Comercios VIP"
```

**❌ MAL:**
```
"Regla 1"
"test"
"nueva-regla-123"
```

**Patrón recomendado:** `{CANAL} - {PROVEEDOR} - {DESCRIPCIÓN_CORTA}`

### 2. Descripción Detallada

Incluir:
- ✅ Condiciones exactas que activan la regla
- ✅ Razón de negocio para la regla
- ✅ Ejemplos de transacciones que hacen match

```
Descripción: "Enruta transacciones superiores a 1000 EUR a SMS mediante Twilio. 
Usado para clientes premium o transacciones críticas que requieren confirmación 
inmediata. Ejemplo: Transferencias internacionales, pagos de alto valor."
```

### 3. Gestión de Prioridades

**Estrategia recomendada:**

```
Prioridad 1-10:   Reglas de seguridad (biométrico, alto valor)
Prioridad 11-20:  Reglas de negocio críticas (urgente, VIP)
Prioridad 21-50:  Reglas estándar (por monto, moneda)
Prioridad 51-99:  Reglas de fallback y balanceo de carga
```

**Ejemplo:**

```sql
-- Prioridad 1: Seguridad máxima
INSERT INTO routing_rule VALUES (..., 'amountValue > 10000.00', 'BIOMETRIC', ..., 1, ...);

-- Prioridad 5: Urgencias
INSERT INTO routing_rule VALUES (..., 'description matches ''.*urgente.*''', 'SMS', ..., 5, ...);

-- Prioridad 20: Transacciones estándar
INSERT INTO routing_rule VALUES (..., 'amountValue >= 100.00', 'PUSH', ..., 20, ...);

-- Prioridad 90: Fallback
INSERT INTO routing_rule VALUES (..., 'amountValue < 100.00', 'VOICE', ..., 90, ...);
```

### 4. Testing de Reglas

**Antes de activar en producción:**

1. **Crear regla deshabilitada**
```sql
INSERT INTO routing_rule VALUES (..., enabled = false);
```

2. **Probar con datos reales en entorno de test**
```bash
curl -X POST http://test.api/signatures -d @test-transaction.json
```

3. **Verificar timeline**
```json
{
  "routingTimeline": [
    {"event": "RULE_MATCHED", "details": "..."}
  ]
}
```

4. **Activar gradualmente**
```sql
-- Activar con prioridad baja primero
UPDATE routing_rule SET enabled = true, priority = 99 WHERE id = '...';

-- Monitorear durante 24h

-- Ajustar prioridad definitiva
UPDATE routing_rule SET priority = 10 WHERE id = '...';
```

### 5. Mantenimiento de Reglas

**Auditoría mensual:**

```sql
-- Reglas nunca usadas (sin match en 30 días)
SELECT r.name, r.condition, r.created_at
FROM routing_rule r
LEFT JOIN signature_request sr ON sr.routing_timeline::text LIKE '%' || r.name || '%'
WHERE r.enabled = true
  AND r.created_at < NOW() - INTERVAL '30 days'
  AND sr.id IS NULL;

-- Reglas con alta tasa de error
SELECT r.name, COUNT(*) as error_count
FROM routing_rule r
JOIN signature_request sr ON sr.routing_timeline::text LIKE '%RULE_ERROR%' || r.name || '%'
WHERE r.enabled = true
GROUP BY r.name
HAVING COUNT(*) > 10
ORDER BY error_count DESC;
```

### 6. Documentación de Cambios

Usar el campo `description` para documentar cambios:

```
Descripción inicial:
"Transacciones >1000 EUR usan SMS premium."

Después de actualización:
"Transacciones >2000 EUR usan SMS premium.
CAMBIO (2025-12-01): Incrementado umbral de 1000 a 2000 EUR por reducción de costos.
ANTERIOR: amountValue > 1000.00
ACTUAL: amountValue > 2000.00"
```

### 7. Reglas de Fallback

**Siempre tener una regla catch-all:**

```sql
-- Regla de fallback (prioridad más baja)
INSERT INTO routing_rule VALUES (
    gen_random_uuid(),
    'Fallback - SMS Estándar',
    'Regla por defecto para todas las transacciones que no hagan match con reglas anteriores',
    'amountValue >= 0.00',  -- Siempre verdadero
    'SMS',
    (SELECT id FROM provider_config WHERE provider_name = 'AWS SNS' LIMIT 1),
    100,  -- Prioridad mínima
    true
);
```

### 8. Seguridad en Expresiones SpEL

**❌ NUNCA permitir input de usuario directo en SpEL**

```java
// ❌ PELIGRO: Inyección de SpEL
String userInput = request.getParameter("condition");
Expression exp = parser.parseExpression(userInput);  // VULNERABLE
```

**✅ SIEMPRE validar antes de guardar**

```java
// ✅ SEGURO: Validación antes de persistir
@PostMapping("/admin/rules")
public RoutingRuleResponseDto createRule(@RequestBody CreateRoutingRuleDto dto) {
    spelValidatorService.validate(dto.condition());  // Valida y lanza excepción si es peligroso
    return manageRoutingRulesUseCase.createRule(dto, getPrincipal());
}
```

---

## 📚 Referencias

### Documentación Oficial

- [Spring Expression Language (SpEL)](https://docs.spring.io/spring-framework/reference/core/expressions.html)
- [SpEL Operators](https://docs.spring.io/spring-framework/reference/core/expressions/language-ref/operators.html)
- [SpEL Type Conversion](https://docs.spring.io/spring-framework/reference/core/expressions/evaluation.html#expressions-type-conversion)

### Archivos del Proyecto

- **Domain Model:** `svc-signature-router/src/main/java/com/bank/signature/domain/model/aggregate/RoutingRule.java`
- **Routing Service:** `svc-signature-router/src/main/java/com/bank/signature/infrastructure/adapter/outbound/routing/RoutingServiceImpl.java`
- **SpEL Validator:** `svc-signature-router/src/main/java/com/bank/signature/infrastructure/adapter/outbound/spel/SpelValidatorServiceImpl.java`
- **REST Controller:** `svc-signature-router/src/main/java/com/bank/signature/infrastructure/adapter/inbound/rest/AdminRuleController.java`
- **Frontend:** `app-signature-router-admin/app/admin/rules/page.tsx`

### Base de Datos

- **Tabla:** `routing_rule`
- **Seed Script:** `svc-signature-router/scripts/seed-test-data.sql`
- **Migraciones:** `svc-signature-router/src/main/resources/liquibase/` (cuando se implementen)

---

## 🏁 Conclusión

El sistema de **Routing Rules con SpEL** proporciona:

✅ **Flexibilidad:** Configuración dinámica sin cambios de código  
✅ **Seguridad:** Evaluación controlada con restricciones  
✅ **Trazabilidad:** Timeline completo de cada decisión  
✅ **Escalabilidad:** Múltiples reglas y proveedores  
✅ **Mantenibilidad:** Portal de administración intuitivo  

**¡Las reglas de routing son el corazón del sistema de enrutamiento de firmas!** 🚀

---

**Última actualización:** Diciembre 2025  
**Versión del documento:** 1.0  
**Autor:** Signature Router Team

