import { createPostHandler, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { NextResponse } from 'next/server';

export const POST = createPostHandler(async (body) => {
    const { webinar_id, timezone } = body;
    validateRequestBody(body, ['webinar_id']);

    const apiKey = process.env.EVERWEBINAR_API_KEY;

    if (!apiKey)
        throw new Error('EverWebinar API key is not configured.');

    const apiParams = new URLSearchParams({
        api_key: apiKey,
        webinar_id: webinar_id.toString(),
    });

    if (timezone)
        apiParams.append('timezone', timezone);

    const response = await fetch('https://api.webinarjam.com/everwebinar/webinar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: apiParams,
    });

    const data = await response.json();

    if (data.status !== 'success')
        return NextResponse.json({ error: 'Failed to fetch webinar details from EverWebinar.', details: data }, { status: 500 });

    return NextResponse.json(data.webinar);
});