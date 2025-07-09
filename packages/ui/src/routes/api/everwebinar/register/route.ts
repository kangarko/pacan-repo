import { createPostHandler, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { NextResponse } from 'next/server';

export const POST = createPostHandler(async (body) => {
    const { webinar_id, first_name, last_name, email, schedule, timezone } = body;
    validateRequestBody(body, ['webinar_id', 'first_name', 'email', 'schedule']);

    const apiKey = process.env.EVERWEBINAR_API_KEY;

    if (!apiKey)
        throw new Error('EverWebinar API key is not configured.');

    const formResponse = new URLSearchParams({
        api_key: apiKey,
        webinar_id: webinar_id.toString(),
        first_name,
        email,
        schedule: schedule.toString(),
    });

    if (last_name)
        formResponse.append('last_name', last_name);

    if (timezone)
        formResponse.append('timezone', timezone);

    const response = await fetch('https://api.webinarjam.com/everwebinar/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formResponse,
    });

    const data = await response.json();

    if (data.status !== 'success')
        return NextResponse.json({ error: 'Failed to register for webinar.', details: data }, { status: 500 });

    return NextResponse.json(data);
});