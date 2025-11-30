export interface CIS18Assessment {
  id: string;
  organizationId: string;
  assessmentDate: Date;
  control1?: number | null;
  control2?: number | null;
  control3?: number | null;
  control4?: number | null;
  control5?: number | null;
  control6?: number | null;
  control7?: number | null;
  control8?: number | null;
  control9?: number | null;
  control10?: number | null;
  control11?: number | null;
  control12?: number | null;
  control13?: number | null;
  control14?: number | null;
  control15?: number | null;
  control16?: number | null;
  control17?: number | null;
  control18?: number | null;
  totalScore?: number | null;
  importMethod?: string | null;
  importedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CIS18Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  companySize?: string | null;
  securityMaturity?: string | null;
  message?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CIS18ColumnPreference {
  id: string;
  userId: string;
  visibleColumns: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const CIS18ControlNames: Record<string, string> = {
  control1: 'Inventory and Control of Enterprise Assets',
  control2: 'Inventory and Control of Software Assets',
  control3: 'Data Protection',
  control4: 'Secure Configuration of Enterprise Assets and Software',
  control5: 'Account Management',
  control6: 'Access Control Management',
  control7: 'Continuous Vulnerability Management',
  control8: 'Audit Log Management',
  control9: 'Email and Web Browser Protections',
  control10: 'Malware Defenses',
  control11: 'Data Recovery',
  control12: 'Network Infrastructure Management',
  control13: 'Network Monitoring and Defense',
  control14: 'Security Awareness and Skills Training',
  control15: 'Service Provider Management',
  control16: 'Application Software Security',
  control17: 'Incident Response Management',
  control18: 'Penetration Testing'
};