import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://146.190.33.150:3001';

async function forwardResponse(response: Response) {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : { message: (await response.text()) || response.statusText || 'Request failed' };

    return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const url = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
        },
    });

    return forwardResponse(response);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const url = `${BACKEND_URL}/${path.join('/')}`;
    const body = await request.json();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    return forwardResponse(response);
}
