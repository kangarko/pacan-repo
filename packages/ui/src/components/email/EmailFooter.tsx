import React from 'react';
import { Hr, Text, Link } from '@react-email/components';

export const EmailFooter: React.FC = () => {
    return (
        <>
            <Hr className="border-gray-200 my-6" />
            <Text className="text-purple-700 text-sm">
                Srdačan pozdrav,<br />
                <strong className="text-purple-800">{process.env.NEXT_PUBLIC_SITE_NAME}</strong>
            </Text>
            <Text className="text-gray-600 text-xs mt-2">
                {process.env.NEXT_PUBLIC_SITE_ADDRESS}
            </Text>
            <Text className="text-center text-xs text-purple-500 mt-4">
                <Link href={process.env.NEXT_PUBLIC_BASE_URL} className="text-purple-600 hover:text-purple-700">
                    {process.env.NEXT_PUBLIC_BASE_URL}
                </Link>
            </Text>
        </>
    );
}; 