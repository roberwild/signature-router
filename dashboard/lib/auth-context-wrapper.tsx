export {};

// Type guard for Error objects
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Type guard for errors with cause property
function isErrorWithCause(value: unknown): value is Error & { cause?: unknown } {
  return isError(value) && 'cause' in value;
}

// Type guard for errors with code property
function isErrorWithCode(value: unknown): value is Error & { code?: string } {
  return isError(value) && 'code' in value;
}

// Helper to safely get error message
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

// Helper to safely get error cause
function getErrorCause(error: unknown): unknown {
  if (isErrorWithCause(error)) {
    return error.cause;
  }
  return undefined;
}

// Helper to safely get error code
function getErrorCode(error: unknown): string | undefined {
  if (isErrorWithCode(error)) {
    return error.code;
  }
  return undefined;
}

export async function safeGetAuthContext() {
  // First check if database is available using pg directly
  try {
    const { Pool } = await import('pg');
    const { keys } = await import('@workspace/database/keys');
    
    const pool = new Pool({
      connectionString: keys.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
    } catch (error) {
      await pool.end();
      throw error;
    }
  } catch (error: unknown) {
    console.log('[Database Check] Connection failed in auth context, showing service unavailable page');

    const dbError = new Error('AdapterError: Database connection failed') as Error & { cause?: unknown };
    dbError.cause = error;
    throw dbError;
  }

  try {
    const { getAuthContext: originalGetAuthContext } = await import('@workspace/auth/context');
    return await originalGetAuthContext();
  } catch (error: unknown) {
    // Check for database connection errors
    const errorMessage = getErrorMessage(error);
    const errorCause = getErrorCause(error);
    const errorCode = getErrorCode(error);
    const causeMessage = getErrorMessage(errorCause);
    const causeCode = getErrorCode(errorCause);

    if (
      causeMessage?.includes('AggregateError') ||
      errorMessage?.includes('AdapterError') ||
      errorMessage?.includes('SessionTokenError') ||
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ETIMEDOUT' ||
      causeCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED'
    ) {
      // Create a new error with a clear message that the error boundary can detect
      const dbError = new Error('AdapterError: Database connection failed') as Error & { cause?: unknown };
      dbError.cause = errorCause;
      throw dbError;
    }

    // Re-throw other errors
    throw error;
  }
}

export async function safeGetAuthOrganizationContext() {
  // First check if database is available using pg directly
  try {
    const { Pool } = await import('pg');
    const { keys } = await import('@workspace/database/keys');
    
    const pool = new Pool({
      connectionString: keys.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
    } catch (error) {
      await pool.end();
      throw error;
    }
  } catch (error: unknown) {
    console.log('[Database Check] Connection failed in org context, showing service unavailable page');

    const dbError = new Error('AdapterError: Database connection failed') as Error & { cause?: unknown };
    dbError.cause = error;
    throw dbError;
  }

  try {
    const { getAuthOrganizationContext: originalGetAuthOrganizationContext } = await import('@workspace/auth/context');
    return await originalGetAuthOrganizationContext();
  } catch (error: unknown) {
    // Check for database connection errors
    const errorMessage = getErrorMessage(error);
    const errorCause = getErrorCause(error);
    const errorCode = getErrorCode(error);
    const causeMessage = getErrorMessage(errorCause);
    const causeCode = getErrorCode(errorCause);

    if (
      causeMessage?.includes('AggregateError') ||
      errorMessage?.includes('AdapterError') ||
      errorMessage?.includes('SessionTokenError') ||
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ETIMEDOUT' ||
      causeCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED'
    ) {
      // Create a new error with a clear message that the error boundary can detect
      const dbError = new Error('AdapterError: Database connection failed') as Error & { cause?: unknown };
      dbError.cause = errorCause;
      throw dbError;
    }

    // Re-throw other errors
    throw error;
  }
}

