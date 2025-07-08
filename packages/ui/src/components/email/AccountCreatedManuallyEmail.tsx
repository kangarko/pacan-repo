import React from 'react';
import { Body, Container, Head, Heading, Html, Preview, Section, Text, Link } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import { EmailFooter } from '@repo/ui/components/email/EmailFooter';

interface AccountCreatedManuallyEmailProps {
    name: string;
    loginUrl: string;
    password: string;
}

export const AccountCreatedManuallyEmail = (data: AccountCreatedManuallyEmailProps) => {
    if (!data.name)
        throw new Error('Missing required parameters in AccountCreatedManuallyEmail: name');

    if (!data.loginUrl)
        throw new Error('Missing required parameters in AccountCreatedManuallyEmail: loginUrl');

    if (!data.password)
        throw new Error('Missing required parameters in AccountCreatedManuallyEmail: password');

    return (
        <Html>
            <Head />
            <Preview>Vaš korisnički račun je kreiran!</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto max-w-screen-md">
                        {/* Purple top border accent */}
                        <div className="h-2 bg-purple-600 rounded-t-lg mb-2" />

                        <Section className="bg-white rounded-lg p-8 border border-gray-200">
                            <Heading className="text-3xl font-bold text-purple-700 mb-4">
                                Vaš korisnički račun je kreiran!
                            </Heading>

                            <Text className="text-gray-700 mb-6 text-lg">
                                Poštovana {data.name},
                            </Text>

                            <Text className="text-gray-700 mb-6 text-lg">
                                Nedavno ste kupili moju knjigu &quot;Stilovi privrženosti&quot;. Primijetili smo da još niste kreirali svoj račun, pa smo ga mi kreirali za Vas.
                            </Text>

                            <Text className="text-gray-700 mb-6 text-lg">
                                Možete se prijaviti na <Link href={data.loginUrl} style={{ color: "#9333ea", textDecoration: 'underline' }}>{data.loginUrl}</Link> koristeći svoju e-poštu i lozinku <strong style={{ color: '#111827' }}>{data.password}</strong> koju kasnije možete promijeniti u postavkama svog profila.
                            </Text>

                            <Text className="text-gray-700 mb-6 text-lg">
                                Uživajte u čitanju!
                            </Text>

                            <EmailFooter />
                        </Section>

                        {/* Purple bottom border accent */}
                        <div className="h-2 bg-purple-600 rounded-b-lg mt-2" />
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default AccountCreatedManuallyEmail; 