//import ExitPopup from "@/components/ExitPopup";
//import SocialProofWidget from "@/components/SocialProofWidget";
import ChallengeRegistration from "@/components/ChallengeRegistration";
import ChatBubble from "@repo/ui/components/ChatBubble";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900">
            <ChallengeRegistration />
            {/*<ExitPopup />
            <SocialProofWidget />*/}
            <ChatBubble />
        </div>
    );
}
