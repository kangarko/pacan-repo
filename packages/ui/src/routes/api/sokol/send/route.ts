import { trackServer, createPostHandler, createSuccessResponse, validateRequestBody } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body, request) => {
    const { event_type, event_data } = body;
    
    validateRequestBody(body, ['event_type', 'event_data']);

    await trackServer(request, event_type, event_data);

    return createSuccessResponse({});
});