import { createPostHandler, createSuccessResponse, createErrorResponse, createSupabaseAdminClient, verifyAdminUser, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { Webinar, WebinarMessage } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body) => {
    await verifyAdminUser();

    validateRequestBody(body, ['action']);

    const { action } = body;
    const adminClient = await createSupabaseAdminClient();

    switch (action) {
        case 'list': {
            const { data: webinars, error } = await adminClient
                .from('webinars')
                .select('*')
                .order('created_at', { ascending: false });

            if (error)
                throw error;

            return createSuccessResponse({
                webinars: webinars as Webinar[]
            });
        }
        case 'save': {
            // For creation, id won't be present. For updates, id will be present
            const hasId = !!body.id;
            
            await validateRequestBody(body, ['title', 'video_url', 'duration_seconds', 'url', 'background_image_url',  'offer', 'schedules', 'metadata']);

            const { id, title, video_url, duration_seconds, offer, url, background_image_url, schedules, metadata } = body;

            if (!video_url.startsWith("https://player.vimeo.com/progressive_redirect/playback/"))
                return createErrorResponse('Invalid URL provided. Only Vimeo URLs are currently supported.');

            if (duration_seconds <= 0)
                return createErrorResponse('Fetched duration must be a positive number representing minutes.');

            // Common fields for both create and update
            const webinarData = {
                title,
                video_url,
                duration_seconds,
                offer,
                schedules,
                metadata,
                url,
                background_image_url: background_image_url
            };
            
            let result;
            
            if (hasId) {
                // Update existing webinar
                result = await adminClient
                    .from('webinars')
                    .update(webinarData)
                    .eq('id', id)
                    .select()
                    .single();
                    
                if (result.error)
                    throw result.error;
                
                if (!result.data)
                    return createErrorResponse('Webinar not found or no changes made.', 404);
                    
            } else {
                // Create new webinar
                result = await adminClient
                    .from('webinars')
                    .insert([webinarData])
                    .select()
                    .single();
                    
                if (result.error)
                    throw result.error;
            }
            
            return createSuccessResponse({
                webinar: result.data
            });
        }
        case 'import_chat': {
            await validateRequestBody(body, ['webinar_id', 'messages', 'mode']);
            const { webinar_id, messages, mode } = body;
            
            // Check if webinar exists
            const { data: webinar, error: webinarError } = await adminClient
                .from('webinars')
                .select('id')
                .eq('id', webinar_id)
                .single();
                
            if (webinarError || !webinar)
                return createErrorResponse('Webinar not found', 404);
                
            if (!Array.isArray(messages) || messages.length === 0)
                return createErrorResponse('No valid messages provided');
                
            // If mode is 'replace', delete existing messages first
            if (mode === 'replace') {
                const { error: deleteError } = await adminClient
                    .from('webinar_messages')
                    .delete()
                    .eq('webinar_id', webinar_id);
                    
                if (deleteError)
                    throw deleteError;
            }
            
            const messagesToInsert = messages.map(message => ({
                webinar_id,
                user_id: -1,
                user_name: message.user_name,
                message: message.message,
                time_seconds: message.time_seconds
            }));
            
            const { data: insertedMessages, error: insertError } = await adminClient
                .from('webinar_messages')
                .insert(messagesToInsert)
                .select();
                
            if (insertError)
                throw insertError;
                
            return createSuccessResponse({
                count: insertedMessages.length
            });
        }
        case 'delete': {
            await validateRequestBody(body, ['id']);
            const { id } = body;

            const { error: chatDeleteError } = await adminClient
                .from('webinar_messages')
                .delete()
                .eq('webinar_id', id);

            if (chatDeleteError)
                throw chatDeleteError;

            const { error } = await adminClient
                .from('webinars')
                .delete()
                .eq('id', id);

            if (error)
                throw error;

            return createSuccessResponse({
                success: true,
                message: 'Webinar deleted successfully'
            });
        }
        case 'upload_background': {
            await validateRequestBody(body, ['fileData', 'fileName', 'contentType']);

            const { fileData, fileName, contentType } = body;

            const base64Data = fileData.split(',')[1];

            if (!base64Data)
                return createErrorResponse('Invalid file data.');

            const buffer = Buffer.from(base64Data, 'base64');

            const fileExt = fileName.split('.').pop();
            const filePath = `${Date.now()}.${fileExt}`;

            const { error: uploadError } = await adminClient
                .storage
                .from('webinar-backgrounds')
                .upload(filePath, buffer, { contentType });

            if (uploadError)
                throw uploadError;

            const { data: { publicUrl } } = adminClient
                .storage
                .from('webinar-backgrounds')
                .getPublicUrl(filePath);

            return createSuccessResponse({ success: true, url: publicUrl });
        }
        case 'upload_offer_thumbnail': {
            await validateRequestBody(body, ['fileData', 'fileName', 'contentType']);

            const { fileData, fileName, contentType } = body;

            const base64Data = fileData.split(',')[1];

            if (!base64Data)
                return createErrorResponse('Invalid file data.');

            const buffer = Buffer.from(base64Data, 'base64');

            const fileExt = fileName.split('.').pop();
            const filePath = `${Date.now()}.${fileExt}`;

            const { error: uploadError } = await adminClient
                .storage
                .from('offer-thumbnails')
                .upload(filePath, buffer, { contentType, upsert: true });

            if (uploadError)
                throw uploadError;

            const { data: { publicUrl } } = adminClient
                .storage
                .from('offer-thumbnails')
                .getPublicUrl(filePath);

            return createSuccessResponse({ success: true, url: publicUrl });
        }
        // ---------------------------------------------------------------------
        // Chats management ----------------------------------------------------
        // ---------------------------------------------------------------------
        case 'get_chat_messages': {
            await validateRequestBody(body, ['webinar_id']);

            const { webinar_id } = body;

            // Verify the webinar exists
            const { data: webinar, error: webinarError } = await adminClient
                .from('webinars')
                .select('id')
                .eq('id', webinar_id)
                .single();

            if (webinarError || !webinar)
                return createErrorResponse('Webinar not found', 404);

            const { data: messages, error } = await adminClient
                .from('webinar_messages')
                .select('*')
                .eq('webinar_id', webinar_id)
                .order('time_seconds', { ascending: true });

            if (error)
                throw error;

            return createSuccessResponse({ messages: messages as WebinarMessage[] });
        }
        case 'add_chat_message': {
            await validateRequestBody(body, ['message']);

            const { message } = body;

            if (!message || typeof message !== 'object')
                return createErrorResponse('Invalid message payload');

            const requiredMessageFields: (keyof WebinarMessage)[] = ['webinar_id', 'user_name', 'message', 'time_seconds'];
            for (const field of requiredMessageFields) {
                if (!(field in message) || message[field as keyof WebinarMessage] === undefined || message[field as keyof WebinarMessage] === null)
                    return createErrorResponse(`Missing field in message: ${field}`);
            }

            // Ensure parent webinar exists
            const { data: webinar, error: webinarError } = await adminClient
                .from('webinars')
                .select('id')
                .eq('id', message.webinar_id)
                .single();

            if (webinarError || !webinar)
                return createErrorResponse('Webinar not found', 404);

            const insertPayload = {
                webinar_id: message.webinar_id,
                user_id: message.user_id ?? -1,
                user_name: message.user_name,
                message: message.message,
                time_seconds: message.time_seconds
            } as const;

            const { data: inserted, error } = await adminClient
                .from('webinar_messages')
                .insert([insertPayload])
                .select()
                .single();

            if (error)
                throw error;

            return createSuccessResponse({ message: inserted });
        }
        case 'update_chat_message': {
            await validateRequestBody(body, ['message']);

            const { message } = body;

            if (!message || typeof message !== 'object')
                return createErrorResponse('Invalid message payload');

            const requiredMessageFields: (keyof WebinarMessage)[] = ['id', 'webinar_id', 'user_name', 'message', 'time_seconds'];
            for (const field of requiredMessageFields) {
                if (!(field in message) || message[field as keyof WebinarMessage] === undefined || message[field as keyof WebinarMessage] === null)
                    return createErrorResponse(`Missing field in message: ${field}`);
            }

            // Ensure the message exists
            const { data: existing, error: existingError } = await adminClient
                .from('webinar_messages')
                .select('id')
                .eq('id', message.id)
                .single();

            if (existingError || !existing)
                return createErrorResponse('Chat message not found', 404);

            const updatePayload = {
                user_name: message.user_name,
                message: message.message,
                time_seconds: message.time_seconds
            } as const;

            const { data: updated, error } = await adminClient
                .from('webinar_messages')
                .update(updatePayload)
                .eq('id', message.id)
                .select()
                .single();

            if (error)
                throw error;

            return createSuccessResponse({ message: updated });
        }
        case 'delete_chat_message': {
            await validateRequestBody(body, ['message_id', 'webinar_id']);

            const { message_id, webinar_id } = body;

            const { error } = await adminClient
                .from('webinar_messages')
                .delete()
                .eq('id', message_id)
                .eq('webinar_id', webinar_id);

            if (error)
                throw error;

            return createSuccessResponse({ success: true });
        }
        case 'clear_chat_messages': {
            await validateRequestBody(body, ['webinar_id']);

            const { webinar_id } = body;

            const { error: clearError } = await adminClient
                .from('webinar_messages')
                .delete()
                .eq('webinar_id', webinar_id);

            if (clearError)
                throw clearError;

            return createSuccessResponse({ success: true });
        }
        case 'get_feedback_stats': {
            await validateRequestBody(body, ['webinar_id']);
            const { webinar_id } = body;

            const { data: rows, error } = await adminClient
                .from('webinar_feedback')
                .select('rating')
                .eq('webinar_id', webinar_id);

            if (error) 
                throw error;

            const stats: Record<number, number> = {};
            
            (rows || []).forEach(r => {
                const rating = r.rating as number;
                stats[rating] = (stats[rating] || 0) + 1;
            });

            const total = rows?.length || 0;
            const average = total ? (rows!.reduce((sum, r) => sum + r.rating, 0) / total) : null;

            return createSuccessResponse({ stats, average });
        }
        default:
            return createErrorResponse('Invalid action: ' + action);
    }
}); 