'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Register fonts (optional, using default fonts for now)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf'
// });

interface Incident {
  internalId: number;
}

interface IncidentVersion {
  fechaResolucion?: string | Date | null;
  versionNumber: number;
  fechaDeteccion?: string | Date | null;
  tipoIncidente?: string | null;
  categoriasDatos?: string | null;
  numeroAfectados?: number | null;
  descripcion?: string | null;
  consecuencias?: string | null;
  medidasAdoptadas?: string | null;
  mediosComunicacion?: string;
  motivosRetraso?: string;
  fechaComunicacion?: string | Date | null;
  fechaNotificacion?: string | Date | null;
  tiempoComunicacion?: string;
  tiempoNotificacion?: string;
  organos?: string[];
  sinComunicacion?: boolean;
  sinNotificacion?: boolean;
  // Additional required properties
  notificadoAEPD?: boolean | null;
  fechaNotificacionAEPD?: string | Date | null;
  notificadoAfectados?: boolean | null;
  fechaNotificacionAfectados?: string | Date | null;
  notasInternas?: string | null;
  token: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #000',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  brandingSection: {
    alignItems: 'flex-end',
    minWidth: 150,
  },
  logo: {
    width: 120,
    height: 'auto',
    marginBottom: 5,
  },
  brandText: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  titleSection: {
    flex: 1,
    marginRight: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    borderLeft: '3px solid #374151',
  },
  companyInfoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  companyInfoText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: '#666',
    marginBottom: 3,
  },
  disclaimer: {
    backgroundColor: '#fef3cd',
    padding: 10,
    borderRadius: 5,
    borderLeft: '3px solid #f59e0b',
    marginTop: 20,
  },
  disclaimerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: '#78350f',
    textAlign: 'justify',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '35%',
    color: '#666',
  },
  value: {
    fontSize: 10,
    width: '65%',
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  badge: {
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 3,
    marginLeft: 10,
  },
  resolvedBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  pendingBadge: {
    backgroundColor: '#eab308',
    color: '#fff',
  },
  tokenBox: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  tokenText: {
    fontSize: 9,
    fontFamily: 'Courier',
    wordBreak: 'break-all',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    width: '48%',
  },
  notificationBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  notificationStatus: {
    fontSize: 10,
  },
  checkmark: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  cross: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  versionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

interface IncidentPDFDocumentProps {
  incident: Incident;
  currentVersion: IncidentVersion;
  totalVersions: number;
  isPublic?: boolean;
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'No especificada';
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
};

const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return 'No especificada';
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
};

