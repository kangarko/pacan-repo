import { getSortedPostsData } from '@/lib/kristinaUtils';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const allPosts = await getSortedPostsData();
        const latestPosts = allPosts.slice(0, 3);
        
        return NextResponse.json({ posts: latestPosts });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching latest posts';
        
        console.error(errorMessage);
        
        return new NextResponse(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 