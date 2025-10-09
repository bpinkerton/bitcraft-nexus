import { NextResponse } from 'next/server';

export async function GET() {
    // You'll need to provide your SpacetimeDB auth token
    // This can come from environment variables or a secure storage
    const token = process.env.SPACETIME_AUTH_TOKEN || 'demo-token';

    return new NextResponse(token, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}

