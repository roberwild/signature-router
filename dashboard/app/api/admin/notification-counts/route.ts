import { NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { db } from '@workspace/database/client';
import {
  serviceRequestTable,
  feedbackTable,
  contactMessageTable,
  questionnaireSessions,
  ServiceRequestStatus
} from '@workspace/database';
import { eq, and, isNull, count } from 'drizzle-orm';
import { getUnviewedLeadsCount } from '~/data/admin/lead-views';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await requirePlatformAdmin();

    // Count unread/new items for each section
    const results = await Promise.all([
      // Count pending service requests
      db
        .select({ count: count() })
        .from(serviceRequestTable)
        .where(eq(serviceRequestTable.status, ServiceRequestStatus.PENDING))
        .then(r => Number(r[0]?.count ?? 0) as number)
        .catch(err => {
          console.error('Error counting service requests:', err);
          return 0;
        }),
      
      // Count unread feedback messages
      db
        .select({ count: count() })
        .from(feedbackTable)
        .where(eq(feedbackTable.status, 'unread'))
        .then(r => Number(r[0]?.count ?? 0) as number)
        .catch(err => {
          console.error('Error counting feedback:', err);
          return 0;
        }),
      
      // Count unread contact messages
      db
        .select({ count: count() })
        .from(contactMessageTable)
        .where(eq(contactMessageTable.status, 'unread'))
        .then(r => Number(r[0]?.count ?? 0) as number)
        .catch(err => {
          console.error('Error counting contact messages:', err);
          return 0;
        }),
      
      // Count unviewed leads
      getUnviewedLeadsCount(session.user?.id || '')
        .catch(err => {
          console.error('Error counting unviewed leads:', err);
          return 0;
        }),
      
      // Count incomplete questionnaire sessions
      db
        .select({ count: count() })
        .from(questionnaireSessions)
        .where(
          and(
            isNull(questionnaireSessions.completedAt),
            isNull(questionnaireSessions.abandonedAt)
          )
        )
        .then(r => Number(r[0]?.count ?? 0) as number)
        .catch(err => {
          console.error('Error counting questionnaires:', err);
          return 0;
        })
    ]);

    const [
      serviceCount,
      feedbackCount,
      contactCount,
      leadCount,
      questionnaireCount
    ] = results;

    return NextResponse.json({
      services: serviceCount,
      messages: feedbackCount,  // For backward compatibility
      feedback: feedbackCount,  // New explicit feedback count
      contacts: contactCount,
      leads: leadCount,
      questionnaires: questionnaireCount,
      // Combined messages count for unified view
      totalMessages: feedbackCount + contactCount
    });
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification counts' },
      { status: 500 }
    );
  }
}