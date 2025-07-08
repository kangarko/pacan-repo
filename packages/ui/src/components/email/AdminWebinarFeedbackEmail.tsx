import React from 'react';
import { Body, Container, Head, Html, Preview, Section, Heading, Text } from '@react-email/components';

interface AdminWebinarFeedbackEmailProps {
    webinar_title: string;
    rating: number;
    comment?: string;
    user_name: string;
    user_email: string;
}

export default function AdminWebinarFeedbackEmail(props: AdminWebinarFeedbackEmailProps) {
    if (props.rating === undefined || props.user_name === undefined || props.user_email === undefined || props.rating < 1 || props.rating > 5 || !props.webinar_title)
        throw new Error('Missing or invalid props for AdminWebinarFeedbackEmail: ' + JSON.stringify(props));

    return (
        <Html>
            <Head />
            <Preview>New webinar feedback received</Preview>
            <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff', margin: 0 }}>
                <Container style={{ padding: '24px' }}>
                    <Heading as="h2" style={{ color: '#1e1e1e', margin: '0 0 16px' }}>
                        ⭐ New Webinar Feedback
                    </Heading>
                    <Text style={{ fontSize: '14px', color: '#333333', margin: '0 0 12px' }}>
                        Webinar: <strong>{props.webinar_title}</strong>
                    </Text>
                    <Text style={{ fontSize: '14px', color: '#333333', margin: '0 0 12px' }}>
                        Rating: <strong>{props.rating}/5</strong>
                    </Text>
                    {props.comment && (
                        <Section style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                            <Text style={{ fontSize: '14px', color: '#333333', margin: 0 }}>
                                {props.comment}
                            </Text>
                        </Section>
                    )}
                    {(props.user_name || props.user_email) && (
                        <Text style={{ fontSize: '12px', color: '#666666', marginTop: '24px' }}>
                            Submitted by: {props.user_name} ({props.user_email})
                        </Text>
                    )}
                </Container>
            </Body>
        </Html>
    );
} 