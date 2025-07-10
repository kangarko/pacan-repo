'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { Webinar, WebinarMessage, WebinarOffer, WebinarSession } from '@repo/ui/lib/types';
import { sendClientErrorEmail, retrieveData } from '@repo/ui/lib/clientUtils';
import { Loader2, Send, UserCircle, MessageSquare, AlertCircle, Film, Clock, ArrowRight, PlayCircle, ChevronRight, ChevronLeft, Radio, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import OrderForm from '@repo/ui/components/OrderForm';
import { UserContextData } from '@repo/ui/lib/types';

interface ActiveOffer {
    isActive: boolean;
    offer: WebinarOffer;
}

interface DisplayMessage {
    id: string;
    author_name: string;
    message: string;
    displayTime: string;
    is_admin?: boolean;
    isOwnMessage?: boolean;
    time_seconds: number;
}

// Memoized list of chat messages to avoid re-rendering on unrelated state changes
const ChatMessagesList = memo(function ChatMessagesList({ messages }: { messages: DisplayMessage[] }) {
    if (messages.length === 0)
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <MessageSquare className="w-10 h-10 mb-2" />
                <p>Chat je trenutno prazan.</p>
                <p className="text-xs">Pričekajte poruke ili pošaljite svoju!</p>
            </div>
        );

    return (
        <>
            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.is_admin || msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-2 rounded-lg shadow ${msg.is_admin ? 'bg-purple-700 text-white' : (msg.isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200')}`}>
                        <div className="flex items-center mb-0.5">
                            <UserCircle className={`w-4 h-4 mr-1.5 ${msg.is_admin ? 'text-purple-300' : (msg.isOwnMessage ? 'text-blue-300' : 'text-gray-400')}`} />
                            <span className="text-xs font-semibold mr-2">{msg.author_name}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                </div>
            ))}
        </>
    );
}, (prevProps, nextProps) => {
    const prevLast = prevProps.messages[prevProps.messages.length - 1]?.id;
    const nextLast = nextProps.messages[nextProps.messages.length - 1]?.id;
    return prevProps.messages.length === nextProps.messages.length && prevLast === nextLast;
});

const ChatInput = memo(function ChatInput({
    value,
    onChange,
    onSend,
    disabled,
    sending,
    error
}: {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    disabled: boolean;
    sending: boolean;
    error: string | null;
}) {
    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                onSend();
            }}
            className="p-3 border-t border-gray-700 bg-gray-800"
        >
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Napišite poruku..."
                    className="flex-grow min-w-0 p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    disabled={disabled}
                />
                <button
                    type="submit"
                    className="p-2 bg-[#6B498F] hover:bg-[#4b2c5e] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled || !value.trim()}
                >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </form>
    );
}, (prev, next) => prev.value === next.value && prev.disabled === next.disabled && prev.sending === next.sending && prev.error === next.error);

