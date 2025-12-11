# ⚠️ CHECKLIST: Activación para UAT/Producción

**Fecha:** 27 de noviembre de 2025  
**Propósito:** Lista completa de todo lo que está DESHABILITADO en desarrollo local y DEBE ACTIVARSE para UAT/Producción

---

## 🚨 CRÍTICO: Lo Que DEBE Cambiarse

### 1. **Liquibase Migrations** 🔴 CRÍTICO

**Estado Actual (Local):**
```yaml
# application-local.yml
spring:
  liquibase:
    enabled: false  # ❌ DESHABILITADO
  jpa:
    hibernate:
      ddl-auto: create  # ❌ Genera schema automáticamente (peligroso en prod)
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
spring:
  liquibase:
    enabled: true  # ✅ ACTIVAR
    change-log: classpath:liquibase/changelog-master.yaml
    contexts: uat  # o 'prod' para producción
  jpa:
    hibernate:
      ddl-auto: validate  # ✅ Solo validar, no modificar schema
```

**Acción:**
- [x] Verificar que todos los changesets de Liquibase están creados
- [x] Probados en local (enabled: true temporalmente)
- [ ] **ACTIVAR** `liquibase.enabled: true` en UAT/Prod
- [ ] **CAMBIAR** `ddl-auto: validate` en UAT/Prod

---

### 2. **Kafka Event Publishing** 🔴 CRÍTICO

**Estado Actual (Local):**
```yaml
# application-local.yml
spring:
  kafka:
    enabled: false  # ❌ DESHABILITADO

management:
  health:
    kafka:
      enabled: false  # ❌ Health check deshabilitado
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
spring:
  kafka:
    enabled: true  # ✅ ACTIVAR
    bootstrap-servers: kafka-broker-1:9092,kafka-broker-2:9092,kafka-broker-3:9092
    # ... resto de configuración de Kafka

management:
  health:
    kafka:
      enabled: true  # ✅ ACTIVAR health check
```

**Acción:**
- [ ] **ACTIVAR** `spring.kafka.enabled: true`
- [ ] **CONFIGURAR** bootstrap-servers reales de UAT/Prod
- [ ] **ACTIVAR** health check de Kafka
- [ ] **VERIFICAR** que los topics existen en Kafka:
  - `signature.completed`
  - `signature.aborted`
- [ ] **PROBAR** que `KafkaEventPublisher` publica eventos

**Impacto si NO se activa:**
- ❌ Los eventos `SignatureCompletedEvent` y `SignatureAbortedEvent` NO se publicarán
- ❌ Sistemas downstream NO recibirán notificaciones
- ❌ Trazabilidad incompleta

---

### 3. **SMS Provider (Twilio REAL)** 🟡 IMPORTANTE

**Estado Actual (Local):**
```yaml
# application-local.yml
providers:
  sms:
    stub: true  # ❌ Usando STUB (no envía SMS reales)
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
providers:
  sms:
    stub: false  # ✅ Usar TwilioSmsProvider REAL
    # O simplemente NO incluir esta línea (default es false)
```

**Acción:**
- [ ] **OBTENER** credenciales de Twilio (Account SID, Auth Token, Phone Number)
- [ ] **GUARDAR** en Vault:
  ```bash
  vault kv put secret/signature-router/twilio \
    account-sid='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
    auth-token='tu_auth_token_real' \
    from-number='+1234567890'
  ```
- [ ] **CAMBIAR** `stub: false` en UAT/Prod
- [ ] **REINICIAR** aplicación
- [ ] **PROBAR** envío de SMS real

**Impacto si NO se activa:**
- ❌ SMS NO se enviarán realmente
- ❌ Solo se loguean (STUB)
- ❌ Usuarios NO recibirán códigos de verificación

---

### 4. **Push Notifications (FCM)** 🟡 IMPORTANTE

**Estado Actual (Local):**
```yaml
# application-local.yml
providers:
  push:
    enabled: false  # ❌ DESHABILITADO

fcm:
  enabled: false  # ❌ DESHABILITADO
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
providers:
  push:
    enabled: true  # ✅ ACTIVAR

fcm:
  enabled: true  # ✅ ACTIVAR
  service-account-path: file:/etc/secrets/firebase-service-account.json
  # project-id se detecta automáticamente del JSON
```

