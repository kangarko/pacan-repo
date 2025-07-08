import React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Link } from '@react-email/components';
import { LabeledTracking } from '@repo/ui/lib/types';
import { formatDate } from '@repo/ui/lib/utils';       

interface AdminOrderCompleteEmailProps {
    name: string;
    email: string;
    region: string;
    description: string;
    value: number;
    currency: string;
    payment_method: string;
    setup_url: string;
    journey: LabeledTracking[];
}

export const AdminOrderCompleteEmail = (data: AdminOrderCompleteEmailProps) => {
    if (!data.name || !data.email || !data.region || !data.description || !data.value || !data.currency || !data.payment_method || !data.setup_url || !data.journey) {
        const missingParams: string[] = [];

        if (!data.name) missingParams.push('name');
        if (!data.email) missingParams.push('email');
        if (!data.region) missingParams.push('region');
        if (!data.description) missingParams.push('description');
        if (!data.value) missingParams.push('value'); // Note: Assumes 0 is not a valid value based on original check
        if (!data.currency) missingParams.push('currency');
        if (!data.payment_method) missingParams.push('payment_method');
        if (!data.setup_url) missingParams.push('setup_url');
        if (!data.journey) missingParams.push('journey');

        if (missingParams.length > 0)
            throw new Error(`Missing required parameters in AdminOrderCompleteEmail: ${missingParams.join(', ')}`);
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
                        .mobile-text-center {
                            text-align: center !important;
                        }
                        .mobile-full-width {
                            width: 100% !important;
                            display: block !important;
                        }
                        .mobile-padding {
                            padding: 16px !important;
                        }
                        .key-info {
                            padding: 10px !important;
                        }
                        .info-table td {
                            padding: 3px 0 !important;
                            font-size: 12px !important;
                        }
                        .section-title {
                            margin-top: 24px !important;
                            margin-bottom: 12px !important;
                        }
                        .journey-entry {
                            display: flex !important;
                            flex-wrap: wrap !important;
                        }
                        .journey-date {
                            margin-bottom: 4px !important;
                            display: inline-block !important;
                            font-size: 11px !important;
                        }
                        .journey-action {
                            display: inline !important;
                            font-size: 12px !important;
                            line-height: 1.4 !important;
                        }
                        .journey-campaign {
                            margin-top: 4px !important;
                            margin-left: 0 !important;
                            font-size: 11px !important;
                        }
                        .journey-campaign-id {
                            margin-top: 4px !important;
                            margin-left: 0 !important;
                            font-size: 11px !important;
                        }
                        .journey-adset-id {
                            margin-top: 4px !important;
                            margin-left: 0 !important;
                            font-size: 11px !important;
                        }
                        .journey-ad-id {
                            margin-top: 4px !important;
                            margin-left: 0 !important;
                            font-size: 11px !important;
                        }
                        .action-button {
                            display: block !important;
                            width: 100% !important;
                            text-align: center !important;
                        }
                    }
                    `}
                </style>
            </Head>
            <Preview>Nova narudžba: {data.name} - {data.description} - {String(data.value)} {data.currency}</Preview>
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
                        📚 Nova Narudžba
                        <div style={{
                            fontSize: '15px',
                            fontWeight: 'normal',
                            marginTop: '5px',
                            color: 'rgba(255,255,255,0.9)'
                        }}>
                            {data.description} - <strong>{data.value} {data.currency}</strong>
                        </div>
                    </div>

                    {/* Main content */}
                    <Section className="content" style={{ padding: '25px 25px' }}>
                        {/* Key Information - Compact summary at the very top */}
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
                                        <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top' }}>Proizvod:</td>
                                        <td style={{ padding: '4px 0', color: '#111827', fontSize: '13px', fontWeight: '500', verticalAlign: 'top' }}>
                                            <span style={{ color: '#7c3aed', fontWeight: '600' }}>{data.description}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top' }}>Plaćanje:</td>
                                        <td style={{ padding: '4px 0', color: '#111827', fontSize: '13px', fontWeight: '600', verticalAlign: 'top' }}>
                                            <span>{data.value} {data.currency}</span> <span style={{ color: '#6b7280', fontWeight: '400' }}>putem {data.payment_method}</span>
                                        </td>
                                    </tr>
                                    {data.setup_url && (
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top' }}>Setup URL:</td>
                                            <td style={{ padding: '4px 0', color: '#0284c7', fontSize: '13px', fontWeight: '500', verticalAlign: 'top' }}>
                                                <Link href={data.setup_url} style={{ color: '#0284c7', textDecoration: 'none' }}>{data.setup_url}</Link>
                                            </td>
                                        </tr>
                                    )}
                                    {data.region && (
                                        <tr>
                                            <td style={{ padding: '4px 0', color: '#6b7280', fontSize: '13px', verticalAlign: 'top' }}>Država:</td>
                                            <td style={{ padding: '4px 0', color: '#111827', fontSize: '13px', fontWeight: '500', verticalAlign: 'top' }}>{data.region}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Lookup User Section */}
                        {data.journey && data.journey.length > 0 && (
                            <>
                                <Heading as="h2" className="section-title" style={{ fontSize: '18px', color: '#374151', margin: '0 0 16px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '8px' }}>📊</span> Povijest korisnika
                                </Heading>

                                <div className="mobile-padding" style={{
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                    fontSize: '13px',
                                    color: '#334155',
                                    overflow: 'hidden',
                                    width: '100%'
                                }}>
                                    {data.journey.map((entry: LabeledTracking, index: number) => (
                                        <div key={index} style={{
                                            marginBottom: index === data.journey.length - 1 ? '0' : '12px',
                                            paddingBottom: index === data.journey.length - 1 ? '0' : '12px',
                                            borderBottom: index === data.journey.length - 1 ? 'none' : '1px dashed #cbd5e1',
                                            lineHeight: '1.5',
                                            width: '100%'
                                        }}>
                                            <div className="journey-entry" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                                                <span className="journey-date" style={{
                                                    backgroundColor: '#e0f2fe',
                                                    color: '#0284c7',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    marginRight: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    display: 'inline-block'
                                                }}>
                                                    {formatDate(entry.date)}
                                                </span>
                                                <span className="journey-action" style={{
                                                    color: getActionColor(entry.action),
                                                    fontWeight: '500',
                                                    display: 'inline',
                                                    flex: '1 1 auto'
                                                }}>
                                                    {entry.action}
                                                    {entry.referer && (
                                                        <span style={{ color: '#64748b', fontWeight: 'normal' }}> iz <span style={{ color: '#475569' }}>{entry.referer}</span></span>
                                                    )}
                                                </span>
                                                {entry.source_type && (
                                                    <span className="journey-campaign" style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#fef3c7',
                                                        color: '#92400e',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        marginLeft: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 'medium'
                                                    }}>
                                                        {entry.source_type}${entry.source ? ' - ' + entry.source : ''}
                                                    </span>
                                                )}
                                                {entry.campaign_id && (
                                                    <span className="journey-campaign-id" style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#dbeafe',
                                                        color: '#1e40af',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        marginLeft: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 'medium'
                                                    }}>
                                                        C: {entry.campaign_name}
                                                    </span>
                                                )}
                                                {entry.adset_id && (
                                                    <span className="journey-adset-id" style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#dcfce7',
                                                        color: '#166534',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        marginLeft: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 'medium'
                                                    }}>
                                                        AS: {entry.adset_name}
                                                    </span>
                                                )}
                                                {entry.ad_id && (
                                                    <span className="journey-ad-id" style={{
                                                        display: 'inline-block',
                                                        backgroundColor: '#f5f3ff',
                                                        color: '#5b21b6',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        marginLeft: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 'medium'
                                                    }}>
                                                        A: {entry.ad_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Helper function to determine text color based on action type
function getActionColor(action: string): string {
    if (action.includes('Purchased')) return '#15803d';
    if (action.includes('Signed up')) return '#7c3aed';
    if (action.includes('Initiated checkout')) return '#0891b2';
    if (action.includes('Abandoned checkout')) return '#b91c1c';
    if (action.includes('Visited')) return '#334155';
    return '#334155';
}

export default AdminOrderCompleteEmail; 