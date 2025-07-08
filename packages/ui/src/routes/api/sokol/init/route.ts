import { cookies } from 'next/headers';
import { createPostHandler, createSupabaseAdminClient, createSupabaseServerClient, createSuccessResponse } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { sokol_id: querySokolId } = body;
    const cookieStore = await cookies();
    const adminClient = await createSupabaseAdminClient();
    const supabase = await createSupabaseServerClient();

    let email: string | undefined | null = null;
    let userId: string | number | null = null;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        email = user.email;
    } else {
        email = cookieStore.get('lead_email')?.value;
    }

    if (email) {
        const { data: existingTrackingUser, error: trackingByEmailError } = await adminClient
            .from('tracking')
            .select('user_id')
            .eq('email', email)
            .order('date', { ascending: false })
            .limit(1)
            .single();

        if (trackingByEmailError && trackingByEmailError.code !== 'PGRST116') {
            throw new Error('Error fetching tracking by email: ' + JSON.stringify(trackingByEmailError));
        }

        if (existingTrackingUser) {
            userId = existingTrackingUser.user_id;
        }
    }

    const cookieUserId = cookieStore.get('user_id')?.value;

    if (!userId && cookieUserId && cookieUserId !== '1') {
        userId = cookieUserId;
    }

    if (!userId && querySokolId && querySokolId !== '1') {
        userId = querySokolId;
    }

    if (!userId) {
        const { data: nextIdData, error: rpcError } = await adminClient.rpc('get_next_user_id');

        if (rpcError) {
            throw new Error('Failed to generate user ID: ' + JSON.stringify(rpcError));
        }

        if (nextIdData === null || typeof nextIdData !== 'number') {
            throw new Error('Failed to generate user ID: Invalid data received.');
        }

        userId = nextIdData;
    }

    return createSuccessResponse({ userId });
}); 