import { createPostHandler, createSuccessResponse, createErrorResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { EmailTemplate } from '@repo/ui/lib/types';
import { sendServerEmail } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    await validateRequestBody(body, ['webinar_id', 'rating']);

    const { webinar_id, rating, comment } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5)
        return createErrorResponse('Invalid rating');

    const adminClient = await createSupabaseAdminClient();

    const { data: webinarSession, error: sessionError } = await adminClient
        .from('webinar_sessions')
        .select('user_name, user_email')
        .eq('webinar_id', webinar_id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

    if (sessionError)
        throw sessionError;

    const { data: webinar, error: webinarError } = await adminClient
        .from('webinars')
        .select('title')
        .eq('id', webinar_id)
        .single();

    if (webinarError)
        throw webinarError;

    await sendServerEmail(EmailTemplate.ADMIN_FEEDBACK, {
        webinar_title: webinar.title,
        rating: rating.toString(),
        comment: comment || '',
        user_name: webinarSession.user_name,
        user_email: webinarSession.user_email
    });

    return createSuccessResponse({});
}); 