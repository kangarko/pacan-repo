import React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Link } from '@react-email/components';

interface AdminContactFormEmailProps {
    name: string;
    email: string;
    message: string;
}

export const AdminContactFormEmail = (data: AdminContactFormEmailProps) => {
    if (!data.name || !data.email || !data.message) {
        throw new Error('Missing required parameters in AdminContactFormEmail');
    }

    return (
        <Html>
            <Head>
                <style>
                    {`
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        margin: 0;
                    }
                    `}
                </style>
            </Head>
            <Preview>Novi kontakt s weba - {data.name}</Preview>
            <Body style={{ backgroundColor: '#ffffff' }}>
                <Container style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                    <div style={{
                        backgroundColor: '#7e22ce',
                        backgroundImage: 'linear-gradient(135deg, #7e22ce, #9333ea)',
                        color: 'white',
                        padding: '18px 20px',
                        fontWeight: 'bold',
                        fontSize: '22px',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                    }}>
                        📧 Nova poruka s kontakt forme
                    </div>
                    <Section style={{ padding: '25px', border: '1px solid #e5e7eb', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <table cellPadding={0} cellSpacing={0} border={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top', width: 80 }}>Ime:</td>
                                        <td style={{ padding: '4px 0', color: '#111827', fontSize: '13px', fontWeight: '600', verticalAlign: 'top' }}>{data.name}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top' }}>Email:</td>
                                        <td style={{ padding: '4px 0', color: '#0284c7', fontSize: '13px', fontWeight: '500', verticalAlign: 'top' }}>
                                            <Link href={`mailto:${data.email}`} style={{ color: '#0284c7', textDecoration: 'none' }}>{data.email}</Link>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <Heading as="h2" style={{ fontSize: '18px', color: '#374151', margin: '24px 0 16px', fontWeight: '600' }}>
                            Poruka
                        </Heading>
                        <div style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '14px',
                            color: '#111827',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {data.message}
                        </div>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AdminContactFormEmail; 