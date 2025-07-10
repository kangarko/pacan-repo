'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { Webinar, WebinarSession } from '@repo/ui/lib/types';
import { Loader2, AlertCircle, CalendarDays, Clock, Mail, ArrowRight, AlertTriangle, CheckCircle, Calendar, Users, Video, Plus } from 'lucide-react';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';

interface WebinarTime {
    id: string;
    date: {
        day: number;
        month: number;
        year: number;
    };
    time: string;
}

function CountdownSegment({ value, label }: { value: number; label: string }) {
    return (
        <div className="text-center bg-white/10  p-3 sm:p-4 rounded-lg min-w-[70px] sm:min-w-[90px] border border-white/20">
            <div className="text-3xl sm:text-5xl font-bold text-white">{String(value).padStart(2, '0')}</div>
            <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider font-medium">{label}</div>
        </div>
    );
}

function ThankYouContent({ sessionId }: { sessionId: string }) {
    const router = useRouter();

    const [session, setSession] = useState<WebinarSession | null>(null);
    const [webinar, setWebinar] = useState<Webinar | null>(null);
    const [selectedWebinarTime, setSelectedWebinarTime] = useState<WebinarTime | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [targetDateTime, setTargetDateTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [isTimePassed, setIsTimePassed] = useState(false);
    const [isMissedSession, setIsMissedSession] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setIsTimePassed(false);
            setIsMissedSession(false);
            setError(null);

            try {
                const sessionResponse = await fetchJsonPost(`/api/webinar/get-session`, {
                    session_id: sessionId
                });

                if (sessionResponse.error)
                    throw new Error(sessionResponse.error);

                if (!sessionResponse.session)
                    throw new Error('Session data not found');

                if (!sessionResponse.webinar)
                    throw new Error('Webinar data not found');

                const sessionData = sessionResponse.session;
                const webinarData = sessionResponse.webinar;

                if (!sessionData.webinar_id)
                    throw new Error('Session missing webinar_id');

                if (!sessionData.user_email)
                    throw new Error('Session missing user_email');

                if (!sessionData.user_name)
                    throw new Error('Session missing user_name');

                if (!sessionData.schedule_id)
                    throw new Error('Session missing schedule_id');

                if (!sessionData.start_date)
                    throw new Error('Session missing start_date');

                // Set state directly from the response
                setSession(sessionData);
                setWebinar(webinarData);

                // Calculate time from start_date
                const sessionStartDate = new Date(sessionData.start_date);

                // Create the WebinarTime object from the session start date
                const webinarTime: WebinarTime = {
                    id: sessionData.schedule_id,
                    date: {
                        day: sessionStartDate.getDate(),
                        month: sessionStartDate.getMonth(),
                        year: sessionStartDate.getFullYear()
                    },
                    time: `${sessionStartDate.getHours()}:${String(sessionStartDate.getMinutes()).padStart(2, '0')}`
                };

                setSelectedWebinarTime(webinarTime);
                setTargetDateTime(sessionStartDate);

                const now = new Date();
                // Calculate 15 minutes after session start
                const lateJoinCutoff = new Date(sessionStartDate.getTime() + (15 * 60 * 1000));

                // Check if we've passed the start time
                if (now > sessionStartDate) {
                    setIsTimePassed(true);

                    // Check if we've passed the 15-minute cutoff
                    if (now > lateJoinCutoff) {
                        setIsMissedSession(true);
                    }
                }

            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Greška pri učitavanju podataka';
                setError(msg);
                sendClientErrorEmail('Error on webinar thank you page:', err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [sessionId]);

    useEffect(() => {
        if (!targetDateTime || isTimePassed) {
            if (timeLeft !== null) setTimeLeft(null);
            return;
        }

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = targetDateTime.getTime() - now;

            if (difference <= 0) {
                clearInterval(timer);
                setTimeLeft(null);
                if (session && webinar) {
                    router.push(`/webinar/live/${sessionId}`);
                }
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDateTime, router, session, webinar, isTimePassed, timeLeft, sessionId]);

    const handleReschedule = () => {
        setIsRedirecting(true);
        router.push('/webinar');
    };

    // Calendar event generation functions
    const generateCalendarEvent = () => {
        if (!webinar || !targetDateTime) return null;
        
        const startDate = new Date(targetDateTime);
        const endDate = new Date(startDate.getTime() + (webinar.duration_seconds * 1000));
        
        return {
            title: webinar.title,
            start: startDate,
            end: endDate,
            description: `Pridružite se webinaru "${webinar.title}".\n\nPoveznica za pristup bit će poslana na vaš e-mail: ${session?.user_email}\n\nVažno: Dođite 5 minuta ranije!`,
            location: 'Online webinar'
        };
    };

    const generateGoogleCalendarUrl = () => {
        const event = generateCalendarEvent();
        if (!event) return '';
        
        const formatDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };
        
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            dates: `${formatDate(event.start)}/${formatDate(event.end)}`,
            details: event.description,
            location: event.location
        });
        
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const generateOutlookCalendarUrl = () => {
        const event = generateCalendarEvent();
        if (!event) return '';
        
        const formatDate = (date: Date) => {
            return date.toISOString();
        };
        
        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: event.title,
            startdt: formatDate(event.start),
            enddt: formatDate(event.end),
            body: event.description,
            location: event.location
        });
        
        return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    };

    const generateICSFile = () => {
        const event = generateCalendarEvent();
        if (!event) return '';
        
        const formatDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, -1) + 'Z';
        };

        if (!process.env.NEXT_PUBLIC_SITE_NAME)
            throw new Error('NEXT_PUBLIC_SITE_NAME is not set');

        if (!process.env.NEXT_PUBLIC_DOMAIN)
            throw new Error('NEXT_PUBLIC_DOMAIN is not set');

        if (!process.env.NEXT_PUBLIC_REGION)
            throw new Error('NEXT_PUBLIC_REGION is not set');
        
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            `PRODID:-//${process.env.NEXT_PUBLIC_SITE_NAME}//Webinar//${process.env.NEXT_PUBLIC_REGION}`,
            'BEGIN:VEVENT',
            `UID:${sessionId}@${process.env.NEXT_PUBLIC_DOMAIN}`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(event.start)}`,
            `DTEND:${formatDate(event.end)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
            `LOCATION:${event.location}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
        
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'webinar.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateYahooCalendarUrl = () => {
        const event = generateCalendarEvent();
        if (!event) return '';
        
        const formatDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, -1);
        };
        
        const params = new URLSearchParams({
            v: '60',
            title: event.title,
            st: formatDate(event.start),
            et: formatDate(event.end),
            desc: event.description,
            in_loc: event.location
        });
        
        return `https://calendar.yahoo.com/?${params.toString()}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg">Učitavanje informacija o webinaru...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-900/10 text-white p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-xl font-semibold text-red-400">Došlo je do pogreške</p>
                <p className="text-red-300 text-center max-w-md mb-6">{error}</p>
                <Link href="/webinar" className="px-4 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] rounded-lg text-white font-medium">
                    Pokušajte ponovno
                </Link>
            </div>
        );
    }

    // This check must come AFTER isLoading and error, but BEFORE isTimePassed for correct display logic
    if (!webinar || !selectedWebinarTime || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
                <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                <p className="text-lg">Informacije o webinaru nisu dostupne.</p>
                <Link href="/webinar" className="mt-6 px-4 py-2 bg-[#6B498F] hover:bg-[#4b2c5e] rounded-lg text-white font-medium">
                    Natrag na registraciju
                </Link>
            </div>
        );
    }

    if (isMissedSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
                <div className="bg-purple-800/50 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-10 max-w-2xl w-full text-center border border-purple-700/50">
                    <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Propustili ste webinar</h1>
                    <p className="text-md sm:text-lg text-purple-300 mb-6">
                        Nažalost, zakasnili ste na webinar &quot;{webinar.title}&quot; i webinar je već popunio sva dostupna mjesta. Možda postoji drugi termin koji Vam odgovara.
                    </p>

                    <button
                        onClick={handleReschedule}
                        disabled={isRedirecting}
                        className="inline-flex items-center justify-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-purple-900 font-semibold rounded-lg transition-colors group text-sm sm:text-base w-full sm:w-auto"
                    >
                        {isRedirecting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Preusmjeravanje...
                            </>
                        ) : (
                            <>
                                Odaberite novi termin
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (isTimePassed && !isMissedSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
                <div className="bg-purple-800/50 backdrop-blur-md rounded-xl shadow-2xl p-6 sm:p-10 max-w-2xl w-full text-center border border-purple-700/50">
                    <Clock className="w-16 h-16 text-green-400 mx-auto mb-6" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Webinar je započeo!</h1>
                    <p className="text-md sm:text-lg text-purple-300 mb-6">
                        Webinar &quot;{webinar.title}&quot; je već počeo. Još uvijek se možete pridružiti!
                    </p>
                    <Link
                        href={`/webinar/live/${sessionId}`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors group text-sm sm:text-base"
                    >
                        Pridružite se odmah
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/img/confetti-pattern.svg')] opacity-5"></div>
                <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-8 pb-12 sm:pt-12">
                {/* Success checkmark animation */}
                <div className="mb-6 relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                        <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping-slow"></div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 text-center animate-fade-in-up">
                    Čestitamo, {session.user_name.trim()}!
                </h1>
                <p className="text-lg sm:text-xl text-white/90 mb-8 text-center max-w-2xl animate-fade-in-up animation-delay-200">
                    Uspješno ste rezervirali svoje mjesto na besplatnom webinaru koji će promijeniti način na koji razumijete svoje veze
                </p>

                {/* Countdown timer */}
                {timeLeft && (
                    <div className="mb-8 animate-fade-in-up animation-delay-300">
                        <h4 className="text-lg font-semibold text-white mb-4 text-center">Webinar počinje za:</h4>
                        <div className="flex justify-center items-start space-x-2 sm:space-x-3">
                            {timeLeft.days > 0 && <CountdownSegment value={timeLeft.days} label="Dana" />}
                            <CountdownSegment value={timeLeft.hours} label="Sati" />
                            <CountdownSegment value={timeLeft.minutes} label="Min" />
                            <CountdownSegment value={timeLeft.seconds} label="Sek" />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
                    {/* Left column - Video */}
                    <div className="animate-fade-in-up animation-delay-400">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                            <div className="p-6 sm:p-8">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 flex items-center">
                                    <Video className="w-6 h-6 mr-3 text-yellow-400" />
                                    Što dalje?
                                </h2>
                                {webinar.thank_you_video_url ? (
                                    <div className="aspect-video relative overflow-hidden rounded-lg bg-black/20">
                                        <video
                                            src={webinar.thank_you_video_url}
                                            controls
                                            className="w-full h-full"
                                            preload="metadata"
                                        >
                                            Vaš preglednik ne podržava video element.
                                        </video>
                                    </div>
                                ) : (
                                    <div className="aspect-video relative overflow-hidden rounded-lg bg-black/20 flex items-center justify-center">
                                        <p className="text-white/50 text-center p-8">
                                            Video s uputama će uskoro biti dostupan
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Important notes */}
                        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                            <div className="p-6 sm:p-8">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 flex items-center">
                                    <CheckCircle className="w-6 h-6 mr-3 text-yellow-400" />
                                    Što trebate učiniti sada
                                </h2>
                            <div className="space-y-5">
                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 text-purple-900 font-bold rounded-full flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
                                        1
                                    </div>
                                    <div className="ml-4 text-white/95">
                                        <p className="font-bold text-base mb-1 text-white">REZERVIRAJTE {Math.ceil(webinar.duration_seconds / 3600)} SATA</p>
                                        <p className="text-sm text-white/80 leading-relaxed">Blokirajte puna {Math.ceil(webinar.duration_seconds / 3600)} sata u kalendaru i postavite podsjetnik da ne propustite webinar.</p>
                                    </div>
                                </div>

                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 text-purple-900 font-bold rounded-full flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
                                        2
                                    </div>
                                    <div className="ml-4 text-white/95">
                                        <p className="font-bold text-base mb-1 text-white">DOĐITE 5 MINUTA RANIJE</p>
                                        <p className="text-sm text-white/80 leading-relaxed">Neće biti snimaka. Broj mjesta je ograničen pa požurite s prijavom.</p>
                                    </div>
                                </div>

                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 text-purple-900 font-bold rounded-full flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
                                        3
                                    </div>
                                    <div className="ml-4 text-white/95">
                                        <p className="font-bold text-base mb-1 text-white">KORISTITE RAČUNALO</p>
                                        <p className="text-sm text-white/80 leading-relaxed">Za najbolje iskustvo koristite računalo ili laptop. Mobitel nije preporučen.</p>
                                    </div>
                                </div>

                                <div className="flex items-start group">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 text-purple-900 font-bold rounded-full flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition-transform">
                                        4
                                    </div>
                                    <div className="ml-4 text-white/95">
                                        <p className="font-bold text-base mb-1 text-white">UZMITE PREZENTACIJU</p>
                                        <p className="text-sm text-white/80 leading-relaxed">Besplatna prezentacija će biti podijeljena svim sudionicima tijekom webinara.</p>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>

                        
                    </div>

                    {/* Right column - Webinar details */}
                    <div className="space-y-6 animate-fade-in-up animation-delay-500">

                        {/* Webinar info */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sm:p-8">
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 flex items-center">
                                <CalendarDays className="w-6 h-6 mr-3 text-yellow-400" />
                                Detalji vašeg webinara
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Calendar className="w-5 h-5 text-yellow-400 mr-3" />
                                    <div>
                                        <p className="text-white/60 text-sm">Datum</p>
                                        <p className="text-white font-medium">
                                            {new Date(targetDateTime!).toLocaleDateString('hr-HR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <Clock className="w-5 h-5 text-yellow-400 mr-3" />
                                    <div>
                                        <p className="text-white/60 text-sm">Vrijeme</p>
                                        <p className="text-white font-medium">{selectedWebinarTime.time}</p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <Users className="w-5 h-5 text-yellow-400 mr-3" />
                                    <div>
                                        <p className="text-white/60 text-sm">Tema webinara</p>
                                        <p className="text-white font-medium">{webinar.title}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Add to Calendar */}
                            <div className="mt-6 pt-6 border-t border-white/20">
                                <button
                                    onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all duration-200"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="font-medium">Dodajte u kalendar</span>
                                </button>
                                
                                {showCalendarOptions && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in-up">
                                        <button
                                            onClick={() => window.open(generateGoogleCalendarUrl(), '_blank')}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14a2 2 0 0 0 2 2h3.5l2-2H8a.5.5 0 0 1-.5-.5V7h11v1.5l2-2V2l-1.5 1.5M12 10v2H8v-2h4m6-1.5l-5.27 5.27L11 12l-1.73 1.73L11 15.5l2.75-2.75L19 7.5" fill="#4285F4"/>
                                            </svg>
                                            <span className="text-sm text-white/80">Google</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => window.open(generateOutlookCalendarUrl(), '_blank')}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z" fill="#0078D4"/>
                                            </svg>
                                            <span className="text-sm text-white/80">Outlook</span>
                                        </button>
                                        
                                        <button
                                            onClick={generateICSFile}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="#666"/>
                                            </svg>
                                            <span className="text-sm text-white/80">Apple</span>
                                        </button>
                                        
                                        <button
                                            onClick={() => window.open(generateYahooCalendarUrl(), '_blank')}
                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#720E9E"/>
                                            </svg>
                                            <span className="text-sm text-white/80">Yahoo</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Auto-redirect indicator */}
                            {!timeLeft && !isTimePassed && (
                                <div className="mt-8 pt-6 border-t border-white/20">
                                    <div className="flex flex-col items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mb-3" />
                                        <p className="text-white/80 text-sm">Preusmjeravanje na webinar...</p>
                                    </div>
                                </div>
                            )}

                            {isTimePassed && (
                                <div className="mt-6">
                                    <Link
                                        href={`/webinar/live/${sessionId}`}
                                        className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-purple-900 font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        Pridružite se webinaru odmah
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Email confirmation box */}
                        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl animate-fade-in-up animation-delay-600">
                            <div className="p-6 sm:p-8">
                                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 flex items-center">
                                    <Mail className="w-6 h-6 mr-3 text-yellow-400" />
                                    Provjerite svoju e-poštu
                                </h2>
                                <p className="text-white/80 text-sm">
                                    Poslali smo vam e-mail na <span className="font-semibold text-yellow-400">{session.user_email}</span> s detaljima o webinaru i poveznicom za pristup.
                                </p>
                                <p className="text-white/60 text-xs mt-2">
                                    Ako ne vidite e-mail, provjerite spam ili promidžbene mape.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ThankYouPage() {
    const params = useParams<{ sessionId: string }>();
    const sessionId = params.sessionId;

    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                <p className="text-lg">Učitavanje...</p>
            </div>
        }>
            <ThankYouContent sessionId={sessionId} />
        </Suspense>
    );
} 