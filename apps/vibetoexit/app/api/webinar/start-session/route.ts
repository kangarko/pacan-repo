import { createErrorResponse, createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { cookies } from 'next/headers';

export const POST = createPostHandler(async (body) => {
    const { webinar_id, schedule_id, start_date, email, name } = body;

    validateRequestBody(body, ['webinar_id', 'schedule_id', 'start_date', 'email', 'name']);

    const adminClient = await createSupabaseAdminClient();
    const cookieStore = await cookies();

    const { data: webinar, error: webinarError } = await adminClient
        .from('webinars')
        .select('id')
        .eq('id', webinar_id)
        .single();

    if (webinarError)
        throw webinarError;

    if (!webinar)
        return createErrorResponse('Webinar id ' + webinar_id + ' not found');

    const userId = cookieStore.get('user_id')?.value;

    if (!userId)
        throw new Error('[start-session] Unable to get user ID from cookie');

    const { data: session, error: sessionError } = await adminClient
        .from('webinar_sessions')
        .insert({
            webinar_id: webinar_id,
            schedule_id: schedule_id,
            user_id: userId,
            user_name: name,
            user_email: email,
            start_date: start_date,
            watchtime_seconds: 0
        })
        .select('*')
        .single();

    if (sessionError)
        throw sessionError;

    return createSuccessResponse({
        session_id: session.id
    });
}); 