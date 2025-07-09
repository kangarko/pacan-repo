import { createPostHandler, validateRequestBody } from '@repo/ui/lib/serverUtils';
import { NextResponse } from 'next/server';
import { convertTimeZoneToGmtOffset } from '@repo/ui/lib/serverUtils';

export const POST = createPostHandler(async (body) => {
    const { webinar_id, timezone } = body;
    
    validateRequestBody(body, ['webinar_id', 'timezone']);

    if (!process.env.EVERWEBINAR_API_KEY)
        throw new Error('EverWebinar API key is not configured.');

    const gmtTimezone = convertTimeZoneToGmtOffset(timezone);

    const response = await fetch('https://api.webinarjam.com/everwebinar/webinar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            api_key: process.env.EVERWEBINAR_API_KEY,
            webinar_id: webinar_id.toString(),
            timezone: gmtTimezone,
        }),
    });

    const data = await response.json();

    if (data.status !== 'success')
        return NextResponse.json({ error: 'Failed to fetch webinar details from EverWebinar.', details: data }, { status: 500 });

    return NextResponse.json(data.webinar);
});