**Acción:**
- [ ] **OBTENER** Firebase Service Account JSON desde Firebase Console
- [ ] **GUARDAR** JSON en servidor (fuera del repo):
  - UAT: `/etc/secrets/firebase-service-account-uat.json`
  - Prod: `/etc/secrets/firebase-service-account-prod.json`
- [ ] **CONFIGURAR** `fcm.service-account-path` en UAT/Prod
- [ ] **ACTIVAR** `fcm.enabled: true` y `providers.push.enabled: true`
- [ ] **REINICIAR** aplicación
- [ ] **PROBAR** envío de push notification real

**Impacto si NO se activa:**
- ❌ Push notifications NO se enviarán
- ❌ Canal PUSH no estará disponible
- ❌ Routing rules con `targetChannel: PUSH` fallarán

---

### 5. **Voice Calls (Twilio Voice)** 🟢 OPCIONAL

**Estado Actual (Local):**
```yaml
# application.yml (default)
providers:
  voice:
    enabled: false  # ❌ DESHABILITADO (por defecto - caro)
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
providers:
  voice:
    enabled: true  # ✅ ACTIVAR (si se requiere)
    timeout-seconds: 10
    retry-max-attempts: 2
    tts-language: es-ES
    tts-voice: Polly.Mia
    max-call-duration: 60
```

**Acción (SOLO si se requiere Voice):**
- [ ] **VALIDAR** presupuesto (caro: ~$0.013/min en Latam)
- [ ] **USAR** las mismas credenciales de Twilio SMS (Account SID, Auth Token)
- [ ] **CONFIGURAR** número de Twilio habilitado para Voice
- [ ] **ACTIVAR** `providers.voice.enabled: true`
- [ ] **PROBAR** llamada de voz real

**Impacto si NO se activa:**
- ⚠️ Canal VOICE no estará disponible
- ⚠️ Fallback SMS→VOICE no funcionará
- ✅ OK si no se planea usar llamadas de voz

---

### 6. **Fallback Chain** 🟡 IMPORTANTE

**Estado Actual (Local):**
```yaml
# application-local.yml
fallback:
  enabled: false  # ❌ DESHABILITADO (para ver errores directos del provider)
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
fallback:
  enabled: true  # ✅ ACTIVAR
  chains:
    SMS: VOICE
    PUSH: SMS
    BIOMETRIC: SMS
```

**Acción:**
- [ ] **ACTIVAR** `fallback.enabled: true` en UAT/Prod
- [ ] **VALIDAR** que los providers de fallback están habilitados:
  - Si SMS→VOICE, entonces Voice debe estar enabled
  - Si PUSH→SMS, entonces SMS debe estar enabled
- [ ] **PROBAR** escenario de fallback (simular fallo de provider)

**Impacto si NO se activa:**
- ❌ NO habrá fallback automático cuando un provider falle
- ❌ Signature Request fallará inmediatamente si el provider principal falla
- ❌ Menor resiliencia del sistema

---

### 7. **Database Password desde Vault** 🔴 CRÍTICO

**Estado Actual (Local):**
```yaml
# application-local.yml
spring:
  datasource:
    password: sigpass  # ❌ HARDCODED (inseguro)
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
spring:
  datasource:
    password: ${DB_PASSWORD}  # ✅ Cargado desde Vault
```

**Acción:**
- [ ] **GUARDAR** password en Vault:
  ```bash
  vault kv put secret/signature-router/database \
    password='tu_password_seguro_de_produccion'
  ```
- [ ] **CONFIGURAR** Spring Cloud Vault para cargar `${DB_PASSWORD}`
- [ ] **ELIMINAR** password hardcoded de application-uat.yml y application-prod.yml
- [ ] **VERIFICAR** que la aplicación inicia correctamente con password de Vault

**Impacto si NO se activa:**
- 🔒 **RIESGO DE SEGURIDAD:** Password en texto plano
- 🔒 **COMPLIANCE:** Incumplimiento de políticas de seguridad

---

### 8. **Logging Levels** 🟡 IMPORTANTE

**Estado Actual (Local):**
```yaml
# application-local.yml
logging:
  level:
    com.singularbank.signature.routing: DEBUG  # ❌ Demasiado verbose para producción
    org.springframework.web: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml
logging:
  level:
    root: INFO
    com.singularbank.signature.routing: INFO  # ✅ INFO para UAT
    org.springframework: WARN
    org.hibernate: WARN

# application-prod.yml
logging:
  level:
    root: WARN
    com.singularbank.signature.routing: INFO  # ✅ INFO/WARN para Producción
    org.springframework: ERROR
    org.hibernate: ERROR
```

