/**
 * Role-Based Access Control (RBAC) utilities
 * 
 * Keycloak JWT Structure:
 * {
 *   "realm_access": { "roles": ["INTERNAL_USER", "DEV"] },
 *   "resource_access": {
 *     "{client-id}": { "roles": ["PRF_ADMIN", "PRF_CONSULTIVO"] }
 *   }
 * }
 * 
 * Backend uses ROLE_ prefix (ROLE_PRF_ADMIN).
 * Frontend uses roles without prefix for simplicity.
 */

/**
 * Application roles (extracted from JWT)
 */
export enum Role {
  ADMIN = 'PRF_ADMIN',
  CONSULTIVO = 'PRF_CONSULTIVO',
  AUDITOR = 'PRF_AUDITOR',
  USER = 'PRF_USER',
  // Realm roles
  INTERNAL_USER = 'INTERNAL_USER',
  DEV = 'DEV',
}

/**
 * Role display names for UI
 */
export const ROLE_LABELS: Record<string, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.CONSULTIVO]: 'Consultivo',
  [Role.AUDITOR]: 'Auditor',
  [Role.USER]: 'Usuario',
  [Role.INTERNAL_USER]: 'Usuario Interno',
  [Role.DEV]: 'Desarrollador',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [Role.ADMIN]: 'Acceso completo a todas las funcionalidades del sistema',
  [Role.CONSULTIVO]: 'Crear y modificar reglas, sin eliminar',
  [Role.AUDITOR]: 'Solo lectura de auditorías y reportes',
  [Role.USER]: 'Acceso básico a funcionalidades de usuario',
  [Role.INTERNAL_USER]: 'Usuario interno del banco',
  [Role.DEV]: 'Desarrollador con acceso a herramientas técnicas',
};

/**
 * Permission matrix - defines what each role can do
 */
export const PERMISSIONS = {
  // Dashboard
  viewDashboard: [Role.ADMIN, Role.CONSULTIVO, Role.AUDITOR, Role.USER],
  
  // Routing Rules
  viewRules: [Role.ADMIN, Role.CONSULTIVO, Role.AUDITOR],
  createRules: [Role.ADMIN, Role.CONSULTIVO],
  updateRules: [Role.ADMIN, Role.CONSULTIVO],
  deleteRules: [Role.ADMIN],
  toggleRules: [Role.ADMIN],
  reorderRules: [Role.ADMIN, Role.CONSULTIVO],
  
  // Providers
  viewProviders: [Role.ADMIN, Role.CONSULTIVO, Role.AUDITOR],
  createProviders: [Role.ADMIN],
  updateProviders: [Role.ADMIN],
  deleteProviders: [Role.ADMIN],
  syncProviders: [Role.ADMIN],
  testProviders: [Role.ADMIN, Role.CONSULTIVO],
  
  // Signatures
  viewSignatures: [Role.ADMIN, Role.CONSULTIVO, Role.AUDITOR],
  createSignatures: [Role.ADMIN, Role.USER],
  updateSignatures: [Role.ADMIN],
  
  // Alerts
  viewAlerts: [Role.ADMIN, Role.CONSULTIVO, Role.AUDITOR],
  acknowledgeAlerts: [Role.ADMIN, Role.CONSULTIVO],
  resolveAlerts: [Role.ADMIN],
  
  // Metrics
  viewMetrics: [Role.ADMIN, Role.CONSULTIVO, Role.AUDITOR, Role.DEV],
  
  // Security & Audit
  viewSecurity: [Role.ADMIN, Role.AUDITOR],
  viewAudit: [Role.ADMIN, Role.AUDITOR],
  viewUsers: [Role.ADMIN, Role.AUDITOR],
  
  // System Settings
  viewSettings: [Role.ADMIN],
  updateSettings: [Role.ADMIN],
} as const;

/**
 * Navigation items permission mapping
 */
export const NAV_PERMISSIONS = {
  '/admin': PERMISSIONS.viewDashboard,
  '/admin/signatures': PERMISSIONS.viewSignatures,
  '/admin/rules': PERMISSIONS.viewRules,
  '/admin/providers': PERMISSIONS.viewProviders,
  '/admin/alerts': PERMISSIONS.viewAlerts,
  '/admin/metrics': PERMISSIONS.viewMetrics,
  '/admin/security': PERMISSIONS.viewSecurity,
  '/admin/audit': PERMISSIONS.viewAudit,
  '/admin/users': PERMISSIONS.viewUsers,
} as const;

