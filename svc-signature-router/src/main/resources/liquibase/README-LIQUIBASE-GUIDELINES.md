# Liquibase Guidelines - Organización

## Estructura Mandatoria de Changesets

Este documento preserva la estructura de changesets mandatoria de la organización para cuando se despliegue a DEV/UAT/PROD.

## Estado Actual (LOCAL)

- **Liquibase:** DESHABILITADO (`enabled: false`)
- **Hibernate:** `ddl-auto: update` (gestiona el esquema automáticamente)
- **Changesets:** VACÍOS (se crearán para el primer despliegue)

## Estructura de Directorios

```
liquibase/
├── changelog-master.yaml          # Master changelog (apunta a changes/{env}/)
├── changes/
│   ├── dev/                       # Changesets específicos de DEV
│   ├── uat/                       # Changesets específicos de UAT
│   └── prod/                      # Changesets para PRODUCCIÓN
└── sql/                           # Scripts SQL reutilizables
    └── uuid_generate_v7.sql       # Función UUIDv7 (si es necesaria)
```

## Convención de Nomenclatura

### Formato de Archivos
```
NNNN-descripcion-corta.yaml
```

Ejemplos:
- `0001-create-uuidv7-function.yaml`
- `0002-create-signature-request-table.yaml`
- `0003-create-signature-challenge-table.yaml`

### Estructura de Changeset

```yaml
databaseChangeLog:
  - changeSet:
      id: NNNN
      author: <nombre> <<email>>
      labels: story-X.Y  # Opcional: referencia a story
      context: dev,uat,prod  # Contextos donde aplica
      changes:
        - createTable:
            tableName: nombre_tabla
            columns:
              - column:
                  name: id
                  type: uuid
                  constraints:
                    primaryKey: true
                    nullable: false
                  defaultValueComputed: uuid_generate_v7()
              # ... más columnas
        - addForeignKeyConstraint:
            # ... constraints
      rollback:
        - dropTable:
            tableName: nombre_tabla
```

## Changelog Master

El archivo `changelog-master.yaml` DEBE seguir esta estructura:

```yaml
databaseChangeLog:
  # Desarrollo
  - includeAll:
      path: changes/dev
      relativeToChangelogFile: true
      context: dev,local

  # UAT
  - includeAll:
      path: changes/uat
      relativeToChangelogFile: true
      context: uat

  # Producción
  - includeAll:
      path: changes/prod
      relativeToChangelogFile: true
      context: prod
```

## Secuencia de Changesets para Primer Despliegue

Cuando se cree el changeset inicial, respetar este orden:

### 1. Funciones Base (0001)
- `0001-create-uuidv7-function.yaml`
  - Función `uuid_generate_v7()` para PKs
  - Script SQL: `liquibase/sql/uuid_generate_v7.sql`

### 2. Tablas Core (0002-0007)
- `0002-create-signature-request-table.yaml`
- `0003-create-signature-challenge-table.yaml`
- `0004-create-routing-rule-table.yaml`
- `0005-create-connector-config-table.yaml`
- `0006-create-outbox-event-table.yaml`
- `0007-create-audit-log-table.yaml`

### 3. Tablas de Soporte (0008-0015)
- `0009-create-idempotency-record-table.yaml`
- `0015-create-provider-config-tables.yaml` (incluye `provider_config` + `provider_config_history`)

### 4. Seed Data (si aplica)
- `0015-seed-initial-providers.yaml` (dentro del changeset de provider_config)

## Propiedades por Entorno

### application-dev.yml
```yaml
spring:
  liquibase:
    enabled: true
    change-log: classpath:liquibase/changelog-master.yaml
    contexts: dev
  jpa:
    hibernate:
      ddl-auto: none  # Liquibase gestiona el esquema
```

### application-uat.yml
```yaml
spring:
  liquibase:
    enabled: true
    change-log: classpath:liquibase/changelog-master.yaml
    contexts: uat
  jpa:
    hibernate:
      ddl-auto: none
```

### application-prod.yml
```yaml
spring:
  liquibase:
    enabled: true
    change-log: classpath:liquibase/changelog-master.yaml
    contexts: prod
  jpa:
    hibernate:
      ddl-auto: none
```

### application.yml (LOCAL)
```yaml
spring:
  liquibase:
    enabled: false  # DESHABILITADO en local
  jpa:
    hibernate:
      ddl-auto: update  # Hibernate gestiona el esquema
```

## Reglas Mandatorias de la Organización

### 1. Separación por Entornos
- **DEV:** Puede tener changesets experimentales
- **UAT:** Debe reflejar producción (sin datos sensibles)
- **PROD:** Solo changesets validados y aprobados

