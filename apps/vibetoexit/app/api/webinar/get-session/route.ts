import { createErrorResponse, createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { session_id } = body;

    validateRequestBody(body, ['session_id']);

    // Validate that session_id is a valid uuid
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(session_id))
        return createSuccessResponse({
            "success": false,
            "error": "Nevažeći ID sesije: " + session_id
        });

    const adminClient = await createSupabaseAdminClient();

    const { data: session, error: sessionError } = await adminClient
        .from('webinar_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

    if (sessionError)
        throw sessionError;

    if (!session)
        return createErrorResponse('Session id ' + session_id + ' not found');

    const { data: webinar, error: webinarError } = await adminClient
        .from('webinars')
        .select('*')
        .eq('id', session.webinar_id)
        .single();

    if (webinarError)
        throw webinarError;

    return createSuccessResponse({
        session: session,
        webinar: webinar,
    });
}); 