**Acción:**
- [ ] **CAMBIAR** logging level a INFO/WARN en UAT/Prod
- [ ] **CONFIGURAR** appenders para logs estructurados (JSON)
- [ ] **INTEGRAR** con sistema de logs centralizado (ELK, Splunk, CloudWatch)

**Impacto si NO se activa:**
- ⚠️ Logs excesivos (performance degradation)
- ⚠️ Información sensible en logs (SQL queries, request bodies)
- ⚠️ Costos de almacenamiento altos

---

### 9. **Actuator Endpoints** 🔴 CRÍTICO (SEGURIDAD)

**Estado Actual (Local):**
```yaml
# application-local.yml
management:
  endpoints:
    web:
      exposure:
        include: "*"  # ❌ TODOS los endpoints expuestos (inseguro)
  endpoint:
    health:
      show-details: always  # ❌ Siempre muestra detalles (inseguro)
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml / application-prod.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus  # ✅ Solo los necesarios
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized  # ✅ Solo a usuarios autorizados
  security:
    enabled: true  # ✅ Requiere autenticación
```

**Acción:**
- [ ] **RESTRINGIR** endpoints expuestos (solo health, info, metrics, prometheus)
- [ ] **CAMBIAR** `show-details: when-authorized`
- [ ] **HABILITAR** autenticación en endpoints de Actuator
- [ ] **CONFIGURAR** RBAC (solo ADMIN puede ver detalles de health)

**Impacto si NO se activa:**
- 🔒 **RIESGO DE SEGURIDAD:** Información sensible expuesta (config, env vars, heap dumps)
- 🔒 **COMPLIANCE:** Incumplimiento de políticas de seguridad

---

### 10. **Keycloak Issuer URI** 🔴 CRÍTICO

**Estado Actual (Local):**
```yaml
# application-local.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/signature-router  # ❌ Local
```

**Estado Requerido (UAT/Prod):**
```yaml
# application-uat.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak-uat.bank.com/realms/signature-router  # ✅ UAT

# application-prod.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.bank.com/realms/signature-router  # ✅ Prod
```

**Acción:**
- [ ] **CONFIGURAR** Keycloak corporativo (ver `KEYCLOAK-CORPORATE-MIGRATION.md`)
- [ ] **CAMBIAR** `issuer-uri` a Keycloak de UAT/Prod
- [ ] **CAMBIAR** `jwk-set-uri` a Keycloak de UAT/Prod
- [ ] **PROBAR** autenticación con tokens de Keycloak corporativo

**Impacto si NO se activa:**
- ❌ JWT validation fallará
- ❌ Usuarios NO podrán autenticarse
- ❌ Sistema NO funcionará

---

### 11. **Biometric Provider** 🟢 OPCIONAL (Future)

**Estado Actual (Local):**
```yaml
# application.yml
providers:
  biometric:
    enabled: false  # ❌ Stub implementation (future-ready)
```

**Estado Requerido (Futuro):**
- [ ] Integrar SDK de biometría (TouchID, FaceID, Windows Hello, Android Biometric)
- [ ] Cambiar `enabled: true` cuando esté listo
- [ ] Reemplazar `BiometricProvider` stub con implementación real

**Impacto si NO se activa:**
- ✅ OK por ahora (es un stub para futuro)
- ⚠️ Canal BIOMETRIC no estará disponible

---

## 📋 CHECKLIST COMPLETO PARA UAT

### Configuración

- [ ] ✅ **Liquibase**: `enabled: true`, `ddl-auto: validate`
- [ ] ✅ **Kafka**: `enabled: true`, configurar bootstrap-servers
- [ ] ✅ **SMS Provider**: `stub: false`, configurar Twilio en Vault
- [ ] ✅ **Push Provider**: `enabled: true`, configurar FCM JSON
- [ ] ⚠️ **Voice Provider**: `enabled: true` (si se requiere)
- [ ] ✅ **Fallback Chain**: `enabled: true`
- [ ] ✅ **Database Password**: Cargar desde Vault
- [ ] ✅ **Logging**: Cambiar a INFO/WARN
- [ ] ✅ **Actuator**: Restringir endpoints y habilitar seguridad
- [ ] ✅ **Keycloak**: Configurar issuer-uri de UAT

