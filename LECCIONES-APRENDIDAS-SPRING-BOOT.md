# Lecciones Aprendidas: Spring Boot 3.x con Arquitectura Hexagonal

> Documento de referencia para proyectos Spring Boot 3.x con Spring Cloud, Vault, Kafka, Liquibase y arquitectura hexagonal.

---

## 📋 Tabla de Contenidos

1. [Configuración de Spring Cloud Vault](#configuración-de-spring-cloud-vault)
2. [Estrategia de Desarrollo Local](#estrategia-de-desarrollo-local)
3. [Liquibase vs Hibernate DDL](#liquibase-vs-hibernate-ddl)
4. [Configuraciones Condicionales](#configuraciones-condicionales)
5. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)
6. [Checklist de Setup Inicial](#checklist-de-setup-inicial)

---

## 🔐 Configuración de Spring Cloud Vault

### ❌ ERROR COMÚN: Usar `bootstrap-{profile}.yml`

En **Spring Boot 3.x**, la configuración de Vault debe estar en `application.yml` o `application-{profile}.yml`, **NO** en `bootstrap-{profile}.yml`.

**Problema:**
- `bootstrap.yml` se procesa **ANTES** de conocer el perfil activo
- `bootstrap-local.yml` **NO se carga** cuando se activa el perfil `local`
- Resultado: Error `Cannot create authentication mechanism for TOKEN`

### ✅ SOLUCIÓN CORRECTA

**Ubicación:** `src/main/resources/application-local.yml`

```yaml
spring:
  cloud:
    vault:
      enabled: true
      token: dev-token-123
      uri: http://localhost:8200
      authentication: TOKEN
      kv:
        enabled: true
        backend: secret
        default-context: signature-router
```

### 📌 Puntos Clave

1. **Siempre en `application-{profile}.yml`** para configuración específica de perfil
2. El `bootstrap.yml` base puede tener configuración común, pero no específica de perfil
3. El error "Cannot create authentication mechanism for TOKEN" = configuración no encontrada
4. **NO deshabilitar Vault**, configurarlo correctamente

---

## 🚀 Estrategia de Desarrollo Local

Para acelerar el desarrollo local sin depender de todos los servicios externos:

### 1. Liquibase → Hibernate DDL

**En `application-local.yml`:**

```yaml
spring:
  liquibase:
    enabled: false  # Deshabilitar Liquibase en desarrollo
  
  jpa:
    hibernate:
      ddl-auto: create  # Hibernate genera el schema automáticamente
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

**Ventajas:**
- ✅ Arranque más rápido
- ✅ No requiere corregir errores de sintaxis en changesets durante iteración
- ✅ El schema se regenera automáticamente con cada cambio en entidades

**Importante:** Re-habilitar Liquibase para producción y crear changesets finales basados en el schema generado.

### 2. Kafka → NoOp Stub

**Crear un stub sin dependencias:**

```java
@Component
@ConditionalOnProperty(prefix = "spring.kafka", name = "enabled", havingValue = "false")
@Slf4j
public class NoOpEventPublisher implements EventPublisher {
    
    @Override
    public void publishSignatureCompleted(SignatureCompletedEvent event) {
        log.info("[NoOp] Would publish SignatureCompletedEvent: {}", event);
    }
    
    @Override
    public void publishSignatureAborted(SignatureAbortedEvent event) {
        log.info("[NoOp] Would publish SignatureAbortedEvent: {}", event);
    }
}
```

**En `application-local.yml`:**

```yaml
spring:
  kafka:
    enabled: false
```

**Marcar configuraciones como condicionales:**

```java
@Configuration
@ConditionalOnProperty(prefix = "spring.kafka", name = "enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConfig {
    // ...
}
```

### 3. Providers Externos (FCM, Twilio, etc.)

**En `application-local.yml`:**

```yaml
providers:
  push:
    enabled: false  # Requiere credenciales FCM
  voice:
    enabled: false  # Requiere credenciales Twilio Voice
  sms:
    enabled: true   # Funciona con credenciales de prueba
```

**Clase del provider:**

```java
@Component("pushProvider")
@ConditionalOnProperty(prefix = "providers.push", name = "enabled", havingValue = "true")
public class PushNotificationProvider implements SignatureProviderPort {
    // ...
}
```

---

## 🗄️ Liquibase vs Hibernate DDL

### Cuándo usar cada uno

| Aspecto | Liquibase | Hibernate DDL |
|---------|-----------|---------------|
| **Desarrollo Local** | ❌ Lento, propenso a errores de sintaxis | ✅ Rápido, auto-regenera schema |
| **Producción** | ✅ Control total, versionado, rollback | ❌ Nunca usar en producción |
| **Trabajo en Equipo** | ✅ Changesets versionados en Git | ❌ Cada dev genera su propio schema |
| **Migraciones** | ✅ ALTER TABLE controlados | ❌ DROP/CREATE sin control |

### Estrategia Recomendada

1. **Desarrollo local**: `hibernate.ddl-auto=create`
2. **Antes de PR**: Crear changesets de Liquibase basados en schema generado
3. **CI/CD**: Liquibase con `contexts: uat` o `prod`

### Errores Comunes de Liquibase

#### 1. Dollar Quotes en Funciones PostgreSQL

❌ **ERROR:**
```yaml
- sql:
    sql: |
      CREATE FUNCTION uuid_generate_v7()
      RETURNS UUID AS $$
      ...
      $$ LANGUAGE plpgsql;
```

✅ **SOLUCIÓN:**
```yaml
- sqlFile:
    path: liquibase/sql/uuid_generate_v7.sql
    splitStatements: false
```

#### 2. `addCheckConstraint` no soportado

❌ **ERROR:**
```yaml
- addCheckConstraint:
    tableName: signature_request
    constraintName: chk_status
    checkCondition: "status IN ('PENDING', 'COMPLETED')"
```

✅ **SOLUCIÓN:**
```yaml
- sql:
    sql: "ALTER TABLE signature_request ADD CONSTRAINT chk_status CHECK (status IN ('PENDING', 'COMPLETED'));"
```

---

## ⚙️ Configuraciones Condicionales

### Patrón para Servicios Opcionales

```java
@Configuration
@ConditionalOnProperty(
    prefix = "spring.kafka", 
    name = "enabled", 
    havingValue = "true", 
    matchIfMissing = true  // Por defecto habilitado
)
public class KafkaConfig {
    // Beans de Kafka
}
```

### Importar la Anotación

```java
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
```

### Aplicar a Múltiples Clases

- `KafkaConfig`
- `KafkaTopicConfig`
- `KafkaEventPublisher`
- Todas las clases relacionadas con el servicio opcional

---

## ❌ Errores Comunes y Soluciones

### 1. "Cannot create authentication mechanism for TOKEN"

**Causa:** Configuración de Vault en `bootstrap-local.yml` en lugar de `application-local.yml`

**Solución:** Mover configuración a `application-local.yml`

### 2. "No qualifying bean of type 'EventPublisher'"

**Causa:** `KafkaEventPublisher` está deshabilitado pero no hay implementación alternativa

**Solución:** Crear `NoOpEventPublisher` con `@ConditionalOnProperty(..., havingValue = "false")`

### 3. "The Bean Validation API is on the classpath but no implementation could be found"

**Causa:** Faltan dependencias de validación

**Solución:** Agregar al `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### 4. "Could not resolve placeholder 'spring.kafka.bootstrap-servers'"

**Causa:** `@Value` inyectando propiedades de Kafka cuando está deshabilitado

**Solución:** Marcar la clase de configuración con `@ConditionalOnProperty`

### 5. YAML "duplicate key kafka"

**Causa:** Múltiples bloques `kafka:` dentro de `spring:`

**Solución:** Fusionar en un solo bloque:

```yaml
spring:
  kafka:
    enabled: false
    # No repetir "kafka:" más abajo
```

### 6. Liquibase "column already exists"

**Causa:** Base de datos con schema previo de ejecuciones anteriores

**Solución:** 
```bash
docker-compose down -v  # Eliminar volúmenes
docker-compose up -d    # Recrear con BD limpia
```

---

## ✅ Checklist de Setup Inicial

### 1. Dependencias Esenciales

```xml
<!-- Validación -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Vault (si se usa) -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-vault-config</artifactId>
</dependency>
```

### 2. Configuración Local (`application-local.yml`)

```yaml
spring:
  # Liquibase: Deshabilitar en desarrollo
  liquibase:
    enabled: false
  
  # JPA: Usar Hibernate DDL
  jpa:
    hibernate:
      ddl-auto: create
    show-sql: true
  
  # Kafka: Deshabilitar si no es necesario
  kafka:
    enabled: false
  
  # Vault: Configurar correctamente
  cloud:
    vault:
      enabled: true
      token: dev-token-123
      uri: http://localhost:8200
      authentication: TOKEN
      kv:
        enabled: true
        backend: secret
        default-context: your-app-name

# Providers: Deshabilitar los que requieren credenciales externas
providers:
  push:
    enabled: false
  voice:
    enabled: false
```

### 3. Servicios Opcionales: Stubs

- [ ] Crear `NoOpEventPublisher` si Kafka está deshabilitado
- [ ] Marcar `KafkaConfig` con `@ConditionalOnProperty`
- [ ] Marcar `KafkaTopicConfig` con `@ConditionalOnProperty`

### 4. Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# Configurar secretos en Vault
docker exec -e VAULT_TOKEN=dev-token-123 your-vault-container \
  vault kv put secret/your-app-name \
  database.password=yourpass \
  spring.datasource.password=yourpass

# Verificar servicios
docker ps
```

### 5. Variables de Entorno Java

```bash
# Windows PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Linux/Mac
export JAVA_HOME=/path/to/jdk-21
export PATH=$JAVA_HOME/bin:$PATH
```

### 6. Arranque de Aplicación

```bash
mvn clean install -DskipTests
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

---

## 🎯 Principios de Diseño

### 1. No Deshabilitar, Configurar Correctamente

❌ **Mal:** Deshabilitar Vault porque "no funciona"
✅ **Bien:** Investigar y configurar correctamente en `application-local.yml`

### 2. Usar Condicionales para Servicios Opcionales

Los servicios externos (Kafka, providers externos) deben poder deshabilitarse limpiamente:

```java
@ConditionalOnProperty(prefix = "service.name", name = "enabled", havingValue = "true")
```

### 3. Stubs para Desarrollo Local

Crear implementaciones `NoOp` de puertos para desarrollo sin dependencias externas.

### 4. Liquibase para Producción, Hibernate para Desarrollo

- Desarrollo: Velocidad y flexibilidad
- Producción: Control y trazabilidad

### 5. Bean Validation Siempre Presente

Si usas `@Validated`, asegura que `spring-boot-starter-validation` esté en el POM.

---

## 📚 Referencias

- [Spring Cloud Vault Reference](https://docs.spring.io/spring-cloud-vault/docs/current/reference/html/)
- [Spring Boot 3.x Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide)
- [Liquibase Best Practices](https://www.liquibase.org/get-started/best-practices)
- [Conditional Beans in Spring](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.developing-auto-configuration.condition-annotations)

---

## 🔄 Mantenimiento de este Documento

**Última actualización:** 2025-11-27

Agregar nuevas lecciones aprendidas a medida que surjan durante el desarrollo del proyecto.

---

**¡Éxito en tu próximo proyecto Spring Boot!** 🚀

