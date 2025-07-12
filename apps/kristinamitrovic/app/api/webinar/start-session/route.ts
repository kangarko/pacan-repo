import { createErrorResponse, createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { webinar_id, schedule_id, start_date, email, name, user_id } = body;

    validateRequestBody(body, ['webinar_id', 'schedule_id', 'start_date', 'email', 'name', 'user_id']);

    const adminClient = await createSupabaseAdminClient();

    const { data: webinar, error: webinarError } = await adminClient
        .from('webinars')
        .select('id')
        .eq('id', webinar_id)
        .single();

    if (webinarError)
        throw webinarError;

    if (!webinar)
        return createErrorResponse('Webinar id ' + webinar_id + ' not found');


    const { data: session, error: sessionError } = await adminClient
        .from('webinar_sessions')
        .insert({
            webinar_id: webinar_id,
            schedule_id: schedule_id,
            user_id: user_id,
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