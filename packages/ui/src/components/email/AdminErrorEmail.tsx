import React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components';

interface AdminErrorEmailProps {
    message: string;
    stack?: string;
    url?: string;
    name?: string;
    email?: string;
    region?: string;
    user_id?: string;
    ip?: string;
    user_agent?: string;
    get_params?: string;
    post_params?: Record<string, any>;
}

export const AdminErrorEmail = (data: AdminErrorEmailProps) => {    
    return (
        <Html>
            <Head>
                <style>
                    {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    `}
                </style>
            </Head>
            <Preview>{`Error Alert: ${data.message}`}</Preview>
            <Body style={{ margin: '0', padding: '0', backgroundColor: '#f7f7fc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                <Section style={{ backgroundColor: '#7c3aed', backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)', padding: '30px 20px', }}>
                    <Container>
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            {/* Warning Icon SVG */}
                            <div style={{ width: '60px', height: '60px', flexShrink: 0, marginRight: '20px' }}>
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 8V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 16H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {/* Error Text and Timestamp */}
                            <div style={{ textAlign: 'left' }}>
                                <Heading style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: 'white', lineHeight: '1.2' }}>
                                    Error Detected
                                </Heading>
                            </div>
                        </div>
                    </Container>
                </Section>

                {/* Main Content */}
                <Container style={{ padding: '20px', maxWidth: '100%' }}>
                    
                    {/* Error Summary */}
                    <Heading as="h2" style={{ margin: '0 0 15px', fontSize: '18px', color: '#e11d48', display: 'flex', alignItems: 'center', }}>
                        <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        Error Message
                    </Heading>
                    <Text style={{ fontSize: '15px', lineHeight: '1.5', color: '#111827', padding: '15px', backgroundColor: '#FEF2F2', borderLeft: '4px solid #e11d48', margin: '0 0 30px', fontWeight: '500', wordBreak: 'break-word', borderRadius: '0 6px 6px 0' }}>
                        {data.message}
                    </Text>

                    {/* User Information */}
                    {(data.name || data.email || data.region) && (
                        <div style={{ marginBottom: '30px' }}>
                            <Heading as="h2" style={{ margin: '0 0 10px', fontSize: '16px', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="7" r="4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                User Information
                            </Heading>
                            <Text style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '12px', margin: '0', color: '#374151', fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {[
                                    data.name ? `Name: ${data.name}` : 'No name',
                                    data.email ? `Email: ${data.email}` : 'No email',
                                    data.region ? `Region: ${data.region}` : 'No region',
                                ].filter(Boolean).join(' | ')}
                            </Text>
                        </div>
                    )}

                    {/* IP Address */}
                    {(data.ip) && (
                        <div style={{ marginBottom: '30px' }}>
                            <Heading as="h2" style={{ margin: '0 0 10px', fontSize: '16px', color: '#4b5563', display: 'flex', alignItems: 'center', }}>
                                <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        {/* Globe Icon SVG */}
                                        <circle cx="12" cy="12" r="10" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="2" y1="12" x2="22" y2="12" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                IP Address
                            </Heading>
                            <Text style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '12px', margin: '0', color: '#374151', fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {data.ip}
                            </Text>
                        </div>
                    )}
                    
                    {/* user id */}
                    {(data.user_id) && (
                        <div style={{ marginBottom: '30px' }}>
                            <Heading as="h2" style={{ margin: '0 0 10px', fontSize: '16px', color: '#4b5563', display: 'flex', alignItems: 'center', }}>
                                <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        {/* User Icon SVG */}
                                        <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                User ID
                            </Heading>
                            <Text style={{ padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '12px', margin: '0', color: '#374151', fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {data.user_id}
                            </Text>
                        </div>
                    )}

                    {/* Device Information */}
                    {data.user_agent && (
                        <div style={{ marginBottom: '30px' }}>
                            <Heading as="h2" style={{
                                margin: '0 0 10px',
                                fontSize: '16px',
                                color: '#4b5563',
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                                {/* Device Icon SVG */}
                                <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.5 1.5H8.25C7.00736 1.5 6 2.50736 6 3.75V20.25C6 21.4926 7.00736 22.5 8.25 22.5H15.75C16.9926 22.5 18 21.4926 18 20.25V3.75C18 2.50736 16.9926 1.5 15.75 1.5H13.5M10.5 1.5V3H13.5V1.5M10.5 1.5H13.5M12 18.75H12.0075" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                User Agent
                            </Heading>
                            <Text style={{
                                padding: '8px 12px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '4px',
                                fontSize: '12px',
                                margin: '0',
                                color: '#374151',
                                fontFamily: 'monospace',
                                wordBreak: 'break-word',
                                lineHeight: '1.4'
                            }}>
                                {data.user_agent}
                            </Text>
                        </div>
                    )}

                    {/* Stack Trace without scrolling limitation */}
                    {data.stack && (
                        <div style={{ marginBottom: '30px' }}>
                            <Heading as="h2" style={{
                                margin: '0 0 15px',
                                fontSize: '16px',
                                color: '#4b5563',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {/* Stack Trace Icon SVG */}
                                <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                Stack Trace
                            </Heading>
                            <div style={{
                                backgroundColor: '#1e1e3f',
                                color: '#e0e0ff',
                                padding: '12px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {data.stack}
                            </div>
                        </div>
                    )}

                    {/* Request Context: URL, Query Params and Post Params */}
                    {(data.url || data.get_params || data.post_params) && (
                        <div style={{ marginBottom: '30px' }}>
                            <Heading as="h2" style={{
                                margin: '0 0 15px',
                                fontSize: '16px',
                                color: '#4b5563',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {/* Request Info Icon SVG */}
                                <span style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 13V9" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M11 17h2" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                Request Context
                            </Heading>

                            {/* URL */}
                            {data.url && (
                                <div style={{ marginBottom: '15px' }}>
                                    <Heading as="h3" style={{
                                        margin: '0 0 5px',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#4b5563'
                                    }}>
                                        {/* URL Icon SVG */}
                                        <span style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 17H7C5.93913 17 4.92172 16.5786 4.17157 15.8284C3.42143 15.0783 3 14.0609 3 13C3 11.9391 3.42143 10.9217 4.17157 10.1716C4.92172 9.42143 5.93913 9 7 9H9M15 9H17C18.0609 9 19.0783 9.42143 19.8284 10.1716C20.5786 10.9217 21 11.9391 21 13C21 14.0609 20.5786 15.0783 19.8284 15.8284C19.0783 16.5786 18.0609 17 17 17H15M7 13H17" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        URL
                                    </Heading>
                                    <Text style={{
                                        fontSize: '13px',
                                        margin: '0',
                                        fontFamily: 'monospace',
                                        color: '#374151',
                                        wordBreak: 'break-word',
                                        padding: '8px 12px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '4px'
                                    }}>
                                        {data.url}
                                    </Text>
                                </div>
                            )}

                            {/* Query Parameters */}
                            {data.get_params && (
                                <div style={{ marginBottom: '15px' }}>
                                    <Heading as="h3" style={{
                                        margin: '0 0 5px',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#4b5563'
                                    }}>
                                        {/* Query Params Icon SVG */}
                                        <span style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 9L11 12L8 15M13 15H16M5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20Z" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        Query Parameters
                                    </Heading>
                                    <Text style={{
                                        fontSize: '13px',
                                        margin: '0',
                                        color: '#374151',
                                        fontFamily: 'monospace',
                                        wordBreak: 'break-word',
                                        padding: '8px 12px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '4px'
                                    }}>
                                        {data.get_params}
                                    </Text>
                                </div>
                            )}

                            {/* Post Parameters */}
                            {data.post_params && Object.keys(data.post_params || {}).length > 0 && (
                                <div style={{
                                    fontFamily: 'monospace',
                                    fontSize: '13px',
                                    color: '#374151',
                                }}>
                                    {Object.entries(data.post_params).map(([key, value], index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            flexWrap: 'wrap',
                                            borderBottom: index < Object.keys(data.post_params || {}).length - 1 ? '1px solid #e5e7eb' : 'none',
                                            padding: '8px 0',
                                        }}>
                                            <div style={{
                                                flexBasis: '200px',
                                                flexShrink: 0,
                                                fontWeight: '500',
                                                color: '#6366f1',
                                                padding: '4px 8px 4px 0',
                                            }}>
                                                {key}:
                                            </div>
                                            <div style={{
                                                flex: '1 1 250px',
                                                padding: '4px 0',
                                                wordBreak: 'break-word',
                                                backgroundColor: key === 'password' ? '#f9fafb' : 'transparent',
                                            }}>
                                                {typeof value === 'object' 
                                                    ? JSON.stringify(value, null, 2)
                                                    : String(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Container>
            </Body>
        </Html>
    );
};

export default AdminErrorEmail; 