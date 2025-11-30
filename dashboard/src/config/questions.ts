export interface Respuesta {
    valor: string
    texto: string
    textoMobile?: string
    tooltip?: string
    tooltipMobile?: string
    puntuacion: number
}

export interface Pregunta {
    id: number
    ambitoKey: string|null
    selectorKey: string|null
    pregunta: string
    preguntaMobile?: string
    subtitulo?: string
    subtituloMobile?: string
    imagen?: string
    ponderacion: number // 0-100
    respuestas?: Respuesta[]
    valorSeleccion?: string
    type: 'selector' | 'text' | 'textarea'
    urlPdf?: string,
}

export const preguntas: Pregunta[] = [
    // ÁMBITO: PERSONAS
    {
        id: 1,
        ambitoKey: 'personas',
        selectorKey: null,
        pregunta: 'Responsabilidad de la ciberseguridad en la empresa:',
        subtitulo: '',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No hay un responsable definido; se gestiona de forma reactiva solo cuando surge algún problema.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Un empleado asume la seguridad junto con otras tareas, sin especialización específica.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Hay al menos una persona encargada de TI/ciberseguridad, aunque con recursos limitados.',
                puntuacion: 15,
            },
            {
                valor: 'd',
                texto: 'Existe un equipo o responsable dedicado exclusivamente a la ciberseguridad.',
                puntuacion: 20,
            }
        ],
    },
    {
        id: 2,
        ambitoKey: 'personas',
        selectorKey: null,
        pregunta: 'Compromiso de la dirección con la ciberseguridad:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'La dirección no trata temas de ciberseguridad ni promueve acciones al respecto.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'La dirección reconoce la importancia pero no toma medidas concretas ni asigna recursos.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'La dirección apoya algunas iniciativas básicas de seguridad (por ejemplo, autoriza formaciones puntuales).',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'La dirección está comprometida activamente, impulsando políticas y dedicando recursos a la ciberseguridad.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 3,
        ambitoKey: 'personas',
        selectorKey: null,
        pregunta: 'Formación y concienciación de los empleados:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se ofrece capacitación en ciberseguridad a los empleados.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se han compartido algunas recomendaciones informales, pero sin formación estructurada.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se realizan capacitaciones ocasionales o básicas sobre ciberseguridad.',
                puntuacion: 15,
            },
            {
                valor: 'd',
                texto: 'Hay un programa regular de formación y concienciación en ciberseguridad para todo el personal.',
                puntuacion: 20,
            },
        ],
    },
    {
        id: 4,
        ambitoKey: 'personas',
        selectorKey: null,
        pregunta: 'Comunicación y reporte de incidentes de seguridad:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No existe un canal establecido; los empleados no sabrían a quién informar sobre incidentes.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Si ocurre algo, los empleados improvisan a quién avisar, pero sin un procedimiento claro.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Hay un procedimiento básico para reportar incidentes, aunque no todos lo conocen bien.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Existe un protocolo claro y conocido por todos para reportar incidentes o actividades sospechosas.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 5,
        ambitoKey: 'personas',
        selectorKey: null,
        pregunta: 'Concienciación sobre amenazas (ej. phishing):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'Los empleados no están al tanto de amenazas comunes como phishing o malware.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se han enviado uno o dos avisos sobre riesgos (phishing, etc.), pero sin mayor seguimiento. ',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se realizan comunicaciones ocasionales sobre estas amenazas y algunos empleados están atentos.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Los empleados están bien informados; se hacen campañas de concienciación o simulacros de phishing regularmente.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 20,
        ambitoKey: null,
        selectorKey: null,
        pregunta: '¿Cuántos empleados tiene tu empresa?',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: '0-10',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: '11-50',
                puntuacion: 0,
            },
            {
                valor: 'c',
                texto: '51-250.',
                puntuacion: 0,
            },
            {
                valor: 'd',
                texto: 'Más de 250',
                puntuacion: 0,
            },
        ],
    },
    {
        id: 6,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Políticas internas de seguridad de la información:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No existen políticas o normas internas de seguridad documentadas.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Hay algunas reglas informales, pero nada formalmente documentado.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se dispone de políticas de seguridad escritas, aunque algo desactualizadas o no se difunden mucho.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Se cuenta con políticas de seguridad formalizadas, actualizadas y comunicadas a todos los empleados.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 7,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Plan de respuesta a incidentes de ciberseguridad:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No hay un plan; se reaccionaría sobre la marcha ante un incidente.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Existe una idea general de qué hacer ante incidentes, pero nada establecido por escrito.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Hay un plan básico por escrito para responder a incidentes, aunque con poca difusión o pruebas.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Existe un plan formal de respuesta a incidentes, actualizado y probado periódicamente.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 8,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Copias de seguridad y recuperación de datos:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se realizan copias de seguridad regularmente.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se hacen copias de seguridad ocasionalmente, pero sin periodicidad fija ni pruebas de restauración.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se realizan copias de seguridad periódicas (ej. semanales), pero no siempre se verifican ni se almacenan fuera del sitio.',
                puntuacion: 15,
            },
            {
                valor: 'd',
                texto: 'Se efectúan copias de seguridad frecuentes (diarias o casi diarias), con verificación regular y almacenamiento seguro y externo (fuera de las instalaciones).',
                puntuacion: 20,
            },
        ],
    },
    {
        id: 9,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Cumplimiento de normativas y estándares de seguridad:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se considera el cumplimiento de normativas de seguridad más allá de las obligaciones legales básicas.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se cumple lo mínimo legal (p. ej. RGPD para protección de datos), pero sin medidas adicionales.',
                puntuacion: 3,
            },
            {
                valor: 'c',
                texto: 'Se siguen algunas buenas prácticas o marcos de seguridad de forma voluntaria, aunque sin certificaciones formales.',
                puntuacion: 7,
            },
            {
                valor: 'd',
                texto: 'Se cumple con normativas específicas del sector o se cuenta con certificaciones (ej. ISO 27001, ENS, PCI-DSS).',
                puntuacion: 10,
            },
        ],
    },
    {
        id: 10,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Evaluaciones de riesgo y auditorías de seguridad:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se han realizado evaluaciones de riesgos ni auditorías de ciberseguridad.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Solo se revisa la seguridad tras incidentes o a demanda, sin evaluaciones proactivas.',
                puntuacion: 3,
            },
            {
                valor: 'c',
                texto: 'Se han hecho evaluaciones puntuales de seguridad de forma interna, pero no regularmente.',
                puntuacion: 7,
            },
            {
                valor: 'd',
                texto: 'Se realizan análisis de riesgos o auditorías periódicas, preferiblemente con expertos externos.',
                puntuacion: 10,
            },
        ],
    },
    {
        id: 11,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Plan de continuidad de negocio/recuperación ante desastres:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No existe un plan formal para mantener la operatividad tras un incidente grave o desastre.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se confía en soluciones ad hoc; no hay un plan documentado de continuidad.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Hay un plan de continuidad básico, pero podría no cubrir todos los escenarios o no se ha probado.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Se dispone de un plan completo de continuidad y recuperación, revisado y probado regularmente.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 12,
        ambitoKey: 'procesos',
        selectorKey: null,
        pregunta: 'Control de accesos y gestión de cuentas de usuario:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No hay procedimientos; cuentas y accesos de empleados que salen pueden quedar activos indefinidamente.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se revocan accesos importantes cuando alguien sale, pero sin un proceso definido ni cobertura total.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Existe un proceso para altas, cambios y bajas de usuarios, aunque a veces con demoras o excepciones.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Hay un control riguroso de accesos: las cuentas se gestionan eficientemente y se eliminan o ajustan inmediatamente ante cambios de personal.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 21,
        ambitoKey: null,
        selectorKey: null,
        pregunta: 'Dependiendo del sector, los riesgos en ciberseguridad pueden variar. ¿A qué se dedica tu empresa?',
        ponderacion: 1,
        type: 'text',
    },
    {
        id: 13,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Protección de la red (firewall y seguridad perimetral):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se cuenta con firewall ni medidas de seguridad perimetral en la red de la empresa.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se usa solo el router básico del proveedor de Internet, con su configuración por defecto.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Existe al menos un firewall o router seguro con configuración personalizada básica.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Se dispone de firewall(s) correctamente configurados y, si aplica, segmentación de la red para mayor seguridad.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 14,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Protección de los equipos (antivirus/antimalware):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se utilizan soluciones antivirus o antimalware actualizadas en los equipos.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Solo algunos equipos tienen antivirus y no siempre está actualizado.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Todos los equipos tienen antivirus actualizado, aunque sin políticas centralizadas de gestión.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Se cuenta con antivirus/antimalware en todos los dispositivos, gestionado centralmente y con actualizaciones y análisis periódicos.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 15,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Actualización de sistemas y software (gestión de parches):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'Los sistemas y programas no se actualizan regularmente; se utilizan versiones antiguas.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se actualizan solo algunos sistemas importantes; otros quedan desatendidos por largos periodos.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se aplican actualizaciones periódicas en la mayoría de sistemas, aunque no siempre de forma inmediata.',
                puntuacion: 15,
            },
            {
                valor: 'd',
                texto: 'Existe un proceso riguroso de gestión de parches: todos los sistemas se mantienen al día con las últimas actualizaciones de seguridad.',
                puntuacion: 20,
            },
        ],
    },
    {
        id: 16,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Control de accesos y autenticación (contraseñas y 2FA):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No hay medidas técnicas especiales: se usan contraseñas simples, sin requisitos ni segunda capa de autenticación.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se imponen algunos requisitos de contraseña (longitud, complejidad), pero no se utiliza 2FA.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se implementan contraseñas robustas y para algunos servicios críticos se usa autenticación de doble factor.',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Se aplican políticas estrictas de acceso: contraseñas robustas (con caducidad) y se utiliza 2FA en todos los accesos sensibles.',
                puntuacion: 15,
            },
        ],
    },
    {
        id: 17,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Protección de datos sensibles (cifrado):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se emplean medidas de cifrado para la información sensible.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se cifra únicamente lo imprescindible (por ej., discos de portátiles de directivos), pero no es generalizado.',
                puntuacion: 3,
            },
            {
                valor: 'c',
                texto: 'Se han implementado medidas de cifrado en algunos sistemas o datos importantes (ej. bases de datos, unidades USB).',
                puntuacion: 7,
            },
            {
                valor: 'd',
                texto: 'La información sensible se cifra tanto en almacenamiento como en transmisión; hay políticas claras de cifrado.',
                puntuacion: 10,
            },
        ],
    },
    {
        id: 18,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Monitorización y detección de amenazas:',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No se monitorizan los sistemas ni se revisan registros de seguridad de forma activa.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Solo se revisan logs/eventos de seguridad cuando ya ocurrió algo anómalo.',
                puntuacion: 3,
            },
            {
                valor: 'c',
                texto: 'Se realiza cierta monitorización básica (revisión periódica de registros importantes).',
                puntuacion: 7,
            },
            {
                valor: 'd',
                texto: 'Se monitorizan activamente los sistemas y se utilizan alertas o herramientas de detección para identificar amenazas en tiempo real.',
                puntuacion: 10,
            },
        ],
    },
    {
        id: 19,
        ambitoKey: 'tecnologias',
        selectorKey: null,
        pregunta: 'Control de dispositivos y uso de equipos personales (BYOD):',
        ponderacion: 1,
        type: 'selector',
        respuestas: [
            {
                valor: 'a',
                texto: 'No hay control sobre los dispositivos: se permiten dispositivos personales en la red sin restricciones.',
                puntuacion: 0,
            },
            {
                valor: 'b',
                texto: 'Se desaconseja el uso de dispositivos personales, pero no hay una política clara ni medidas de control.',
                puntuacion: 5,
            },
            {
                valor: 'c',
                texto: 'Se permite el BYOD pero con ciertas medidas (registro de dispositivos autorizados, etc.).',
                puntuacion: 10,
            },
            {
                valor: 'd',
                texto: 'Los dispositivos personales que acceden a recursos de la empresa están sujetos a políticas estrictas y herramientas de gestión (MDM); los no autorizados están prohibidos.',
                puntuacion: 15,
            },
        ],
    },
]