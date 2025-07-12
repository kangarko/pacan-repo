import { cookies } from 'next/headers';
import { createPostHandler, createSupabaseAdminClient, createSupabaseServerClient, createSuccessResponse } from '@repo/ui/lib/serverUtils';
import { Headline, SokolData } from '@repo/ui/lib/types';
import { SupabaseClient } from '@supabase/supabase-js';

export const POST = createPostHandler(async (body) => {
    const { user_id, headline_id, sokol_id, headline_slug } = body;

    const cookieStore = await cookies();
    let adminClient: SupabaseClient;

    let userId: string | number | null = null;
    let headlineInfo: Headline | null = null;

    //
    // Part 1: Figure out user ID
    //

    const cookieUserId = user_id || cookieStore.get('user_id')?.value;

    console.log('=============================================== Old user_id: ' + cookieUserId);

    if (cookieUserId && cookieUserId !== '1') {
        userId = cookieUserId;

        console.log("\tUsing user_id from cookie")
    }

    if (!userId && sokol_id && sokol_id !== '1') {
        userId = sokol_id;

        console.log("\tUsing user_id from query")
    }

    if (!userId) {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        let email: string | undefined | null = null;

        if (user) {
            email = user.email;

            console.log("\tUsing email from logged in user: " + email)
        } else {
            email = cookieStore.get('lead_email')?.value;

            if (email)
                console.log("\tUsing email from lead_email cookie: " + email)
        }

        if (email) {
            adminClient = await createSupabaseAdminClient();

            const { data: existingTrackingUser, error: trackingByEmailError } = await adminClient
                .from('tracking')
                .select('user_id')
                .eq('email', email)
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (trackingByEmailError && trackingByEmailError.code !== 'PGRST116')
                throw new Error('Error fetching tracking by email: ' + JSON.stringify(trackingByEmailError));

            if (existingTrackingUser) {
                userId = existingTrackingUser.user_id;

                console.log("\tUsing user_id from email " + email + " based on earlier rows")
            } else
                console.log("\tNo user_id found in tracking table for email " + email)
        }
    }

    if (!userId) {

        if (!adminClient)
            adminClient = await createSupabaseAdminClient();

        const { data: nextIdData, error: rpcError } = await adminClient.rpc('get_next_user_id');

        if (rpcError)
            throw new Error('Failed to generate user ID: ' + JSON.stringify(rpcError));

        if (nextIdData === null || typeof nextIdData !== 'number')
            throw new Error('Failed to generate user ID: Invalid data received.');

        console.log("\tGenerated user_id " + nextIdData)
        userId = nextIdData;
    }

    //
    // Part 2: Figure out headline
    // 

    // A) If slug is provided, try to find headline by slug first
    if (headline_slug) {
        if (!adminClient)
            adminClient = await createSupabaseAdminClient();

        const { data: headlineBySlug, error: slugError } = await adminClient
            .from('headlines')
            .select('*')
            .eq('slug', headline_slug)
            .eq('active', true)
            .single();

        if (!slugError && headlineBySlug) {
            headlineInfo = headlineBySlug as Headline;

            console.log("\tFound headline by slug " + headline_slug)
        } else
            console.log("\tNo headline found by slug " + headline_slug)

    }

    if (!headlineInfo) {
        if (!adminClient)
            adminClient = await createSupabaseAdminClient();

        // B) Get active headlines and pick one
        const { data: headlines, error } = await adminClient
            .from('headlines')
            .select('*')
            .eq('active', true);

        if (error)
            throw error;

        if (!headlines || headlines.length === 0) {
            console.log("\tNo headlines found in database, will be null");

        } else {
            const savedHeadlineId = headline_id || cookieStore.get('headline_id')?.value;

            if (savedHeadlineId)
                headlineInfo = headlines.find(headline => headline.id === savedHeadlineId);

            if (!headlineInfo)
                headlineInfo = headlines[Math.floor(Math.random() * headlines.length)];
        }
    }

    if (headlineInfo) {
        cookieStore.set('headline_id', headlineInfo.id, {
            path: '/',
            maxAge: 365 * 2 * 24 * 60 * 60, // 2 years
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false, // Needs to be accessible by client-side JS (e.g., track function)
        });

        cookieStore.set('active_headline', JSON.stringify(headlineInfo), {
            path: '/',
            maxAge: 365 * 2 * 24 * 60 * 60, // 2 years
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false, // Needs to be accessible by client-side JS (e.g., track function)
        });
    }

    cookieStore.set('user_id', userId.toString(), {
        path: '/',
        maxAge: 365 * 2 * 24 * 60 * 60, // 2 years
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Needs to be accessible by client-side JS (e.g., track function)
    });

    return createSuccessResponse({
        user_id: userId,
        headline: headlineInfo,
    } as SokolData);
}); 