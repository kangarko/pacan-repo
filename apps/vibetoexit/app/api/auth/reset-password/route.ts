import { createPostHandler, createSuccessResponse, createSupabaseServerClient, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { email } = body;
    validateRequestBody(body, ['email']);

    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
    });

    if (error)
        throw error;

    return createSuccessResponse({});
});