import { createPostHandler, createSuccessResponse, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { addContactToWordPressList } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    let { email, name } = body;
    validateRequestBody(body, ['email', 'name']);

    email = email.trim();
    name = name.trim();

    const nameParts = name.split(' ');
    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    const lastName = nameParts.slice(1).join(' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    await addContactToWordPressList(firstName, lastName, email, "newsletter");

    return createSuccessResponse({ success: true });
}); 