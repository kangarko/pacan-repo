import { createErrorResponse, createPostHandler, createSuccessResponse, createSupabaseAdminClient, createSupabaseServerClient, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { FoundWebinar, Webinar, WebinarActiveSession as WebinarActiveSession } from '@repo/ui/lib/types';
import { hasOffer } from '@repo/ui/lib/utils';

export const POST = createPostHandler(async (body) => {
    const { webinar_slug, user_id } = body;

    validateRequestBody(body, ['webinar_slug', 'user_id']);

    const adminClient = await createSupabaseAdminClient();
    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();

    const now = new Date();

    const { data: webinarData, error: webinarError } = await adminClient
        .from('webinars')
        .select('*')
        .eq('url', webinar_slug)
        .single();

    if (webinarError)
        throw webinarError;

    const webinar = webinarData as Webinar;

    if (!webinar)
        return createErrorResponse('Webinar not found by slug ' + webinar_slug);

    if (user && user.email && webinar.offer.offer_slug) {
        const { data: trackingData, error: trackingError } = await adminClient
            .from('tracking')
            .select('*')
            .eq('type', 'buy')
            .eq('email', user.email);

        if (trackingError)
            throw trackingError;

        if (hasOffer(trackingData, user.email, webinar.offer.offer_slug)) {
            console.log("Logged in user " + user.email + " has offer: " + webinar.offer.offer_slug + ", returning empty schedules.");

            return createSuccessResponse({
                webinar_id: webinar.id,
                title: webinar.title,
                schedules: [],
                offer_slug: webinar.offer.offer_slug,
                active_session: null,
            } as FoundWebinar);
        }
    }

    const { data: sessions, error: sessionsError } = await adminClient
        .from('webinar_sessions')
        .select('*')
        .eq('webinar_id', webinar.id)
        .eq('user_id', user_id)
        .order('start_date', { ascending: false });

    if (sessionsError)
        throw sessionsError;

    let activeSession: WebinarActiveSession | null = null;

    if (sessions && sessions.length > 0)
        for (const session of sessions) {
            const sessionStartDate = new Date(session.start_date);
            const sessionEndTime = new Date(sessionStartDate.getTime() + (webinar.duration_seconds * 1000));

            const lateJoinCutoff = new Date(sessionStartDate.getTime() + (15 * 60 * 1000));

            if (now > lateJoinCutoff && now < sessionEndTime)
                continue;

            if (sessionEndTime > now) {
                const isActive = sessionStartDate <= now && now <= lateJoinCutoff;

                activeSession = {
                    id: session.id,
                    status: isActive ? 'active' : 'upcoming',
                    start_date: sessionStartDate,
                    end_date: sessionEndTime
                };

                break;
            }
        }

    return createSuccessResponse({
        webinar_id: webinar.id,
        title: webinar.title,
        schedules: webinar.schedules,
        offer_slug: webinar.offer.offer_slug,
        active_session: activeSession,
    } as FoundWebinar);
});