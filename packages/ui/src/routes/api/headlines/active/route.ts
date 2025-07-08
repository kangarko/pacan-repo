import { createPostHandler, createSuccessResponse, createSupabaseAdminClient } from '@repo/ui/lib/serverUtils';
import { Headline } from '@repo/ui/lib/types';
import { cookies } from 'next/headers';

export const POST = createPostHandler(async (body) => {
    const { slug } = body;

    const adminClient = await createSupabaseAdminClient();
    const cookieStore = await cookies();
    
    // If slug is provided, try to find headline by slug first
    if (slug) {
        const { data: headlineBySlug, error: slugError } = await adminClient
            .from('headlines')
            .select('*')
            .eq('slug', slug)
            .eq('active', true)
            .single();
        
        if (!slugError && headlineBySlug)             
            return createSuccessResponse({
                headline: headlineBySlug as Headline,
            });
    }

    // Get active headlines
    const { data: headlines, error } = await adminClient
        .from('headlines')
        .select('*')
        .eq('active', true);

    if (error)
        throw error;

    if (!headlines || headlines.length === 0) 
        return createSuccessResponse({
            headline: null,
        });    

    // Check if user has a selected headline in cookie
    const selectedHeadlineId = cookieStore.get('headline_id')?.value;

    let selectedHeadline: Headline | null = null;
    
    if (selectedHeadlineId) {
        // Try to find the selected headline
        selectedHeadline = headlines.find(h => h.id === selectedHeadlineId) || null;
    }
    
    // If no selected headline or it's no longer active, randomly select one
    if (!selectedHeadline && headlines.length > 0) {
        const randomIndex = Math.floor(Math.random() * headlines.length);
        
        selectedHeadline = headlines[randomIndex];
    }

    return createSuccessResponse({
        headline: selectedHeadline as Headline,
    });
}); 