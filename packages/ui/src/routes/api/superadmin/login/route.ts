import { createPostHandler, createSuccessResponse, validateRequestBody, createErrorResponse } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { email, password } = body;
    validateRequestBody(body, ['email', 'password']);

    if (!process.env.SUPERADMIN_EMAIL)
        throw new Error('SUPERADMIN_EMAIL is not set on the server.');

    if (!process.env.SUPERADMIN_PASSWORD)
        throw new Error('SUPERADMIN_PASSWORD is not set on the server.');

    if (!process.env.SUPERADMIN_API_SECRET)
        throw new Error('SUPERADMIN_API_SECRET is not set on the server.');


    if (email === process.env.SUPERADMIN_EMAIL && password === process.env.SUPERADMIN_PASSWORD)
        return createSuccessResponse({ token: process.env.SUPERADMIN_API_SECRET });
    else
        return createErrorResponse('Invalid credentials', 401);
}); 