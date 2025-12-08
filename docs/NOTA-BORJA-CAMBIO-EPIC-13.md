# Nota: Cambio de Enfoque en Epic 13

**Para:** Borja (MuleSoft Team Lead)  
**De:** Equipo Signature Router  
**Fecha:** 5 de diciembre de 2025  
**Asunto:** Actualización de requerimientos - Epic 13 (Provider Management)

---

## Hola Borja,

Te escribo para informarte de un **cambio importante** en el alcance de Epic 13, que afecta a los requerimientos que te compartí anteriormente.

---

## 📋 Resumen del Cambio

### ❌ **Enfoque Original (Descartado)**
Inicialmente habíamos planteado Epic 13 como un **CRUD completo de providers** desde Signature Router:
- Signature Router crearía y gestionaría providers directamente
- Admin configuraría credenciales y vault paths manualmente
- Providers almacenados en nuestra BD con configuración JSON

### ✅ **Nuevo Enfoque (Actual)**
Ahora Epic 13 es una **integración con MuleSoft como catálogo centralizado**:
- MuleSoft gestiona providers centralmente (single source of truth)
- Signature Router sincroniza el catálogo automáticamente
- Admin solo habilita/deshabilita y configura prioridades de fallback

---

## 🤔 ¿Por Qué el Cambio?

Durante el análisis técnico surgió un punto crítico:

> **"Todos los proveedores se darán de alta en MuleSoft a través de configuración y parametrización de sistemas. MuleSoft nos dejará los providers ahí listos para utilizar, con lo cual no deberíamos estar nosotros dándolos de alta."**

En otras palabras: **duplicar la gestión de providers no tiene sentido** cuando MuleSoft ya es el responsable de configurar y mantener las integraciones con Twilio, AWS SNS, Firebase, etc.

---

## 🎯 Ventajas del Nuevo Enfoque

### **Para el Proyecto:**
1. **Single Source of Truth:** MuleSoft es el único punto de configuración de providers
2. **Menos errores:** No hay riesgo de desincronización entre sistemas
3. **Más seguridad:** Credenciales gestionadas centralmente en MuleSoft (no se replican)
4. **Más agilidad:** Cuando MuleSoft añade un provider, Signature Router lo ve automáticamente

### **Para MuleSoft (tu equipo):**
1. **Menor coordinación:** No necesitas avisarnos cada vez que añades/modificas un provider
2. **Autonomía:** Gestionas providers sin depender de despliegues de Signature Router
3. **Visibilidad:** Ambos equipos vemos el mismo catálogo en tiempo real

### **Para Signature Router:**
1. **Simplicidad:** No gestionamos credenciales ni configuraciones complejas
2. **Resiliencia:** Fallback automático entre providers sin cambios de código
3. **Flexibilidad:** Admin puede priorizar providers sin re-deployment

---

## 📝 Impacto en los Requerimientos de MuleSoft

### **Documento Anterior (Epic 14 - Métricas):**
- ❌ Ya no es prioritario (se pospone)
- Endpoints de métricas agregadas quedan para el futuro

### **Nuevo Documento (Epic 13 - Provider Catalog):**
- ✅ **3 endpoints nuevos requeridos:**
  1. `GET /api/v1/signature/providers` - Listar catálogo de providers
  2. `GET /api/v1/signature/providers/{id}/health` - Health check
  3. `POST /api/v1/signature/providers/{id}/send` - Enviar challenge

**Esfuerzo estimado:** ~3-5 días de desarrollo en tu lado.

---

## 🗓️ Timeline Propuesto

| Fecha | Actividad |
|-------|-----------|
| **6 dic** | Kick-off meeting (validar especificación) |
| **9 dic** | MuleSoft: Endpoints disponibles en DEV |
| **9-13 dic** | Signature Router: Backend implementation |
| **16-20 dic** | Integration testing |
| **23 dic** | Go-live PRD |

---

## 📄 Documentación Actualizada

He actualizado el documento **PROPUESTA-INTERFACES-MULESOFT.md** con:
- ✅ Especificación completa de los 3 endpoints de Epic 13
- ✅ Ejemplos de requests/responses
- ✅ Flujos de sincronización y fallback
- ✅ Requisitos técnicos (OAuth2, rate limiting, timeouts)
- ✅ Preguntas para el kick-off meeting

El documento anterior (métricas Epic 14) queda como **referencia futura**, no bloqueante para Epic 13.

---

## 🤝 Próximos Pasos

1. **Revisar el documento actualizado** (PROPUESTA-INTERFACES-MULESOFT.md)
2. **Kick-off meeting mañana 6 dic** - Validar viabilidad técnica
3. **Confirmar timeline** - ¿Es viable tener los endpoints en DEV para el 9 dic?

---

## ❓ Preguntas Clave para el Kick-off

1. ¿Los 3 endpoints de Epic 13 son viables técnicamente?
2. ¿Cuándo estarían disponibles en DEV?
3. ¿Cómo obtenemos las credenciales OAuth2?
4. ¿Existe documentación OpenAPI/Swagger?
5. ¿Qué providers están actualmente configurados en MuleSoft?

---

## 💬 Conclusión

Lamento el cambio de timón, pero creemos que **este enfoque es mucho más sostenible a largo plazo** y reduce la coordinación entre equipos. MuleSoft sigue siendo el dueño de la configuración de providers, y nosotros simplemente consumimos ese catálogo.

Quedo atento a tus comentarios y disponible para aclarar cualquier duda.

¡Gracias por tu comprensión!

---

**Contacto:**  
[Tu nombre]  
Signature Router Team  
[Email]

---

**Documentos adjuntos:**
- 📄 PROPUESTA-INTERFACES-MULESOFT.md (actualizado 5 dic 2025)
- 📄 Epic 13: Provider Management - MuleSoft Integration (especificación completa)
