import { createSuccessResponse, getUserByEmail, createPostHandler, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const token = body.token;
    const email = body.email;

    validateRequestBody(body, ['token', 'email']);

    if (token !== process.env.SUPERADMIN_API_SECRET)
        throw new Error('Unauthorized attempt to list users');

    const user = await getUserByEmail(email);

    return createSuccessResponse({ user: user });
});