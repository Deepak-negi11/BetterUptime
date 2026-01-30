import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://142.93.222.85:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const url = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
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

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}
