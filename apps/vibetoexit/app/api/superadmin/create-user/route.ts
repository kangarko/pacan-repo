import { createSupabaseAdminClient, createSuccessResponse, createPostHandler, validateRequestBody, createErrorResponse } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { token, email, password, name, region, role } = body;
    validateRequestBody(body, ['token', 'email', 'password', 'name', 'region', 'role']);

    if (token !== process.env.SUPERADMIN_API_SECRET)
        throw new Error('Unauthorized attempt to create user');

    if (!['user', 'admin', 'marketer'].includes(role)) 
        return createErrorResponse('Invalid role specified.', 400);

    const adminClient = await createSupabaseAdminClient();

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name: name,
            display_name: name,
            region: region,
            role: role
        }
    });

    if (createError) {
        if (createError.message.includes('User already registered')) {
            return createErrorResponse('User with this email already exists.', 409);
        }
        throw new Error(`Error creating user: ${createError.message}`);
    }

    return createSuccessResponse({ user: newUser });
});