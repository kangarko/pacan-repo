import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { session_id, current_time } = body;

    validateRequestBody(body, ['session_id', 'current_time']);

    const adminClient = await createSupabaseAdminClient();

    const { error: updateError } = await adminClient
        .from('webinar_sessions')
        .update({ watchtime_seconds: current_time })
        .eq('id', session_id);

    if (updateError)
        throw updateError;

    return createSuccessResponse();
}); 