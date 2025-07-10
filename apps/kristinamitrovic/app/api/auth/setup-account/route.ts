import {
    getUserByEmail,
    createSupabaseAdminClient,
    createSupabaseServerClient,
    sendServerErrorEmail,
    createPostHandler,
    validateRequestBody,
    createSuccessResponse,
    trackServer,
    getClientIp
} from '@repo/ui/lib/serverUtils';
import { getPricing } from '@repo/ui/lib/utils';
import { Offer, OfferType } from '@repo/ui/lib/types';

export const POST = createPostHandler(async (body, request) => {
    const { email, name, password, region, stripe_customer_id, offer_slugs, purchase_date, payment_method, payment_id, value, currency, auto_login, fallback_ip, role } = body;

    validateRequestBody(body, ['email', 'name', 'password', 'region']);

    // Validate role if provided
    if (role && !['user', 'admin', 'marketer'].includes(role))
        throw new Error('Invalid role specified. Must be one of: user, admin, marketer');

    console.log("Setting up account for " + name + " with email " + email + " and region " + region + (role ? " and role " + role : ""));

    const adminClient = await createSupabaseAdminClient();
    let userResponse: any;

    const createBuyEvent = async (): Promise<{ ipUsed: string, ipSource: string } | null> => {
        if (offer_slugs && offer_slugs.length > 0) {
            validateRequestBody(body, ['purchase_date', 'payment_method', 'value', 'currency']);

            let userIp = fallback_ip;
            let ipSource = 'fallback';

            if (!userIp) {
                const { data: latestTracking } = await adminClient
                    .from('tracking')
                    .select('ip')
                    .eq('email', email)
                    .not('ip', 'is', null)
                    .order('date', { ascending: false })
                    .limit(1)
                    .single();

                if (latestTracking && latestTracking.ip) {
                    userIp = latestTracking.ip;
                    ipSource = 'tracking';
                }
            }
            
            const { data: offerData, error: offerError } = await adminClient
                .from('offers')
                .select('*')
                .in('slug', offer_slugs);

            if (offerError || !offerData || offerData.length !== offer_slugs.length) {
                throw new Error(`One or more offers with slugs [${offer_slugs.join(', ')}] not found.`);
            }

            const offers: Offer[] = offerData;
            const primaryOffer = offers.find(o => o.type === OfferType.PRIMARY);
            const secondaryOffer = offers.find(o => o.type === OfferType.SECONDARY);

            const finalIpForTracking = userIp || await getClientIp(request);

            if (!finalIpForTracking)
                throw new Error('Could not determine IP address for tracking.');

            await trackServer(request, 'buy', {
                ip: finalIpForTracking,
                date: purchase_date,
                url: request.url,
                event_id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                user_agent: '',
                name: name,
                email: email,
                region: region,
                value: value,
                currency: currency,
                primary_offer_slug: primaryOffer?.slug,
                primary_offer_price: primaryOffer ? getPricing(primaryOffer, region).discounted_price : undefined,
                secondary_offer_slug: secondaryOffer?.slug,
                secondary_offer_price: secondaryOffer ? getPricing(secondaryOffer, region).discounted_price : undefined,
                payment_method: payment_method,
                payment_id: payment_id,
                payment_status: 'succeeded',
            });

            return { ipUsed: finalIpForTracking, ipSource: userIp ? ipSource : 'request' };
        }
        return null;
    };

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name: name,
            display_name: name,
            region: region,
            stripe_customer_id: stripe_customer_id || null,
            role: role || 'user' // Default to 'user' if not specified
        }
    });

    if (createError) {
        if (createError.message === 'User already registered' || createError.message.includes('A user with this email address has already been registered')) {
            const existingUser = await getUserByEmail(email);

            if (!existingUser)
                throw new Error('User found but not found later! Email: ' + email);

            const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(
                existingUser.id,
                { password }
            );

            if (updateError)
                throw new Error('Error updating password for ' + email + ': ' + updateError.message);
            
            userResponse = updatedUser;
        } else {
            throw new Error('Error creating user from "' + email + '": ' + createError.message);
        }
    } else {
        userResponse = newUser.user;
    }
    
    const buyEventInfo = await createBuyEvent();
    
    let session = null;
    if (auto_login) {
        const supabase = await createSupabaseServerClient();

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        session = signInData.session;

        if (signInError) {
            sendServerErrorEmail(body, request, 'Auto-login failed:', signInError);
            return createSuccessResponse({
                user: userResponse,
                error: 'Auto-login failed, please sign in manually'
            });
        }
    }

    return createSuccessResponse({
        user: userResponse,
        session: session,
        buyEventInfo: buyEventInfo
    });
});