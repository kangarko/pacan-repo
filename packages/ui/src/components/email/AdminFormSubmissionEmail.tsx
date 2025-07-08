import React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Link, } from '@react-email/components';

interface AdminFormSubmissionEmailProps {
    form_slug: string;
    name: string;
    email: string;
    owned_offer_names: string[];
    form_data: Record<string, any>;
}

export const AdminFormSubmissionEmail = (data: AdminFormSubmissionEmailProps) => {
    if (!data.form_slug || !data.name || !data.email || !data.owned_offer_names || !data.form_data) {
        const missingParams: string[] = [];
        
        if (!data.form_slug) missingParams.push('form_slug');
        if (!data.name) missingParams.push('name');
        if (!data.email) missingParams.push('email');
        if (!data.owned_offer_names) missingParams.push('owned_offer_names');
        if (!data.form_data) missingParams.push('form_data');

        if (missingParams.length > 0) 
            throw new Error(`Missing required parameters in AdminFormSubmissionEmail: ${missingParams.join(', ')}`);
    }
    
    return (
        <Html>
            <Head>
                <style>
                    {`
                    @media only screen and (max-width: 600px) {
                        .container {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .content {
                            padding: 20px !important;
                        }
                        .headline {
                            padding: 16px 15px !important;
                            font-size: 20px !important;
                        }
                        .key-info {
                            padding: 10px !important;
                        }
                        .info-table td {
                            padding: 3px 0 !important;
                            font-size: 12px !important;
                        }
                        .form-data {
                            padding: 10px !important;
                        }
                        .form-data-item {
                            padding: 6px !important;
                        }
                    }
                    `}
                </style>
            </Head>
            <Preview>Nova forma ispunjena ({data.form_slug}) - {data.name} ({data.email})</Preview>
            <Body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', margin: '0' }}>
                <Container className="container" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', backgroundColor: '#ffffff', padding: '0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>

                    {/* Headline Banner */}
                    <div className="headline" style={{
                        backgroundColor: '#7e22ce',
                        backgroundImage: 'linear-gradient(135deg, #7e22ce, #9333ea)',
                        color: 'white',
                        padding: '18px 20px',
                        fontWeight: 'bold',
                        fontSize: '22px',
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                    }}>
                        📝 Novi upitnik ispunjen ({data.form_slug})
                    </div>

                    {/* Main content */}
                    <Section className="content" style={{ padding: '25px 25px' }}>
                        {/* Key Information - Compact summary */}
                        <div className="key-info" style={{
                            marginBottom: '20px',
                        }}>
                            <table cellPadding={0} cellSpacing={0} border={0} className="info-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top' }}>Proizvodi:</td>
                                        <td style={{ padding: '4px 0', color: '#111827', fontSize: '13px', fontWeight: '500', verticalAlign: 'top' }}>
                                            {data.owned_offer_names.length > 0 ? (
                                                data.owned_offer_names.map((offer: string, index: number) => (
                                                    <span key={index} style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#7c3aed20',
                                                        color: '#7c3aed',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'medium',
                                                        marginRight: '4px',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {offer}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ color: '#6b7280' }}>Nema kupljenih proizvoda</span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Form Data Section */}
                        <Heading as="h2" style={{ fontSize: '18px', color: '#374151', margin: '24px 0 16px', fontWeight: '600' }}>
                            Sadržaj forme
                        </Heading>

                        <div className="form-data" style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '16px'
                        }}>
                            {Object.entries(data.form_data).map(([key, value]) => (
                                <div key={key} className="form-data-item" style={{
                                    padding: '8px 0',
                                    borderBottom: '1px solid #e5e7eb',
                                }}>
                                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>
                                        {key}:
                                    </div>
                                    <div style={{ color: '#111827', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                        {Array.isArray(value)
                                            ? value.join(', ')
                                            : (typeof value === 'string' ? value : JSON.stringify(value))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AdminFormSubmissionEmail; 