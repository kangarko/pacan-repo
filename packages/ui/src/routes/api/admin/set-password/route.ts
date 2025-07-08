import { createSupabaseAdminClient, getUserByEmail, verifyAdminUser, createPostHandler, createErrorResponse, validateRequestBody, createSuccessResponse } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    await verifyAdminUser();

    const { email, password } = body;
    validateRequestBody(body, ['email', 'password']);

    if (password.length < 6)
        return createErrorResponse('Password must be at least 6 characters long');

    const adminClient = await createSupabaseAdminClient();
    const user = await getUserByEmail(email);

    if (!user)
        throw new Error('User not found');

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
        user.id,
        { password }
    );

    if (updateError)
        throw updateError;

    return createSuccessResponse({});
});