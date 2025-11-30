import { NextResponse } from 'next/server';

const API_ENDPOINT_PROD = 'https://intranet.mineryreport.com/api/encuesta/stats/test-ciberseguridad-empresas';
const API_ENDPOINT_PREPROD = 'https://intranet.mineryreport.com/api/encuesta/stats/preproduccion-test-ciberseguridad-empresas';
const API_SECRET_KEY = process.env.API_SECRET_KEY ?? 'fdea6e19-c868-4b15-ab60-735af3c8482d';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usePreproduction = searchParams.get('preproduction') === 'true';
  
  const endpoint = usePreproduction ? API_ENDPOINT_PREPROD : API_ENDPOINT_PROD;
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_SECRET_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching assessment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment statistics' },
      { status: 500 }
    );
  }
}