### Infraestructura

- [ ] ✅ **PostgreSQL**: Base de datos de UAT configurada
- [ ] ✅ **Kafka**: Cluster de UAT configurado, topics creados
- [ ] ✅ **Vault**: Vault de UAT configurado con secretos
- [ ] ✅ **Keycloak**: Keycloak corporativo de UAT configurado
- [ ] ✅ **Prometheus/Grafana**: Monitoreo de UAT configurado

### Testing

- [ ] ✅ **Integration Tests**: Ejecutados contra UAT
- [ ] ✅ **E2E Tests**: Flujo completo de firma probado
- [ ] ✅ **SMS Real**: Enviado y recibido
- [ ] ✅ **Push Real**: Enviado y recibido (si aplica)
- [ ] ✅ **Kafka Events**: Publicados y consumidos
- [ ] ✅ **Fallback**: Probado escenario de fallo

---

## 📋 CHECKLIST COMPLETO PARA PRODUCCIÓN

### Configuración (adicional a UAT)

- [ ] ✅ **Logging**: Cambiar a WARN/ERROR
- [ ] ✅ **Actuator**: Solo health + prometheus, seguridad estricta
- [ ] ✅ **Keycloak**: Configurar issuer-uri de Producción
- [ ] ✅ **Vault**: Vault de Producción con secretos
- [ ] ✅ **Rate Limiting**: Configurado (pendiente - Epic 8)
- [ ] ✅ **TLS/HTTPS**: Certificados configurados
- [ ] ✅ **Monitoring**: Alertas configuradas (PagerDuty, Slack)

### Compliance & Security

- [ ] ✅ **Secrets**: TODOS en Vault (0 hardcoded)
- [ ] ✅ **TLS**: Todas las comunicaciones cifradas
- [ ] ✅ **Audit Logs**: Activados y almacenados de forma inmutable
- [ ] ✅ **RBAC**: Roles validados y asignados correctamente
- [ ] ✅ **Pseudonymization**: SHA256 de customer IDs validado
- [ ] ✅ **Data Retention**: Políticas de retención configuradas

### Performance

- [ ] ✅ **Load Tests**: p99 < 500ms validado
- [ ] ✅ **Connection Pooling**: HikariCP optimizado
- [ ] ✅ **Circuit Breakers**: Umbrales configurados
- [ ] ✅ **Timeouts**: Configurados por provider
- [ ] ✅ **JVM Tuning**: Heap size, GC configurado

---

## 🚀 SCRIPT DE ACTIVACIÓN (Ejemplo)

```bash
#!/bin/bash
# activate-uat.sh

echo "🔧 Activando configuración para UAT..."

# 1. Actualizar application-uat.yml
cat > src/main/resources/application-uat.yml <<EOF
spring:
  liquibase:
    enabled: true
    contexts: uat
  jpa:
    hibernate:
      ddl-auto: validate
  kafka:
    enabled: true
    bootstrap-servers: kafka-uat-1:9092,kafka-uat-2:9092,kafka-uat-3:9092

providers:
  sms:
    stub: false  # Twilio REAL
  push:
    enabled: true
  voice:
    enabled: false  # Ajustar según necesidad

fcm:
  enabled: true
  service-account-path: file:/etc/secrets/firebase-uat.json

fallback:
  enabled: true

logging:
  level:
    com.singularbank.signature.routing: INFO
    org.springframework: WARN

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
EOF

echo "✅ Configuración actualizada"
echo "⚠️  Recuerda configurar Vault con los secretos de UAT"
echo "⚠️  Recuerda actualizar Keycloak issuer-uri"
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `KEYCLOAK-CORPORATE-MIGRATION.md` - Migración a Keycloak corporativo
- `CONFIGURAR-TWILIO.md` - Configuración de Twilio (stub vs real)
- `LECCIONES-APRENDIDAS-SPRING-BOOT.md` - Troubleshooting Vault, Kafka, etc.
- `GUIA-PRUEBAS-POSTMAN.md` - Testing con Postman

---

**⚠️ IMPORTANTE:** Esta lista es exhaustiva y crítica para el funcionamiento correcto del sistema en UAT/Producción. NO omitir ningún paso.

**Última actualización:** 27 de noviembre de 2025  
**Revisado por:** BMAD Dev Agent

