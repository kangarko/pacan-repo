import { createPostHandler, createSuccessResponse, verifyAdminOrMarketerUser } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    await verifyAdminOrMarketerUser();

    const redirectAfterAuth = body.redirectUrl || `${process.env.NEXT_PUBLIC_BASE_URL!}/admin/integrations`;
    const state = Buffer.from(JSON.stringify({ redirect: redirectAfterAuth })).toString('base64');

    const scope = [
        'ads_management',
        'ads_read',
        'business_management',
        'public_profile',
        'pages_messaging',
        'pages_show_list'
    ].join(',');

    const facebookAuthUrl = new URL('https://www.facebook.com/v22.0/dialog/oauth');
    facebookAuthUrl.searchParams.append('client_id', process.env.FACEBOOK_APP_ID!);
    facebookAuthUrl.searchParams.append('redirect_uri', `${process.env.NEXT_PUBLIC_BASE_URL!}/api/auth/facebook-callback`);
    facebookAuthUrl.searchParams.append('scope', scope);
    facebookAuthUrl.searchParams.append('state', state);
    facebookAuthUrl.searchParams.append('response_type', 'code');

    return createSuccessResponse({
        authUrl: facebookAuthUrl.toString()
    });
}); 