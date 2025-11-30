# Índice de Documentación - Signature Router

## 📚 Estructura de Documentación

Este documento sirve como índice central para toda la documentación del proyecto **Signature Router**.

---

## 🏗️ Arquitectura y Diseño

### Documentación Principal
- [**Visión General del Sistema**](architecture/01-system-overview.md) - Arquitectura general del proyecto
- [**Estructura Hexagonal**](architecture/02-hexagonal-structure.md) - Diseño hexagonal del backend
- [**Esquema de Base de Datos**](architecture/03-database-schema.md) - Diseño de la base de datos PostgreSQL
- [**Catálogo de Eventos**](architecture/04-event-catalog.md) - Eventos del sistema
- [**Contratos de API**](architecture/05-api-contracts.yaml) - Especificación OpenAPI
- [**Estrategia de Resiliencia**](architecture/06-resilience-strategy.md) - Circuit breakers, retries, fallbacks
- [**Observabilidad y Seguridad**](architecture/07-observability-security.md) - Métricas, trazas, logs, seguridad
- [**Portal de Administración**](architecture/08-admin-portal.md) - Diseño del panel admin

### Patrones y Decisiones
- [**Outbox Pattern**](architecture/OUTBOX-PATTERN.md) - Implementación del patrón Outbox
- [**ADR-001: Keycloak Database Separation**](architecture/ADR-001-keycloak-separate-database.md)
- [**ADR-003: MuleSoft Integration**](architecture/adr/ADR-003-mulesoft-integration.md)

---

## 🔧 Desarrollo

### Guías Técnicas
- [**Migraciones de Base de Datos**](development/database-migrations.md) - Uso de Liquibase
- [**Mensajería con Kafka**](development/kafka-messaging.md) - Configuración y uso de Kafka
- [**Gestión de Secretos con Vault**](development/vault-secrets.md) - HashiCorp Vault
- [**Validación JWT y OAuth2**](development/jwt-validation-oauth2-pattern.md)
- [**Runbook de Retry de Providers**](development/provider-retry-runbook.md)

### Testing
- [**Guía de Testing**](TESTING-GUIDE.md) - Estrategia completa de testing
- [**Tests Cleanup Summary**](TESTS-CLEANUP-SUMMARY.md)

### Seguridad
- [**RBAC - Control de Acceso**](RBAC.md) - Roles y permisos
- [**Pseudonymization**](PSEUDONYMIZATION.md) - Protección de datos sensibles
- [**Audit Log**](AUDIT-LOG.md) - Registro de auditoría

---

## 📊 Observabilidad

### Monitoreo y Alertas
- [**SLO Monitoring**](observability/SLO_MONITORING.md) - Service Level Objectives
- [**Alerting**](observability/ALERTING.md) - Configuración de alertas
- [**Distributed Tracing**](observability/DISTRIBUTED_TRACING.md) - Trazabilidad distribuida
- [**Incident Postmortem Template**](observability/INCIDENT_POSTMORTEM_TEMPLATE.md)

### Runbooks
- [**Provider Circuit Breaker Open**](observability/runbooks/provider-circuit-breaker-open.md)
- [**SLO Availability Burn Rate**](observability/runbooks/slo-availability-burn-rate.md)

---

## 📝 Product & Planning

### PRD y Epics
- [**Product Requirements Document (PRD)**](prd.md) - Requisitos del producto
- [**Epics del Proyecto**](epics.md) - Listado y descripción de todas las epics

### Historias de Usuario
- [**Epic 8: Seguridad y Cumplimiento**](EPIC-8-README.md)
- [**Epic 10: Quality & Testing Excellence**](EPIC-10-QUALITY-TESTING-EXCELLENCE.md)
- [**Story 10.1: Testing Coverage 75%**](stories/STORY-10.1-TESTING-COVERAGE-75.md)

---

## 📋 Gestión del Proyecto

### Informes Ejecutivos
- [**Informe Ejecutivo CTO**](INFORME-EJECUTIVO-CTO.md) - Estado completo del proyecto
- [**Informe Ejecutivo 2025-11-28**](executive/INFORME-EJECUTIVO-2025-11-28.md)
- [**Informe Migración MuleSoft**](executive/INFORME-MIGRACION-MULESOFT-2025-11-28.md)
- [**Estimación de Esfuerzo**](executive/ESTIMACION-ESFUERZO-PROYECTO-2025-11-28.md)
- [**Evaluación de Calidad**](executive/Evaluación_de_Calidad_del_Proyecto_Signature_Router.md)
- [**Comparativa de Costos de Informes**](COMPARATIVA-COSTOS-INFORMES.md)

### Estado y Sesiones
- [**Proyecto Completo**](PROYECTO-COMPLETO.md) - Resumen completo
- [**Project Final Summary**](PROJECT-FINAL-SUMMARY.md)
- [**Status Real del Proyecto**](STATUS-REAL-PROYECTO.md)
- [**Análisis del Proyecto**](ANALISIS-PROYECTO.md)
- [**Resúmenes de Sesiones**](sessions/) - Todas las sesiones de trabajo

### Cambios y Reorganización
- [**CHANGELOG**](../CHANGELOG.md) - Historial de cambios
- [**Reorganization Summary**](REORGANIZATION-SUMMARY.md) - Refactorización del proyecto
- [**Reorganization README**](REORGANIZATION-README.md)

