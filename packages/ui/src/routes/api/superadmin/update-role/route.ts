import { getUserByEmail, createSupabaseAdminClient, createSuccessResponse, createPostHandler, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { token, email, role } = body;
    validateRequestBody(body, ['token', 'email', 'role']);

    if (token !== process.env.SUPERADMIN_API_SECRET)
        throw new Error('Unauthorized attempt to update user role');

    if (!['user', 'admin', 'marketer'].includes(role))
        throw new Error('Invalid role value');

    const adminClient = await createSupabaseAdminClient();
    const user = await getUserByEmail(email);

    if (!user)
        throw new Error('User ' + email + ' not found');

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
        user.id,
        {
            user_metadata: {
                ...user.user_metadata,
                role: role
            },
        }
    );

    if (updateError)
        throw updateError;

    return createSuccessResponse({});
});