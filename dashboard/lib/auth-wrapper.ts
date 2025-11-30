import type { Session } from 'next-auth';

// We need to directly check if the database is available
// Since NextAuth catches errors internally and just returns null
export async function safeAuth(): Promise<Session | null> {
  // First, let's try a simple database connection check using pg directly
  try {
    const { Pool } = await import('pg');
    const { keys } = await import('@workspace/database/keys');
    
    const pool = new Pool({
      connectionString: keys.DATABASE_URL,
      connectionTimeoutMillis: 3000, // 3 second timeout
    });
    
    try {
      // Try to get a client from the pool
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
    } catch (error) {
      await pool.end();
      throw error;
    }
  } catch (error: unknown) {
    // Log the error but don't console.error to avoid duplicate logs
    console.log('[Database Check] Connection failed, showing service unavailable page');
    
    // Always throw a database connection error when pool connection fails
    const dbError = new Error('AdapterError: Database connection failed');
    dbError.cause = error;
    throw dbError;
  }

  // If database is available, proceed with normal auth
  try {
    const { dedupedAuth } = await import('@workspace/auth');
    const session = await dedupedAuth();
    return session;
  } catch (error: unknown) {
    // Check for database connection errors from NextAuth
    const errorMessage = error instanceof Error ? error.message : '';
    const errorCause = error instanceof Error ? error.cause : undefined;
    const causeMessage = errorCause instanceof Error ? errorCause.message : '';
    const causeCode = errorCause && typeof errorCause === 'object' && 'code' in errorCause ? errorCause.code : '';

    if (
      causeMessage.includes('AggregateError') ||
      errorMessage.includes('AdapterError') ||
      errorMessage.includes('SessionTokenError') ||
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ETIMEDOUT' ||
      causeCode === 'ENOTFOUND'
    ) {
      console.log('[Auth] Database error detected from NextAuth, showing service unavailable page');
      const dbError = new Error('AdapterError: Database connection failed');
      if (error instanceof Error) {
        dbError.cause = error.cause;
      }
      throw dbError;
    }

    // Re-throw other errors
    throw error;
  }
}