export const IncidentPDFDocument: React.FC<IncidentPDFDocumentProps> = ({
  incident,
  currentVersion,
  totalVersions,
  isPublic = false,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {/* Header Top with Logo */}
        <View style={styles.headerTop}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                Incidente de Ciberseguridad #{incident.internalId}
              </Text>
              {currentVersion.fechaResolucion ? (
                <View style={[styles.badge, styles.resolvedBadge]}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>Resuelto</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.pendingBadge]}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>En proceso</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              Registro según RGPD Art. 33 - Notificación de violaciones de seguridad
            </Text>
          </View>
          
          {/* Branding Section */}
          <View style={styles.brandingSection}>
            <Image
              style={styles.logo}
              src="/minery/minery-logo-horizontal-dark.png"
            />
            <Text style={styles.brandText}>
              Ciberseguridad y Transformación Digital
            </Text>
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyInfoTitle}>MINERY REPORT, S.L.</Text>
          <Text style={styles.companyInfoText}>
            🌐 www.mineryreport.com
          </Text>
          <Text style={styles.companyInfoText}>
            ✉️ contacto@mineryreport.com
          </Text>
          <Text style={styles.companyInfoText}>
            📞 +34 91 904 97 88
          </Text>
          <Text style={styles.companyInfoText}>
            © 2025 Todos los derechos reservados.
          </Text>
        </View>
        
        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={{ fontSize: 10, color: '#666' }}>
            Versión {currentVersion.versionNumber} de {totalVersions}
          </Text>
          <Text style={{ fontSize: 10, color: '#666' }}>
            Generado: {formatDateTime(new Date())}
          </Text>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Incidente</Text>
        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha de detección:</Text>
              <Text style={styles.value}>
                {formatDateTime(currentVersion.fechaDeteccion)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de incidente:</Text>
              <Text style={styles.value}>
                {currentVersion.tipoIncidente || 'No especificado'}
              </Text>
            </View>
          </View>
          <View style={styles.gridColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Categorías de datos:</Text>
              <Text style={styles.value}>
                {currentVersion.categoriasDatos || 'No especificado'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Número de afectados:</Text>
              <Text style={styles.value}>
                {currentVersion.numeroAfectados || 0} personas
              </Text>
            </View>
          </View>
        </View>
        
        {currentVersion.descripcion && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Descripción:</Text>
            <Text style={styles.text}>{currentVersion.descripcion}</Text>
          </View>
        )}
      </View>

      {/* Impact and Measures */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impacto y Medidas</Text>
        
        {currentVersion.consecuencias && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Consecuencias/Riesgos:</Text>
            <Text style={styles.text}>{currentVersion.consecuencias}</Text>
          </View>
        )}
        
        {currentVersion.medidasAdoptadas && (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>Medidas adoptadas:</Text>
            <Text style={styles.text}>{currentVersion.medidasAdoptadas}</Text>
          </View>
        )}
        
        {currentVersion.fechaResolucion && (
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de resolución:</Text>
            <Text style={styles.value}>
              {formatDateTime(currentVersion.fechaResolucion)}
            </Text>
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado de Notificaciones</Text>
        
        <View style={styles.notificationBox}>
          <Text style={styles.notificationStatus}>
            Notificado a AEPD: {' '}
            {currentVersion.notificadoAEPD ? (
              <Text style={styles.checkmark}>✓ Sí</Text>
            ) : (
              <Text style={styles.cross}>✗ No</Text>
            )}
          </Text>
          {currentVersion.notificadoAEPD && currentVersion.fechaNotificacionAEPD && (
            <Text style={{ fontSize: 10, color: '#666' }}>
              {formatDate(currentVersion.fechaNotificacionAEPD)}
            </Text>
          )}
        </View>
        
        <View style={styles.notificationBox}>
          <Text style={styles.notificationStatus}>
            Notificado a afectados: {' '}
            {currentVersion.notificadoAfectados ? (
              <Text style={styles.checkmark}>✓ Sí</Text>
            ) : (
              <Text style={styles.cross}>✗ No</Text>
            )}
          </Text>
          {currentVersion.notificadoAfectados && currentVersion.fechaNotificacionAfectados && (
            <Text style={{ fontSize: 10, color: '#666' }}>
              {formatDate(currentVersion.fechaNotificacionAfectados)}
            </Text>
          )}
        </View>
      </View>

      {/* Internal Notes - Only show if not public */}
      {!isPublic && currentVersion.notasInternas && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Internas</Text>
          <Text style={styles.text}>{currentVersion.notasInternas}</Text>
        </View>
      )}

      {/* Token */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Token de Verificación</Text>
        <View style={styles.tokenBox}>
          <Text style={styles.tokenText}>{currentVersion.token}</Text>
        </View>
        <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
          Este token único identifica de forma inequívoca esta versión del incidente
        </Text>
      </View>

      {/* Legal Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>EXENCIÓN DE RESPONSABILIDAD</Text>
        <Text style={styles.disclaimerText}>
          MINERY REPORT, S.L. actúa exclusivamente como proveedor de la plataforma tecnológica para la generación y gestión de registros de incidentes de ciberseguridad. Los datos, información y contenido incluidos en este reporte han sido proporcionados directamente por el usuario de la plataforma. MINERY REPORT, S.L. no verifica, valida ni asume responsabilidad alguna sobre la exactitud, completitud, veracidad o adecuación de la información contenida en este documento. El usuario es el único responsable de la calidad, precisión y cumplimiento normativo de los datos introducidos en el sistema. Este reporte se genera automáticamente basándose en la información proporcionada por el usuario y debe ser revisado y validado por personal cualificado antes de su uso para fines oficiales o legales.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 3 }}>
              Documento generado automáticamente el {formatDateTime(new Date())}
            </Text>
            <Text style={{ marginBottom: 3 }}>
              Este registro cumple con los requisitos del Reglamento General de Protección de Datos (RGPD) Art. 33
            </Text>
            {!isPublic && (
              <Text style={{ marginTop: 5, fontWeight: 'bold', color: '#dc2626' }}>
                CONFIDENCIAL - Solo para uso interno
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', marginLeft: 20 }}>
            <Text style={{ fontSize: 8, color: '#666', marginBottom: 2, fontWeight: 'bold' }}>
              MINERY REPORT, S.L.
            </Text>
            <Text style={{ fontSize: 7, color: '#999' }}>
              Ciberseguridad y Transformación Digital
            </Text>
            <Text style={{ fontSize: 7, color: '#999' }}>
              www.mineryreport.com
            </Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);