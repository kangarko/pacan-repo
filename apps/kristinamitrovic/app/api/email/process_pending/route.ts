import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, sendServerEmail, sendServerErrorEmail } from '@repo/ui/lib/serverUtils';
import { EmailTemplate } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body, request) => {
    const adminClient = await createSupabaseAdminClient();

    console.log('Processing pending emails');

    // Get all pending emails
    const { data: pendingEmails, error: pendingEmailsError } = await adminClient
        .from('pending_emails')
        .select('*')
        .order('created_at', { ascending: true });

    if (pendingEmailsError)
        throw pendingEmailsError;

    console.log('Found ' + pendingEmails.length + ' pending emails');

    if (!pendingEmails || pendingEmails.length === 0)
        return createSuccessResponse({ processed: 0 });

    // Process each pending email
    for (const email of pendingEmails) 
        try {
            await sendServerEmail(email.template as EmailTemplate, email.data, email.recipient);

            // Delete the processed email
            const { error: deleteError } = await adminClient
                .from('pending_emails')
                .delete()
                .eq('id', email.id);

            if (deleteError)
                throw deleteError;

            console.log('Deleted from pending table');

        } catch (error) {
            sendServerErrorEmail(body, request, 'Error sending email ' + email.template + ' to ' + email.recipient, error);
        }    

    return createSuccessResponse({ processed: pendingEmails.length });
});
