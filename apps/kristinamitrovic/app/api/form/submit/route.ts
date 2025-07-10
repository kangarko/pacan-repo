import { createPostHandler, createSuccessResponse, createSupabaseAdminClient, createSupabaseServerClient, getPurchasesByEmail, sendServerEmail, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { EmailTemplate } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body) => {
    const { form_slug, form_data } = body;
    validateRequestBody(body, ['form_slug', 'form_data']);

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user)
        throw new Error('User not authenticated');

    const adminClient = await createSupabaseAdminClient();
    const transactions = await getPurchasesByEmail(user.email!);
    const userOffers: string[] = [];

    for (const transaction of transactions) {
        userOffers.push(transaction.metadata.primary_offer_slug!);

        if (transaction.metadata.secondary_offer_slug)
            userOffers.push(transaction.metadata.secondary_offer_slug!);
    }

    const { error: insertError } = await adminClient
        .from('form_responses')
        .insert({
            user_id: user.id,
            user_email: user.email,
            form_slug: form_slug,
            data: form_data,
        })
        .select('id')
        .single();

    if (insertError)
        throw new Error('Error saving form response: ' + insertError.message);

    sendServerEmail(EmailTemplate.ADMIN_FORM_SUBMITTED, {
        form_slug: form_slug,
        name: user.user_metadata?.name,
        email: user.email,
        owned_offer_names: userOffers,
        form_data: form_data
    });

    return createSuccessResponse({});
}); 