import { NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient, sendServerErrorEmail } from '@repo/ui/lib/serverUtils';
import { fetchJsonGet } from '@repo/ui/lib/utils';

/**
 * API route that handles the Facebook OAuth callback
 * Since Facebook redirects to this URL with query parameters, 
 * we need both GET and POST handlers for full compatibility.
 */
export async function POST(request: Request) {
    return handleFacebookCallback(request);
}

export async function GET(request: Request) {
    return handleFacebookCallback(request);
}

/**
 * Common handler function to process the Facebook OAuth callback
 */
async function handleFacebookCallback(request: Request) {
    const body = await request.text();
    let redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/integrations`; // Default redirect

    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorReason = url.searchParams.get('error_reason');
        const errorDescription = url.searchParams.get('error_description'); // Added for potentially more detail

        // Always try to parse state first to get the intended redirect URL
        if (state) {
            try {
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                redirectUrl = decodedState.redirect || redirectUrl;

            } catch (stateError) {
                sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);

                throw new Error('Error in Facebook callback API: ' + stateError);
            }
        }

        // Handle error cases first, using the potentially updated redirectUrl
        if (error) {
            const displayError = errorDescription || errorReason || error;

            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError(`Authentication failed: ${displayError}`, redirectUrl, error, errorReason);
        }

        if (!code) {
            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError('Missing authorization code', redirectUrl);
        }

        // --- Token Exchange and User Update ---

        // Exchange authorization code for an access token
        const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL!}/api/auth/facebook-callback`;
        const tokenData = await fetchJsonGet(tokenUrl);

        if (tokenData.error || !tokenData.access_token) {
            const fbErrorMsg = tokenData.error?.message || 'Unknown error during token exchange.';

            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError(`Failed to exchange Facebook code for token: ${fbErrorMsg}`, redirectUrl, tokenData.error?.type, tokenData.error?.code);
        }

        const shortLivedUserToken = tokenData.access_token;

        // Exchange short-lived token for a long-lived one
        const longLivedTokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedUserToken}`;
        const longLivedTokenData = await fetchJsonGet(longLivedTokenUrl);

        if (longLivedTokenData.error || !longLivedTokenData.access_token) {
            const fbErrorMsg = longLivedTokenData.error?.message || 'Unknown error exchanging for long-lived token.';

            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError(`Failed to get long-lived Facebook token: ${fbErrorMsg}`, redirectUrl, longLivedTokenData.error?.type, longLivedTokenData.error?.code);
        }

        const longLivedUserToken = longLivedTokenData.access_token;


        // Get user info using the long-lived token
        const userInfoUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${longLivedUserToken}`;
        const userInfo = await fetchJsonGet(userInfoUrl);

        if (userInfo.error) {
            const fbErrorMsg = userInfo.error?.message || 'Unknown error fetching user info.';

            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError(`Failed to fetch Facebook user info: ${fbErrorMsg}`, redirectUrl, userInfo.error?.type, userInfo.error?.code);
        }

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError('You must be logged in to connect Facebook', redirectUrl);
        }

        const adminClient = await createSupabaseAdminClient();

        // Update the user's metadata with Facebook integration data
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    facebook_integration: {
                        connected: true,
                        connectedAt: new Date().toISOString(),
                        name: userInfo.name,
                        id: userInfo.id,
                        user_access_token: longLivedUserToken, // Storing long-lived token
                        email: userInfo.email, // Storing email if available
                        updatedAt: new Date().toISOString()
                    }
                }
            }
        );

        if (updateError) {
            sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);
            return redirectWithError(`Failed to save Facebook connection: ${updateError.message}`, redirectUrl);
        }

        // --- Success Redirect ---
        const finalRedirectUrl = new URL(redirectUrl);
        finalRedirectUrl.searchParams.append('integration', 'facebook');
        finalRedirectUrl.searchParams.append('status', 'success');

        return NextResponse.redirect(finalRedirectUrl.toString());

    } catch (error) {
        sendServerErrorEmail(body, request, 'Error in Facebook callback API:', error);

        // Use the redirectUrl derived from state if possible, otherwise default
        return redirectWithError('An unexpected error occurred during Facebook callback.', redirectUrl);
    }
}

/**
 * Redirects the user back to the integrations page with error parameters.
 * @param errorMessage The primary error message to display.
 * @param baseRedirectUrl The base URL to redirect to (usually /admin/integrations).
 * @param fbError The 'error' code from Facebook's response (optional).
 * @param fbErrorReason The 'error_reason' from Facebook's response (optional).
 */
function redirectWithError(
    errorMessage: string,
    baseRedirectUrl: string,
    fbError?: string | null,
    fbErrorReason?: string | null
): NextResponse {
    try {
        const errorUrl = new URL(baseRedirectUrl); // Use the potentially updated base URL
        errorUrl.searchParams.append('integration', 'facebook');
        errorUrl.searchParams.append('status', 'error');
        errorUrl.searchParams.append('message', encodeURIComponent(errorMessage));

        // Add specific Facebook error details if available
        if (fbError) {
            errorUrl.searchParams.append('fb_error', fbError);
        }
        if (fbErrorReason) {
            errorUrl.searchParams.append('fb_error_reason', fbErrorReason);
        }

        return NextResponse.redirect(errorUrl.toString());

    } catch (urlError) {
        const fallbackUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/integrations`);

        fallbackUrl.searchParams.append('integration', 'facebook');
        fallbackUrl.searchParams.append('status', 'error');
        fallbackUrl.searchParams.append('message', encodeURIComponent("An unexpected error occurred, and the redirect URL was invalid: " + urlError));

        return NextResponse.redirect(fallbackUrl.toString());
    }
} 