export default function LiveWebinarPage() {
    const params = useParams<{ sessionId: string }>();
    const sessionId = params.sessionId;
    const router = useRouter();
    const searchParams = useSearchParams();
    const timeQueryParam = searchParams.get('time');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [webinar, setWebinar] = useState<Webinar | null>(null);
    const [session, setSession] = useState<WebinarSession | null>(null);
    const [chatMessages, setChatMessages] = useState<WebinarMessage[]>([]);
    const [localChatMessages, setLocalChatMessages] = useState<DisplayMessage[]>([]);
    const [userChatMessage, setUserChatMessage] = useState('');
    const [activeOffer, setActiveOffer] = useState<ActiveOffer>({ isActive: false, offer: {} as WebinarOffer });
    const [combinedAndSortedMessages, setCombinedAndSortedMessages] = useState<DisplayMessage[]>([]);

    const [userContext, setUserContext] = useState<UserContextData | null>(null);

    useEffect(() => {
        async function loadUserContext() {
            setUserContext(await retrieveData());
        }

        loadUserContext();
    }, []);

    const [videoCurrentTime, setVideoCurrentTime] = useState(0);
    const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [userScrolledUp, setUserScrolledUp] = useState(false);

    // Automatically open chat when the webinar offer becomes visible
    useEffect(() => {
        if (activeOffer.isActive && !isChatVisible) 
            setIsChatVisible(true);
        
    }, [activeOffer.isActive, isChatVisible]);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const orderFormRef = useRef<HTMLDivElement>(null);

    const [participantCount, setParticipantCount] = useState<number>(0);
    const [lastParticipantUpdate, setLastParticipantUpdate] = useState<number>(0);

    const formatMessageTime = useCallback((timeSeconds: number) => {
        const minutes = Math.floor(timeSeconds / 60);
        const seconds = Math.floor(timeSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, []);

    useEffect(() => {
        if (webinar && timeQueryParam !== null) {
            const parsedTime = parseInt(timeQueryParam, 10);
            if (!isNaN(parsedTime)) {
                let targetTime;
                if (parsedTime >= webinar.duration_seconds) {
                    targetTime = Math.max(0, webinar.duration_seconds - 1);
                } else {
                    targetTime = Math.max(0, parsedTime);
                }
                setVideoCurrentTime(targetTime);
            }
        }
    }, [webinar, timeQueryParam]);

    const toggleChatVisibility = () => {
        setIsChatVisible(!isChatVisible);
    };

    const fetchSessionAndWebinar = useCallback(async () => {
        if (!sessionId) 
            return;

        setIsLoading(true);
        setError(null);

        try {
            const sessionResponse = await fetchJsonPost('/api/webinar/get-session', {
                session_id: sessionId
            });

            if (sessionResponse.success !== undefined && sessionResponse.success === false) {
                setError(sessionResponse.error || 'Nepoznata greška prilikom učitavanja webinara');
                setIsLoading(false);
                
                return;
            }

            const sessionData = sessionResponse.session;
            const webinarData = sessionResponse.webinar;

            const timeParamIsPresent = timeQueryParam !== null && timeQueryParam !== undefined && timeQueryParam !== '';
            
            if (!timeParamIsPresent && sessionData.start_date) {
                const sessionStartDate = new Date(sessionData.start_date);
                const now = new Date();

                if (now < sessionStartDate) {
                    router.push(`/webinar/thank-you/${sessionId}`);
                    
                    return;
                }
            }

            setSession(sessionData);
            setWebinar(webinarData);

            // Check natural expiration only if no time parameter (not simulating)
            if (!timeParamIsPresent && sessionData.start_date) {
                const sessionStartDate = new Date(sessionData.start_date);
                const sessionEndTime = new Date(sessionStartDate.getTime() + (webinarData.duration_seconds * 1000));

                if (sessionEndTime < new Date())
                    setIsSessionExpired(true);
            }

            setIsLoading(false);

            try {
                const messagesResponse = await fetchJsonPost('/api/webinar/get-messages', {
                    id: webinarData.id
                });

                setChatMessages(messagesResponse.messages || []);

            } catch (chatErr) {
                sendClientErrorEmail(`Error fetching chat messages for session ${sessionId}:`, chatErr);
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Nepoznata greška';
            setError(`Došlo je do pogreške prilikom učitavanja webinara: ${errorMsg}`);
            sendClientErrorEmail(`Error fetching data for session ${sessionId}`, error);
            setIsLoading(false);
        }
    }, [sessionId, router, timeQueryParam]);

    useEffect(() => {
        fetchSessionAndWebinar();
    }, [fetchSessionAndWebinar]);

    // Monitor video playback for simulated ending
    useEffect(() => {
        if (!webinar || !isVideoReady || isSessionExpired) 
            return;

        // Check if we've reached the end of the video
        if (videoCurrentTime >= webinar.duration_seconds - 1) {
            // Wait a moment to ensure final watchtime update is sent
            setTimeout(() => {
                setIsSessionExpired(true);
            }, 1000);
        }
    }, [videoCurrentTime, webinar, isVideoReady, isSessionExpired]);

    const initializeVideoPlayback = async () => {
        if (!webinar || !session || !videoRef.current || isSessionExpired) return false;

        setIsPlayerInitialized(true);
        setIsConnecting(true);
        const video = videoRef.current;

        const applyInitialTime = () => {
            if (timeQueryParam !== null) {
                const parsedTime = parseInt(timeQueryParam, 10);
                if (!isNaN(parsedTime)) {
                    let targetTime;
                    if (parsedTime >= webinar.duration_seconds) {
                        targetTime = Math.max(0, webinar.duration_seconds - 1);
                    } else {
                        targetTime = Math.max(0, parsedTime);
                    }
                    video.currentTime = targetTime;
                    setVideoCurrentTime(targetTime);
                    return;
                }
            }

            if (!session.start_date) {
                video.currentTime = 0;
                setVideoCurrentTime(0);
                return;
            }

            const now = Date.now();
            const sessionStartTime = new Date(session.start_date).getTime();
            const elapsedSeconds = Math.floor((now - sessionStartTime) / 1000);

            if (elapsedSeconds >= webinar.duration_seconds) {
                video.currentTime = Math.max(0, webinar.duration_seconds - 1);
            } else if (elapsedSeconds > 0) {
                video.currentTime = elapsedSeconds;
            } else {
                video.currentTime = 0;
            }
            setVideoCurrentTime(video.currentTime);
        };

        const startPlayback = async () => {
            try {
                await video.play();

                setIsVideoReady(true);
                setIsConnecting(false);
            } catch (err) {
                setIsConnecting(false);
                if (err && (err as DOMException).name === 'NotAllowedError') {
                    setError('Video se ne može automatski pokrenuti s zvukom. Molimo kliknite ponovno ili provjerite postavke preglednika.');
                } else {
                    setError('Kliknite ponovno za pokretanje videa.');
                }
                console.error("Error during video playback attempt:", err);
            }
        };

        if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
            const onLoaded = async () => {
                video.removeEventListener('loadedmetadata', onLoaded);
                applyInitialTime();
                await startPlayback();
            };
            video.addEventListener('loadedmetadata', onLoaded, { once: true });
            video.load();
        } else {
            applyInitialTime();
            await startPlayback();
        }

        // Debounce time updates to reduce re-renders
        let timeUpdateDebounce: number | null = null;
        video.addEventListener('timeupdate', () => {
            if (timeUpdateDebounce) return;
            timeUpdateDebounce = window.setTimeout(() => {
                setVideoCurrentTime(video.currentTime);
                timeUpdateDebounce = null;
            }, 1000); // Update at most once per second
        });
        video.addEventListener('contextmenu', e => e.preventDefault());

        // Handle video ended event
        video.addEventListener('ended', () => {
            setIsSessionExpired(true);
        });

        return true;
    };

    useEffect(() => {
        if (!webinar?.offer) return;

        const now = videoCurrentTime;

        // Check if offer should be displayed based on time
        const shouldShowOffer = webinar.offer.time <= now;

        if (shouldShowOffer !== activeOffer.isActive || !activeOffer.offer.button_text) {
            setActiveOffer({
                isActive: shouldShowOffer,
                offer: webinar.offer
            });
        }
    }, [videoCurrentTime, webinar?.offer, activeOffer]);

    // Memoize visible server messages calculation
    const visibleServerMessages = useMemo(() => {
        if (!isVideoReady || !chatMessages?.length) return [];
        const currentSeconds = Math.floor(videoCurrentTime);

        // Remove optimization that was causing issues
        return chatMessages
            .filter(msg => msg.time_seconds <= currentSeconds)
            .map(msg => ({
                id: msg.id,
                author_name: msg.user_name,
                message: msg.message,
                displayTime: formatMessageTime(msg.time_seconds),
                is_admin: false,
                isOwnMessage: msg.user_id === session?.user_id,
                time_seconds: msg.time_seconds
            }));
    }, [chatMessages, videoCurrentTime, session, isVideoReady, formatMessageTime]);

    // Memoize visible local messages
    const visibleLocalMessages = useMemo(() => {
        if (!isVideoReady) return [];
        const currentSeconds = Math.floor(videoCurrentTime);
        return localChatMessages.filter(m => m.time_seconds <= currentSeconds);
    }, [localChatMessages, videoCurrentTime, isVideoReady]);

    // Memoize the combined messages to prevent unnecessary re-renders
    const combinedMessages = useMemo(() => {
        if (!isVideoReady) return [];

        // Combine and sort by timestamp
        const combined = [...visibleServerMessages, ...visibleLocalMessages].sort((a, b) => a.time_seconds - b.time_seconds);

        // Limit to the 30 most recent messages
        const MAX_MESSAGES = 30;
        return combined.length > MAX_MESSAGES ? combined.slice(combined.length - MAX_MESSAGES) : combined;
    }, [visibleServerMessages, visibleLocalMessages, isVideoReady]);

    // Replace the existing time-based message calculation useEffect
    useEffect(() => {
        // Only update if messages truly changed
        setCombinedAndSortedMessages(combinedMessages);
    }, [combinedMessages]);

    // Improved scroll handling with RAF for smoother scrolling
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        // Check if user scrolled up significantly
        const isScrolledUp = target.scrollHeight - target.scrollTop - target.clientHeight > 100;

        if (isScrolledUp !== userScrolledUp) {
            setUserScrolledUp(isScrolledUp);
        }
    }, [userScrolledUp]);

    // Enhanced scroll-to-bottom function
    const scrollToBottom = useCallback(() => {
        if (!chatContainerRef.current) return;

        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
            const chatContainer = chatContainerRef.current;
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }, []);

    // Improved scroll effect with less frequent calls
    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (!chatContainer) return;

        // Always scroll to bottom when user hasn't manually scrolled up yet
        if (!userScrolledUp) {
            scrollToBottom();
            return;
        }

        // If the latest message is user's own, ensure it's visible
        const latestMessage = combinedAndSortedMessages[combinedAndSortedMessages.length - 1];
        if (latestMessage?.isOwnMessage) scrollToBottom();
    }, [combinedAndSortedMessages, userScrolledUp, scrollToBottom]);

    const handleSendChatMessage = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();

        if (!session) 
            return;

        if (!userChatMessage.trim()) {
            setError('Poruka je prazna.');
            sendClientErrorEmail('[live/chat] M is empty');
            
            return;
        }

        setIsSendingChatMessage(true);
        setError(null);

        try {
            const newMessage: DisplayMessage = {
                id: `local-${Date.now()}`,
                author_name: session.user_name,
                message: userChatMessage.trim(),
                displayTime: formatMessageTime(videoCurrentTime),
                isOwnMessage: true,
                time_seconds: Math.floor(videoCurrentTime)
            };

            setLocalChatMessages(prev => [...prev, newMessage]);
            setUserChatMessage('');
            setUserScrolledUp(false); // Auto-scroll to bottom for own messages

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Slanje poruke nije uspjelo';
            setError(msg);
            sendClientErrorEmail(`Error sending chat message for session ${sessionId}:`, err);
        } finally {
            setIsSendingChatMessage(false);
        }
    }, [session, userChatMessage, videoCurrentTime, sessionId, setError, setIsSendingChatMessage, setLocalChatMessages, setUserChatMessage, setUserScrolledUp, formatMessageTime]);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (videoRef.current && !videoRef.current.paused)  {
                try {
                    const currentVideoTimeForAPI = Math.round(videoRef.current.currentTime);

                    await fetchJsonPost('/api/webinar/update-watchtime', {
                        session_id: sessionId,
                        current_time: currentVideoTimeForAPI
                    });
        
                    console.log("Updated watchtime for session ", sessionId, " to ", currentVideoTimeForAPI);
                } catch (error) {
                    console.error('Failed to update watchtime:', error);
                }
            }
        }, 20000);

        return () => clearInterval(interval);
    }, [isVideoReady, sessionId, videoRef]);

    useEffect(() => {
        if (!isVideoReady || !webinar?.metadata) return;

        // Only update every 10 seconds
        const now = Date.now();
        if (now - lastParticipantUpdate < 10000 && participantCount > 0) return;

        // Get min/max from metadata or use defaults
        const minParticipants = webinar.metadata.min_participants || 10;
        const maxParticipants = webinar.metadata.max_participants || 150;
        const endParticipants = webinar.metadata.end_participants || 100;

        // Calculate time-based progress
        const totalDuration = webinar.duration_seconds;
        const currentTime = videoCurrentTime;
        const progress = currentTime / totalDuration;

        // Define our uneven Gaussian-like curve
        // We want to reach 80% of max within first 5-15 minutes (depending on total length)
        const risePoint = Math.min(0.2, 900 / totalDuration); // 15 min or 20% of total, whichever is less

        let count;
        if (progress < risePoint) {
            // Fast initial rise - accelerated curve to reach 80% of max quickly
            // Using a modified exponential curve for the rise
            const riseProgress = progress / risePoint;
            const riseRate = 1 - Math.exp(-4 * riseProgress);
            count = minParticipants + (maxParticipants - minParticipants) * 0.8 * riseRate;
        } else if (progress < 0.8) {
            // Plateau with small growth to peak
            const plateauProgress = (progress - risePoint) / (0.8 - risePoint);
            const peak = minParticipants + (maxParticipants - minParticipants) * (0.8 + 0.2 * plateauProgress);
            count = peak;
        } else {
            // Decline toward the end
            const declineProgress = (progress - 0.8) / 0.2;
            count = maxParticipants - (maxParticipants - endParticipants) * declineProgress;
        }

        // Add small random variance (+/- 3%) to make it feel natural
        const variance = count * 0.03 * (Math.random() * 2 - 1);

        // Round to integer
        setParticipantCount(Math.round(count + variance));
        setLastParticipantUpdate(now);
    }, [videoCurrentTime, webinar, isVideoReady, lastParticipantUpdate, participantCount]);

    const onChangeUserChatMessage = useCallback((v: string) => setUserChatMessage(v), []);

    const triggerSend = useCallback(() => {
        // Programmatically create a synthetic event for existing handler
        const fakeEvent = { preventDefault: () => { } } as unknown as React.FormEvent;
        handleSendChatMessage(fakeEvent);
    }, [handleSendChatMessage]);

    const scrollToOrderForm = () => {
        if (orderFormRef.current) {
            orderFormRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!sessionId)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-xl font-semibold text-red-400">Session ID nije pronađen</p>
            </div>
        );

    if (isLoading)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg">Učitavanje webinara...</p>
            </div>
        );

    if (error || !webinar || !session)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-900/10 text-white p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-xl font-semibold text-red-400">{error ? 'Došlo je do pogreške' : !webinar? 'Webinar nije pronađen' : 'Sesija nije pronađena'}</p>
                <p className="text-red-300 text-center max-w-md">{error}</p>
                <Link href="/webinar" className="mt-6 px-4 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] rounded-lg text-white font-medium">
                    Povratak na početnu
                </Link>
            </div>
        );

    if (isSessionExpired) {
        // Check if the user watched the webinar based on persisted watchtime
        const userWatchedEnough = session?.watchtime_seconds &&
            (session.watchtime_seconds / webinar.duration_seconds) > 0.5;

        // Only show feedback if they watched a significant part of the webinar
        if (userWatchedEnough) {
            return <WebinarFeedbackScreen
                webinarTitle={webinar.title}
                webinarId={webinar.id}
                sessionId={sessionId}
                webinarDuration={webinar.duration_seconds}
                offerButtonUrl={webinar.offer?.button_url}
            />;
        }

        // Otherwise show the "webinar ended" message
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
                <div className="bg-purple-800/50 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-10 max-w-2xl w-full text-center border border-purple-700/50">
                    <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Webinar je završio</h1>
                    <p className="text-md sm:text-lg text-purple-300 mb-6">
                        Nažalost, vrijeme za webinar &quot;{webinar.title}&quot; je već prošlo.
                    </p>
                    <Link href="/webinar" className="inline-flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-semibold rounded-lg transition-colors group text-sm sm:text-base">
                        Odaberite drugi termin
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-900 text-white flex flex-col">
            <header className="bg-gray-800 p-2 shadow-lg sticky top-0 z-50 text-xs sm:text-sm">
                {/* Mobile */}
                <div className="md:hidden flex items-center py-1 px-2">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400 mr-4 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs leading-tight">
                        <span className="font-medium text-yellow-400">Napomena:</span> Za najbolje iskustvo koristite računalo.
                        Webinar možete ponovno otvoriti putem e-mail poveznice.
                    </span>
                </div>

                {/* Desktop */}
                <div className="hidden md:flex items-center justify-center gap-2 animate-pulse">
                    {isVideoReady ? (
                        <>
                            <Radio className="w-4 h-4 text-white align-[-0.125em]" />
                            <span>Webinar je u tijeku, ne zatvarajte ovu stranicu kako ne biste prekinuli prijenos</span>
                        </>
                    ) : (
                        <>
                            <PlayCircle className="w-4 h-4 text-orange-400 align-[-0.125em]" />
                            <span className="text-orange-400">Pritisnite gumb za reprodukciju kako biste se pridružili prijenosu</span>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-grow w-full relative h-[calc(100vh-80px)] p-3 bg-gray-900 overflow-y-auto">
                <div className="flex flex-col landscape:flex-row h-full w-full gap-3 justify-center items-center landscape:items-center">
                    {/* Video Panel */}
                    <div className={`relative ${isVideoReady ? 'bg-black' : 'bg-transparent'} rounded-xl shadow-lg transition-all duration-300 ease-in-out
                                     w-full max-w-full ${isChatVisible ? 'lg:w-4/5 2xl:w-5/6 landscape:w-4/5 lg:max-h-[70vh]' : 'lg:h-full flex-grow min-w-0'} my-auto flex items-center justify-center`}>

                        {webinar.video_url ? (
                            <div
                                className={`relative aspect-video lg:max-h-full flex items-center justify-center rounded-xl bg-center bg-cover
                                             ${isChatVisible ? 'w-full' : 'w-full max-h-full'}`}
                                style={{
                                    backgroundImage:
                                        !isVideoReady && webinar.background_image_url
                                            ? `url(${webinar.background_image_url})`
                                            : undefined
                                }}
                            >
                                <video
                                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 rounded-xl
                                                 ${isVideoReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    style={{ backgroundColor: 'transparent' }}
                                    ref={videoRef}
                                    src={webinar.video_url}
                                    playsInline
                                    disablePictureInPicture
                                    preload="auto"
                                    controls={false}
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    Vaš preglednik ne podržava HTML5 video element.
                                </video>
                                
                                {/* Floating offer button when chat is hidden */}
                                {activeOffer.isActive && !isChatVisible && isVideoReady && (
                                    <button
                                        onClick={scrollToOrderForm}
                                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40
                                                   bg-yellow-400 hover:bg-yellow-500 text-purple-900
                                                   font-bold py-2 px-4 rounded-md text-sm shadow-lg
                                                   flex items-center justify-center"
                                    >
                                        {activeOffer.offer.button_text}
                                    </button>
                                )}
                                
                                {isVideoReady && (
                                    <>
                                        <div className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded-md font-semibold flex items-center z-10">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5"></span>
                                            UŽIVO
                                        </div>
                                    </>
                                )}

                                <AnimatePresence>
                                    {!isVideoReady && (
                                        <motion.div
                                            key="connect-overlay"
                                            initial={{ opacity: 0, scale: 1.04 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            className="absolute inset-0 flex flex-col items-center justify-center text-center gap-0 p-4 cursor-pointer overflow-hidden"
                                            onClick={async () => {
                                                if (!isPlayerInitialized) await initializeVideoPlayback();
                                                else if (videoRef.current) await videoRef.current.play();
                                            }}
                                        >

                                            {isConnecting && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                                                    <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-white mb-4" />
                                                    <span className="text-sm sm:text-base text-white font-medium px-6 py-2 bg-black/40 rounded-full">Spajanje na stream...</span>
                                                </div>
                                            )}
                                            <button
                                                className="z-10 flex items-center justify-center hover:bg-black/60 w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-full transform transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!isPlayerInitialized) await initializeVideoPlayback();
                                                    else if (videoRef.current) await videoRef.current.play();
                                                }}
                                                aria-label="Pokreni webinar"
                                            >
                                                <PlayCircle className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-white" />
                                            </button>
                                            <span className="z-10 inline-block text-md text-white px-4 py-2">
                                                Dodirnite za pokretanje webinara
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-400 p-4 text-center">
                                <Film className="w-16 h-16 mb-2" />
                                <span>Video nije dostupan</span>
                            </div>
                        )}
                    </div>

                    {/* Chat container with toggle button */}
                    <div className={`flex flex-col lg:flex-row lg:items-center relative 
                        ${isChatVisible
                            ? 'w-full h-full flex-grow min-h-0 landscape:w-[20%] landscape:overflow-y-auto lg:w-[20%] 2xl:w-1/6 lg:flex-grow-0 lg:h-full'
                            : 'w-0 lg:w-12 lg:h-full lg:flex-none'}`}>

                        {/* Toggle Button */}
                        <button
                            onClick={toggleChatVisibility}
                            className={`text-gray-400 hover:text-white hover:bg-purple-700/80 p-2 focus:outline-none transition-all duration-300
                                 ease-in-out hidden lg:flex items-center justify-center rounded-l-md z-10 h-12
                                 ${isChatVisible ? 'sticky top-0' : 'lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2'}`}
                            aria-label={isChatVisible ? "Sakrij chat" : "Prikaži chat"}
                        >
                            <div className="flex items-center justify-center">
                                {isChatVisible ? (
                                    <ChevronRight className="w-5 h-5" />
                                ) : (
                                    <ChevronLeft className="w-5 h-5" />
                                )}
                            </div>
                        </button>

                        {/* Chat Panel */}
                        <div className={`bg-gray-800 rounded-xl flex flex-col overflow-hidden border border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${isChatVisible ? 'w-full h-full flex-grow' : 'hidden'}`}>
                            {isVideoReady ? (
                                <>
                                    {activeOffer.isActive ? (
                                        <div className="p-3 border-b border-gray-700 bg-purple-900/30 space-y-3">
                                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-lg shadow-md text-center">
                                                {activeOffer.offer.offer_image_url && (
                                                    <Image src={activeOffer.offer.offer_image_url} alt={activeOffer.offer.button_text} width={80} height={80} className="mx-auto rounded mb-2 object-contain max-h-20" />
                                                )}
                                                {activeOffer.offer.offer_headline && (
                                                    <h3 className="text-sm font-bold text-yellow-300 mb-1">
                                                        {activeOffer.offer.offer_headline}
                                                    </h3>
                                                )}
                                                {activeOffer.offer.offer_description && (
                                                    <p className="text-sm text-purple-100 mb-2 px-2">
                                                        {activeOffer.offer.offer_description}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={scrollToOrderForm}
                                                    className="inline-block bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold py-2 px-4 rounded-md text-sm transition-colors transform hover:scale-105"
                                                >
                                                    {activeOffer.offer.button_text}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4 px-4 border-b border-gray-700 bg-gray-900 flex justify-center items-center">
                                            <div className="flex items-center text-gray-300">
                                                <UserCircle className="w-4 h-4 mr-1.5 text-gray-400" />
                                                <span className="font-medium">{participantCount}</span>
                                            </div>
                                            <div className="mx-4 h-5 w-px bg-gray-700/70"></div>
                                            <div className="flex items-center text-gray-300">
                                                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                                <div className="w-20 text-center">
                                                    <span className="font-medium">
                                                        {String(Math.floor(videoCurrentTime / 3600)).padStart(2, '0')}:{String(Math.floor((videoCurrentTime % 3600) / 60)).padStart(2, '0')}:{String(Math.floor(videoCurrentTime % 60)).padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        ref={chatContainerRef}
                                        className="flex-grow overflow-y-auto p-3 space-y-3 bg-gray-800/70 no-scrollbar chat-shadow"
                                        onScroll={handleScroll}
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        <ChatMessagesList messages={combinedAndSortedMessages} />
                                    </div>

                                    <ChatInput
                                        value={userChatMessage}
                                        onChange={onChangeUserChatMessage}
                                        onSend={triggerSend}
                                        disabled={!session?.user_name}
                                        sending={isSendingChatMessage}
                                        error={error}
                                    />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center flex-grow p-3 text-gray-500">
                                    <MessageSquare className="w-10 h-10 mb-2" />
                                    <span>Chat će biti dostupan kada webinar započne.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {webinar?.offer?.offer_slug && userContext && activeOffer.isActive && isVideoReady ? (
                    <div ref={orderFormRef} className="mt-10 w-full max-w-3xl mx-auto px-3">
                        {(() => {
                            if (userContext.offers.length === 0)
                                throw new Error(`No offers found in user data`);

                            if (!webinar.offer.offer_slug)
                                throw new Error(`No offer slug found for webinar: ${webinar.title}`);

                            const primaryOffer = userContext.offers.find(offer => offer.slug === webinar.offer.offer_slug);
                            
                            if (!primaryOffer)
                                throw new Error(`Offer with slug ${webinar.offer.offer_slug} not found`);
                            
                            return (
                                <OrderForm
                                    primaryOffer={primaryOffer}
                                    secondaryOffer={null}
                                    userContext={userContext}
                                />
                            );
                        })()}
                    </div>
                ) : null}
            </main >
        </div >
    );
}

function WebinarFeedbackScreen({ webinarTitle, webinarId, sessionId, webinarDuration, offerButtonUrl }: { webinarTitle: string; webinarId: string; sessionId: string; webinarDuration: number; offerButtonUrl?: string }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Final watchtime update when feedback screen is shown
    useEffect(() => {
        const finalWatchtimeUpdate = async () => {
            try {
                await fetchJsonPost('/api/webinar/update-watchtime', {
                    session_id: sessionId,
                    current_time: webinarDuration
                });
            } catch (error) {
                console.error('Failed to update final watchtime:', error);
            }
        };

        finalWatchtimeUpdate();
    }, [sessionId, webinarDuration]);

    const submit = async () => {
        setIsSubmitting(true);
        try {
            await fetchJsonPost('/api/webinar/send-feedback', {
                webinar_id: webinarId,
                rating,
                comment: comment.trim()
            });
            setSubmitted(true);
        } catch (e: any) {
            setErr(e.message || 'Greška');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
            {!submitted ? (
                <div className="bg-purple-800/50 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center border border-purple-700/50">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Hvala na sudjelovanju!</h1>
                    <p className="text-md sm:text-lg text-purple-300 mb-6">Kako vam se svidio webinar &ldquo;{webinarTitle}&rdquo;?</p>
                    <div className="flex justify-center items-center mb-8 gap-3 p-2">
                        {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
                            <button
                                key={n}
                                onClick={() => setRating(n)}
                                className={`p-1 transition-all transform hover:scale-110 focus:outline-none focus:scale-110`}
                                type="button"
                                aria-label={`Ocijeni ${n} zvjezdica`}
                            >
                                <Star 
                                    className={`w-10 h-10 transition-colors ${
                                        n <= rating 
                                            ? 'text-yellow-400 fill-yellow-400' 
                                            : 'text-gray-600 hover:text-gray-500'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Ostavite komentar (opcionalno)"
                                className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 mb-4 focus:ring-1 focus:ring-purple-500" />
                            {err && <p className="text-red-400 text-sm mb-2">{err}</p>}
                            <button 
                                onClick={submit} 
                                disabled={isSubmitting}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Šalje se...
                                    </>
                                ) : (
                                    'Pošalji'
                                )}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="bg-purple-800/50 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center border border-purple-700/50">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Hvala na povratnoj informaciji!</h1>
                    <p className="text-purple-300 mb-6">Vaša ocjena je zaprimljena.</p>
                    {offerButtonUrl ? (
                        <button
                            onClick={() => {
                                setIsNavigating(true);
                                window.location.href = offerButtonUrl;
                            }}
                            disabled={isNavigating}
                            className="inline-flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-semibold rounded-lg transition-colors group text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isNavigating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Učitavanje...
                                </>
                            ) : (
                                <>
                                    Istražite ponudu
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
} 
