import { createPostHandler, createSuccessResponse, createSupabaseServerClient, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { createSupabaseAdminClient } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { form_slug } = body;
    validateRequestBody(body, ['form_slug']);

    const adminClient = await createSupabaseAdminClient();
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('User not authenticated');

    const { error, data } = await adminClient
        .from('form_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('form_slug', form_slug);

    if (error)
        throw error;

    return createSuccessResponse({
        submitted: data.length > 0,
    });
});