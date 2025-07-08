import { Body, Container, Head, Heading, Html, Preview, Section, Text, } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import { EmailFooter } from '@repo/ui/components/email/EmailFooter';
import { formatCurrency } from '@repo/ui/lib/utils';

interface OrderConfirmationEmailProps {
    name: string;
    description: string;
    value: number;
    currency: string;
    has_account: boolean;
    setup_url: string;
    payment_id: string;
}

export const OrderConfirmationEmail = (data: OrderConfirmationEmailProps) => {
    if (!data.name || !data.description || !data.value || !data.currency || !data.has_account || !data.setup_url || !data.payment_id) {
        const missingParams: string[] = [];

        if (!data.name) missingParams.push('name');
        if (!data.description) missingParams.push('description');
        if (!data.value) missingParams.push('value');
        if (!data.currency) missingParams.push('currency');
        if (data.has_account === undefined) missingParams.push('has_account');
        if (!data.setup_url) missingParams.push('setup_url');
        if (!data.payment_id) missingParams.push('payment_id');

        if (missingParams.length > 0) 
            throw new Error('Missing required parameters in OrderConfirmationEmail: ' + missingParams.join(', '));
    }

    return (
        <Html>
            <Head />
            <Preview>{"Hvala na Vašoj narudžbi! 🎉"}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto max-w-screen-md">
                        {/* Purple top border accent */}
                        <div className="h-2 bg-purple-600 rounded-t-lg mb-2" />

                        <Section className="bg-white rounded-lg p-8 border border-gray-200">
                            <Heading className="text-3xl font-bold text-purple-700 mb-4">
                                Hvala na kupnji, {data.name}! 🎉
                            </Heading>

                            <Text className="text-gray-700 mb-6 text-lg">
                                Vaša narudžba je uspješno primljena i obrađena.
                                {data.has_account ?
                                    ' Možete se prijaviti na svoj račun da biste pristupili svojoj kupovini.' :
                                    ' Sljedeći korak je postavljanje lozinke za pristup Vašoj kupovini.'}
                            </Text>

                            {/* Order Details */}
                            <Section className="border-l-4 border-purple-500 pl-4 mb-8">
                                <Heading className="text-xl font-semibold text-purple-700 mb-3">
                                    Detalji narudžbe
                                </Heading>
                                <Text className="text-gray-700 text-lg">
                                    <strong>Kupovina:</strong> {data.description}<br />
                                    <strong>Broj narudžbe:</strong> {data.payment_id}<br />
                                    <strong>Iznos:</strong> {formatCurrency(data.value, data.currency)}
                                </Text>
                            </Section>

                            {/* Conditional content based on account status */}
                            {data.has_account ? (
                                <div>
                                    <Text className="text-gray-700 mb-6 text-lg">
                                        Primijetili smo da već imate račun kod nas. Da biste pristupili svojoj kupovini,
                                        prijavite se koristeći Vašu registriranu e-mail adresu.
                                    </Text>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_BASE_URL}/login`}
                                        style={{
                                            backgroundColor: "#9333ea",
                                            color: "#ffffff",
                                            padding: "16px 32px",
                                            borderRadius: "8px",
                                            fontWeight: "500",
                                            fontSize: "18px",
                                            textDecoration: "none",
                                            display: "inline-block",
                                            textAlign: "center",
                                            margin: "0 auto"
                                        }}
                                    >
                                        Prijavite se
                                    </a>
                                    <Text className="text-purple-600 text-sm mt-2 break-words">
                                        Ako ne možete kliknuti na gumb, koristite ovu direktnu poveznicu za prijavu:
                                        <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/login`} style={{ color: "#9333ea" }}>
                                            {`${process.env.NEXT_PUBLIC_BASE_URL}/login`}
                                        </a>
                                    </Text>
                                    <Text className="text-purple-600 text-sm mt-4 italic">
                                        Ako ste zaboravili lozinku, možete ju resetirati na stranici za prijavu.
                                    </Text>
                                </div>
                            ) : (
                                <div>
                                    <Text className="text-gray-700 mb-6 text-lg">
                                        <strong>VAŽNO:</strong> Da biste pristupili svojoj kupovini, potrebno je postaviti lozinku za Vaš račun.
                                        Kliknite na gumb ispod da nastavite.
                                    </Text>
                                    <a
                                        href={data.setup_url}
                                        style={{
                                            backgroundColor: "#9333ea",
                                            color: "#ffffff",
                                            padding: "16px 32px",
                                            borderRadius: "8px",
                                            fontWeight: "500",
                                            fontSize: "18px",
                                            textDecoration: "none",
                                            display: "inline-block",
                                            textAlign: "center",
                                            margin: "0 auto"
                                        }}
                                    >
                                        Postavite Lozinku
                                    </a>
                                    <Text className="text-purple-600 text-sm mt-4">
                                        <strong>Napomena:</strong> Spremite ovaj e-mail! Nakon što postavite lozinku,
                                        možete pristupiti svojoj kupovini u bilo kojem trenutku prijavom na:
                                    </Text>
                                    <Text className="text-purple-600 text-sm mt-2 break-words">
                                        <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/login`} style={{ color: "#9333ea" }}>
                                            {`${process.env.NEXT_PUBLIC_BASE_URL}/login`}
                                        </a>
                                    </Text>
                                </div>
                            )}

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