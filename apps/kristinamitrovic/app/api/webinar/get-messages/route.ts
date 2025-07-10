import { createErrorResponse, createPostHandler, createSuccessResponse, createSupabaseAdminClient, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { WebinarMessage } from '@repo/ui/lib/types';
import { fetchMultiPageData } from '@repo/ui/lib/utils';

export const POST = createPostHandler(async (body) => {
    const { id } = body;

    validateRequestBody(body, ['id']);

    const adminClient = await createSupabaseAdminClient();

    const messages = await fetchMultiPageData<WebinarMessage[]>(adminClient
        .from('webinar_messages')
        .select('*')
        .eq('webinar_id', id)
        .order('time_seconds', { ascending: true }));

    if (!messages) 
        return createErrorResponse('Webinar id ' + id + ' not found');

    return createSuccessResponse({  
        messages: messages
    });
}); 