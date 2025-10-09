import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const schemaPath = path.join(process.cwd(), 'spacetime_bindings', 'schema.json');

        if (!fs.existsSync(schemaPath)) {
            return NextResponse.json(
                { error: 'Schema not found. Run: pnpm run setup:spacetime' },
                { status: 404 }
            );
        }

        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        return NextResponse.json(schema);
    } catch (error) {
        console.error('Failed to load schema', error);
        return NextResponse.json(
            { error: 'Failed to load schema' },
            { status: 500 }
        );
    }
}