/**
 * Extract roles from JWT token - Multi-source compatible
 * 
 * Soporta extracción de roles desde:
 * 1. realm_access.roles (Keycloak estándar)
 * 2. resource_access.{client_id}.roles (Client roles)
 * 3. groups (AD integration - array de strings)
 * 4. ad_groups (AD integration - DN format)
 * 5. roles (Custom claim)
 * 
 * @param token - Decoded JWT token from NextAuth session or Keycloak
 * @returns Array of role strings (without ROLE_ prefix, uppercase)
 */
export function extractRolesFromJWT(token: any): string[] {
  if (!token) return [];

  const roles: string[] = [];

  // 1. Extract realm_access.roles (Keycloak estándar)
  if (token.realm_access?.roles) {
    roles.push(...token.realm_access.roles);
  }

  // 2. Extract resource_access.{client_id}.roles (Client-specific roles)
  if (token.resource_access) {
    Object.values(token.resource_access).forEach((clientAccess: any) => {
      if (clientAccess?.roles) {
        roles.push(...clientAccess.roles);
      }
    });
  }

  // 3. Extract groups (AD integration - simple array)
  if (token.groups && Array.isArray(token.groups)) {
    // Filter only app-related groups (PRF_*, ADMIN, USER, AUDITOR, etc.)
    const appGroups = token.groups.filter((g: string) => {
      const groupName = typeof g === 'string' ? g.trim() : '';
      // Accept groups that match PRF_* or known role names
      return groupName.startsWith('PRF_') || 
             ['ADMIN', 'USER', 'AUDITOR', 'CONSULTIVO', 'INTERNAL_USER'].includes(groupName.toUpperCase());
    });
    roles.push(...appGroups);
  }

  // 4. Extract ad_groups (AD integration - DN format)
  if (token.ad_groups && Array.isArray(token.ad_groups)) {
    // Parse AD Distinguished Name format: "CN=PRF_ADMIN,OU=..."
    const adRoles = token.ad_groups.map((dn: string) => {
      if (typeof dn !== 'string') return null;
      const match = dn.match(/CN=([^,]+)/i);
      return match ? match[1] : null;
    }).filter(Boolean);
    roles.push(...adRoles);
  }

  // 5. Extract custom 'roles' claim (if Keycloak is configured with custom mapper)
  if (token.roles && Array.isArray(token.roles)) {
    roles.push(...token.roles);
  }

  // Normalize to uppercase and remove duplicates
  return [...new Set(roles.map(r => String(r).toUpperCase()))];
}

/**
 * Check if user has at least one of the required roles
 * 
 * @param userRoles - User's roles array
 * @param requiredRoles - Required roles (single role or array)
 * @returns true if user has at least one required role
 */
export function hasRole(
  userRoles: string[],
  requiredRoles: Role | Role[] | readonly Role[]
): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return required.some(role => userRoles.includes(role));
}

/**
 * Check if user has ALL of the required roles
 * 
 * @param userRoles - User's roles array
 * @param requiredRoles - Required roles array
 * @returns true if user has all required roles
 */
export function hasAllRoles(
  userRoles: string[],
  requiredRoles: Role[]
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Check if user has permission for a specific action
 * 
 * @param userRoles - User's roles array
 * @param permission - Permission key from PERMISSIONS object
 * @returns true if user has permission
 */
export function hasPermission(
  userRoles: string[],
  permission: keyof typeof PERMISSIONS
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return hasRole(userRoles, allowedRoles);
}

/**
 * Get highest priority role for display
 * Priority: ADMIN > CONSULTIVO > AUDITOR > USER
 */
export function getPrimaryRole(userRoles: string[]): Role | null {
  const rolePriority = [
    Role.ADMIN,
    Role.CONSULTIVO,
    Role.AUDITOR,
    Role.DEV,
    Role.USER,
    Role.INTERNAL_USER,
  ];

  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role;
    }
  }

  return null;
}

