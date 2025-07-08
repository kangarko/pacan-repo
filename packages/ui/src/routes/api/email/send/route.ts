import { sendServerEmail, createPostHandler, getClientIp, validateRequestBody, createSuccessResponse, createSupabaseAdminClient } from '@repo/ui/lib/serverUtils';
import { EmailTemplate } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body, request) => {
    const { template, data, recipient, reply_to } = body;
    validateRequestBody(body, ['template', 'data']);

    const templateObject = EmailTemplate[template as keyof typeof EmailTemplate];

    if (!templateObject)
        throw new Error('Invalid template: ' + template);

    if (!data.ip)
        data.ip = await getClientIp(request);

    // Special handling for ADMIN_ERROR emails - apply rate limiting
    if (templateObject === EmailTemplate.ADMIN_ERROR) {
        const adminClient = await createSupabaseAdminClient();
        const errorHash = data.error_hash || 'unknown';
        
        // Check if we've sent too many emails in the last 20 seconds
        const twentySecondsAgo = new Date(Date.now() - 20000).toISOString();
        const { count: recentEmailCount, error: countError } = await adminClient
            .from('error_email_rate_limit')
            .select('*', { count: 'exact', head: true })
            .gte('sent_at', twentySecondsAgo);

        if (countError) {
            console.error('Failed to check error email rate limit:', countError);
            // Continue sending email if we can't check the limit
        } else if (recentEmailCount !== null && recentEmailCount >= 10) {
            console.log(`Rate limit exceeded: ${recentEmailCount} error emails sent in last 20 seconds. Skipping client error email`);
            return createSuccessResponse({ rate_limited: true });
        }

        // Check if we've already sent this exact error recently (within 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentDuplicate } = await adminClient
            .from('error_email_rate_limit')
            .select('id')
            .eq('error_hash', errorHash)
            .gte('sent_at', fiveMinutesAgo)
            .limit(1)
            .maybeSingle();

        if (recentDuplicate) {
            console.log(`Duplicate client error email suppressed (sent within 5 minutes)`);
            return createSuccessResponse({ duplicate_suppressed: true });
        }

        // Send the email
        await sendServerEmail(templateObject, data, recipient, reply_to);

        // Record that we sent this email
        const { error: insertError } = await adminClient
            .from('error_email_rate_limit')
            .insert({
                sent_at: new Date().toISOString(),
                error_hash: errorHash,
                error_type: 'client'
            });

        if (insertError)
            console.error('Failed to record client error email in rate limit table:', insertError);

        // Clean up old entries (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await adminClient
            .from('error_email_rate_limit')
            .delete()
            .lt('sent_at', oneHourAgo);

    } else {
        // For non-error emails, send normally
        await sendServerEmail(templateObject, data, recipient, reply_to);
    }

    return createSuccessResponse({});
}); 