### 2. Convenciones de Columnas
```yaml
# Todas las tablas DEBEN tener:
- column:
    name: id
    type: uuid
    constraints:
      primaryKey: true
      nullable: false
    defaultValueComputed: uuid_generate_v7()

- column:
    name: created_at
    type: timestamp with time zone
    defaultValueComputed: CURRENT_TIMESTAMP
    constraints:
      nullable: false

- column:
    name: updated_at
    type: timestamp with time zone
    defaultValueComputed: CURRENT_TIMESTAMP
    constraints:
      nullable: false
```

### 3. Auditoría (para tablas de configuración)
```yaml
- column:
    name: created_by
    type: varchar(255)
    constraints:
      nullable: false

- column:
    name: updated_by
    type: varchar(255)
```

### 4. Comentarios
```yaml
- addColumn:
    tableName: nombre_tabla
    columns:
      - column:
          name: nueva_columna
          type: varchar(255)
          remarks: "Descripción del propósito de la columna"
```

### 5. Rollback Obligatorio
TODO changeset DEBE incluir un `rollback` funcional:
```yaml
rollback:
  - dropTable:
      tableName: nombre_tabla
  # o
  - sql:
      sql: "ALTER TABLE nombre_tabla DROP COLUMN nueva_columna;"
```

### 6. Índices
```yaml
- createIndex:
    indexName: idx_tabla_columna
    tableName: nombre_tabla
    columns:
      - column:
          name: columna
    # Añadir comentario explicando el propósito del índice
    remarks: "Índice para optimizar búsquedas por X"
```

### 7. Scripts SQL Externos
Para funciones o scripts complejos, usar `sqlFile`:
```yaml
- changeSet:
    id: 0001
    author: team
    changes:
      - sqlFile:
          path: liquibase/sql/uuid_generate_v7.sql
          relativeToChangelogFile: false
          splitStatements: false
    rollback:
      - sql:
          sql: "DROP FUNCTION IF EXISTS uuid_generate_v7();"
```

## Proceso de Creación para Primer Despliegue

### Paso 1: Generar Changeset Inicial desde Hibernate

Opción A - Usando Liquibase Hibernate Plugin:
```bash
mvn liquibase:diff
```

Opción B - Manualmente desde entidades JPA actuales:
1. Revisar todas las entidades en `src/main/java/.../entity/`
2. Crear changesets manualmente siguiendo la estructura mandatoria
3. Validar contra el esquema generado por Hibernate en local

### Paso 2: Validar Estructura
```bash
mvn liquibase:validate
```

### Paso 3: Probar en DEV
```bash
# Configurar application-dev.yml
# Desplegar en entorno DEV
mvn liquibase:update -Pdev
```

### Paso 4: Promover a UAT/PROD
- Copiar changesets validados de `changes/dev/` a `changes/uat/` y `changes/prod/`
- Ajustar seed data si es necesario
- Ejecutar en orden: UAT → validación → PROD

## Evolutivos Posteriores

Después del changeset inicial, TODOS los cambios de esquema deben:

1. **Crear nuevo changeset** (nunca modificar existentes)
2. **Seguir numeración consecutiva** (0018, 0019, etc.)
3. **Incluir rollback funcional**
4. **Probar en DEV primero**
5. **Documentar en comentarios** el motivo del cambio
6. **Referenciar story/ticket** en labels

Ejemplo:
```yaml
databaseChangeLog:
  - changeSet:
      id: 0018
      author: dev-team <dev@signature-router.com>
      labels: story-14.2
      context: dev,uat,prod
      comment: "Añadir columna 'retry_count' a signature_challenge para tracking de reintentos"
      changes:
        - addColumn:
            tableName: signature_challenge
            columns:
              - column:
                  name: retry_count
                  type: integer
                  defaultValue: 0
                  constraints:
                    nullable: false
                  remarks: "Contador de reintentos del challenge"
      rollback:
        - dropColumn:
            tableName: signature_challenge
            columnName: retry_count
```

## Generación Automática vs Manual

### Cuándo usar generación automática
- Changeset inicial completo
- Sincronización de esquemas entre entornos
- Validación de diferencias

### Cuándo crear manualmente
- Cambios complejos con lógica de negocio
- Migraciones de datos
- Renombrado de columnas/tablas (requiere preservar datos)
- Cambios con dependencias externas

## Notas Importantes

1. **NUNCA modificar changesets ya ejecutados** en UAT/PROD
2. **SIEMPRE probar rollback** antes de desplegar
3. **Coordinar cambios de esquema** con el equipo antes de crear changesets
4. **Documentar cambios breaking** que requieran actualización de código
5. **Mantener sincronía** entre entidades JPA y changesets

## Referencias

- Liquibase Best Practices: https://www.liquibase.org/get-started/best-practices
- Documentación Interna: [AÑADIR LINK A CONFLUENCE/WIKI DE LA ORGANIZACIÓN]

