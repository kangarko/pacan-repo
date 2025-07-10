'use client';

import ChallengeRegistration from "@/components/ChallengeRegistration";
import ExitPopup from "@/components/ExitPopup";
import SocialProofWidget from "@/components/SocialProofWidget";
import { UserContextData } from "@repo/ui/lib/types";
import { retrieveData } from "@repo/ui/lib/clientUtils";
import { useEffect, useState } from "react";

export default function Home() {
    const [userContext, setUserContext] = useState<UserContextData | null>(null);

    useEffect(() => {
        const fetchContext = async () => {
            const context = await retrieveData();
            setUserContext(context);
        };
        fetchContext();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900">
            <ChallengeRegistration />
            <ExitPopup userContext={userContext} />
            <SocialProofWidget userContext={userContext} />
            {/* <ChatBubble /> */}
        </div>
    );
}