---

## 🎨 Frontend

### Admin Panel
- [**Admin Panel Guidelines**](frontend/guidelines/admin-panel-page-structure.md)
- [**Admin Sidebar Boilerplate**](frontend/guidelines/admin-sidebar-boilerplate.md)
- [**Platform Admin Panel PRD**](frontend/guidelines/platform-admin-panel-prd-simplified.md)

### Dashboard App
Ver: [**dashboard/docs/**](../../dashboard/docs/)

### Next.js Admin App
Ver: [**app-signature-router-admin/README.md**](../../app-signature-router-admin/README.md)

---

## ⚙️ Backend (Spring Boot)

### Documentación del Servicio
Ver: [**svc-signature-router/README.md**](../svc-signature-router/README.md)

### Setup y Configuración
- [**Configurar Twilio**](../svc-signature-router/CONFIGURAR-TWILIO.md)
- [**Instalar Java 21**](../svc-signature-router/INSTALAR-JAVA-21.md)
- [**Keycloak Setup**](../svc-signature-router/KEYCLOAK-SETUP.md)
- [**Vault Setup**](VAULT-SETUP.md)
- [**Start Docker**](../svc-signature-router/START-DOCKER.md)

### Guías Rápidas
- [**Quick Test Guide**](../svc-signature-router/QUICK-TEST-GUIDE.md)
- [**Guía de Pruebas Postman**](../svc-signature-router/GUIA-PRUEBAS-POSTMAN.md)
- [**Solución Rápida**](../svc-signature-router/SOLUCION-RAPIDA.md)

### Deuda Técnica y Mejoras
- [**Tech Debt**](../svc-signature-router/TECH-DEBT.md)
- [**Lecciones Aprendidas Spring Boot**](../svc-signature-router/LECCIONES-APRENDIDAS-SPRING-BOOT.md)
- [**Critical Improvements Summary**](CRITICAL-IMPROVEMENTS-SUMMARY.md)

---

## 🚀 Setup y Deployment

### Configuración Inicial
- [**Setup Personal Machine**](setup/SETUP-PERSONAL-MACHINE.md)
- [**Checklist Activación UAT/PROD**](setup/CHECKLIST-ACTIVACION-UAT-PROD.md)

### Migraciones
- [**Epic 10 Migration Guide**](EPIC-10-MIGRATION-GUIDE.md)
- [**Keycloak Corporate Migration**](../svc-signature-router/KEYCLOAK-CORPORATE-MIGRATION.md)
- [**Keycloak DB Separation**](../svc-signature-router/KEYCLOAK-DB-SEPARATION-SUMMARY.md)

---

## 📦 Artefactos de Sprints

Todos los artefactos detallados de sprints (contextos, PDFs, especificaciones técnicas) están en:

- [**sprint-artifacts/**](sprint-artifacts/) - 135 archivos con documentación completa de cada sprint

---

## 🔍 Cómo Navegar

### Por Rol

**Desarrollador Backend:**
1. [svc-signature-router/README.md](../svc-signature-router/README.md)
2. [Arquitectura Hexagonal](architecture/02-hexagonal-structure.md)
3. [Guías de Desarrollo](development/)

**Desarrollador Frontend:**
1. [app-signature-router-admin/README.md](../app-signature-router-admin/README.md)
2. [Frontend Guidelines](frontend/guidelines/)
3. [Dashboard Docs](../../dashboard/docs/)

**DevOps/SRE:**
1. [Observabilidad](observability/)
2. [Setup y Deployment](setup/)
3. [Runbooks](observability/runbooks/)

**Product Manager:**
1. [PRD](prd.md)
2. [Epics](epics.md)
3. [Informes Ejecutivos](executive/)

**CTO/Management:**
1. [Informe Ejecutivo CTO](INFORME-EJECUTIVO-CTO.md)
2. [Status del Proyecto](STATUS-REAL-PROYECTO.md)
3. [Evaluación de Calidad](executive/Evaluación_de_Calidad_del_Proyecto_Signature_Router.md)

---

## 📌 Documentos Clave

**Más Importantes:**
1. 📊 [**Informe Ejecutivo CTO**](INFORME-EJECUTIVO-CTO.md) - **Estado completo del proyecto**
2. 🏗️ [**README Principal**](../README.md) - **Punto de entrada al proyecto**
3. 📖 [**PRD**](prd.md) - **Requisitos del producto**
4. 🔧 [**Backend README**](../svc-signature-router/README.md) - **Guía del servicio backend**
5. 🎨 [**Admin README**](../app-signature-router-admin/README.md) - **Guía del panel admin**

---

## 🆕 Últimas Actualizaciones

- **2025-11-30**: Reorganización completa de la documentación
- **2025-11-29**: Epic 10 completada (Quality & Testing Excellence)
- **2025-11-28**: Informes ejecutivos actualizados

---

## 📞 Contacto y Contribución

Para contribuir a la documentación:
1. Sigue la estructura existente
2. Coloca documentos en la carpeta apropiada
3. Actualiza este índice si añades documentación nueva
4. Mantén los enlaces relativos funcionando

---

**Última actualización**: 30 de Noviembre, 2025

