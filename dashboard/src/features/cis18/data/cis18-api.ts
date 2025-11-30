import { db, eq, desc } from '@workspace/database/client';
import { 
  cis18AssessmentTable, 
  cis18LeadTable, 
  cis18ColumnPreferenceTable 
} from '@workspace/database/schema';
import type { 
  CIS18Assessment, 
  CIS18Lead, 
  CIS18ColumnPreference 
} from '../types/cis18-types';

export type { CIS18Assessment, CIS18Lead, CIS18ColumnPreference };

export const CIS18Api = {
  // Assessment Methods
  async getCIS18Assessment(organizationId: string): Promise<CIS18Assessment | null> {
    try {
      const [assessment] = await db
        .select()
        .from(cis18AssessmentTable)
        .where(eq(cis18AssessmentTable.organizationId, organizationId))
        .orderBy(desc(cis18AssessmentTable.assessmentDate))
        .limit(1);

      return assessment || null;
    } catch (error) {
      console.error('Error fetching CIS-18 assessment:', error);
      return null;
    }
  },

  async getAllCIS18Assessments(organizationId: string): Promise<CIS18Assessment[]> {
    try {
      const assessments = await db
        .select()
        .from(cis18AssessmentTable)
        .where(eq(cis18AssessmentTable.organizationId, organizationId))
        .orderBy(desc(cis18AssessmentTable.assessmentDate));

      return assessments;
    } catch (error) {
      console.error('Error fetching CIS-18 assessments:', error);
      return [];
    }
  },

  async createCIS18Assessment(data: Partial<CIS18Assessment>): Promise<CIS18Assessment | null> {
    try {
      if (!data.organizationId) {
        throw new Error('Organization ID is required');
      }

      const [assessment] = await db
        .insert(cis18AssessmentTable)
        .values({
          organizationId: data.organizationId,
          assessmentDate: data.assessmentDate || new Date(),
          control1: data.control1,
          control2: data.control2,
          control3: data.control3,
          control4: data.control4,
          control5: data.control5,
          control6: data.control6,
          control7: data.control7,
          control8: data.control8,
          control9: data.control9,
          control10: data.control10,
          control11: data.control11,
          control12: data.control12,
          control13: data.control13,
          control14: data.control14,
          control15: data.control15,
          control16: data.control16,
          control17: data.control17,
          control18: data.control18,
          totalScore: data.totalScore,
          importMethod: data.importMethod,
          importedBy: data.importedBy,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return assessment;
    } catch (error) {
      console.error('Error creating CIS-18 assessment:', error);
      return null;
    }
  },

  async updateCIS18Assessment(id: string, data: Partial<CIS18Assessment>): Promise<CIS18Assessment | null> {
    try {
      const [assessment] = await db
        .update(cis18AssessmentTable)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(cis18AssessmentTable.id, id))
        .returning();

      return assessment;
    } catch (error) {
      console.error('Error updating CIS-18 assessment:', error);
      return null;
    }
  },

  async deleteCIS18Assessment(id: string): Promise<boolean> {
    try {
      await db
        .delete(cis18AssessmentTable)
        .where(eq(cis18AssessmentTable.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting CIS-18 assessment:', error);
      return false;
    }
  },

  // Lead Methods
  async createCIS18Lead(data: Partial<CIS18Lead>): Promise<CIS18Lead | null> {
    try {
      if (!data.organizationId || !data.name || !data.email) {
        throw new Error('Organization ID, name, and email are required');
      }

      const [lead] = await db
        .insert(cis18LeadTable)
        .values({
          organizationId: data.organizationId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          companySize: data.companySize,
          securityMaturity: data.securityMaturity,
          message: data.message,
          status: data.status || 'new',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return lead;
    } catch (error) {
      console.error('Error creating CIS-18 lead:', error);
      return null;
    }
  },

  async getCIS18Leads(organizationId: string): Promise<CIS18Lead[]> {
    try {
      const leads = await db
        .select()
        .from(cis18LeadTable)
        .where(eq(cis18LeadTable.organizationId, organizationId))
        .orderBy(desc(cis18LeadTable.createdAt));

      return leads;
    } catch (error) {
      console.error('Error fetching CIS-18 leads:', error);
      return [];
    }
  },

  // Column Preferences Methods
  async getColumnPreferences(userId: string): Promise<CIS18ColumnPreference | null> {
    try {
      const [preference] = await db
        .select()
        .from(cis18ColumnPreferenceTable)
        .where(eq(cis18ColumnPreferenceTable.userId, userId))
        .limit(1);

      return preference ? {
        id: preference.id,
        userId: preference.userId,
        visibleColumns: preference.visibleColumns as string[],
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt
      } : null;
    } catch (error) {
      console.error('Error fetching column preferences:', error);
      return null;
    }
  },

  async saveColumnPreferences(userId: string, visibleColumns: string[]): Promise<CIS18ColumnPreference | null> {
    try {
      // Check if preferences exist
      const existing = await this.getColumnPreferences(userId);

      if (existing) {
        // Update existing preferences
        const [updated] = await db
          .update(cis18ColumnPreferenceTable)
          .set({
            visibleColumns: visibleColumns as unknown, // JSONB type
            updatedAt: new Date()
          })
          .where(eq(cis18ColumnPreferenceTable.userId, userId))
          .returning();

        return {
          id: updated.id,
          userId: updated.userId,
          visibleColumns: updated.visibleColumns as string[],
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        };
      } else {
        // Create new preferences
        const [created] = await db
          .insert(cis18ColumnPreferenceTable)
          .values({
            userId,
            visibleColumns: visibleColumns as unknown, // JSONB type
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return {
          id: created.id,
          userId: created.userId,
          visibleColumns: created.visibleColumns as string[],
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        };
      }
    } catch (error) {
      console.error('Error saving column preferences:', error);
      return null;
    }
  },

  // Utility Methods
  calculateTotalScore(assessment: Partial<CIS18Assessment>): number {
    const controls = [];
    for (let i = 1; i <= 18; i++) {
      const key = `control${i}` as keyof CIS18Assessment;
      const value = assessment[key];
      if (typeof value === 'number') {
        controls.push(value);
      }
    }

    if (controls.length === 0) return 0;

    const sum = controls.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / controls.length);
  },

  // Control metadata
  getControlNames(): Record<string, string> {
    return {
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
  }
};