/**
 * GraphQL Client for Minery API
 * Endpoint: https://intranet.mineryreport.com/api/graphql/
 */

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
  }>;
}

// Using the GraphQL endpoint specifically, not the general API endpoint
const MINERY_API_ENDPOINT = 'https://intranet.mineryreport.com/api/graphql/';
const MINERY_API_SECRET_KEY = process.env.MINERY_API_SECRET_KEY || 'fdea6e19-c868-4b15-ab60-735af3c8482d';

// Only warn in development, don't throw at build time
if (!process.env.MINERY_API_SECRET_KEY && process.env.NODE_ENV === 'development') {
  console.warn('MINERY_API_SECRET_KEY environment variable is not set, using default value');
}

export class MineryAPIClient {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string = MINERY_API_ENDPOINT, apiKey: string = MINERY_API_SECRET_KEY) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;

    // Validate at runtime, not build time
    if (!this.apiKey) {
      throw new Error('MINERY_API_SECRET_KEY is required for MineryAPIClient');
    }
  }

  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        console.error('Response body:', text.substring(0, 500));
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', contentType);
        console.error('Response body:', text.substring(0, 500));
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${result.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      return result.data;
    } catch (error) {
      console.error('Minery API query error:', error);
      throw error;
    }
  }

  async mutation<T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    return this.query<T>(mutation, variables);
  }
}

// Singleton instance
export const mineryClient = new MineryAPIClient();