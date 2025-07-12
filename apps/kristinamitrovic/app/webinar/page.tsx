'use client';

import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Check, Clock, Mail, Shield, Star, User } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';

import { fetchJsonPost } from '@repo/ui/lib/utils';
import { retrieveData, sendClientErrorEmail, track } from '@repo/ui/lib/clientUtils';
import { UserContextData, WebinarSchedule, WebinarScheduleType, FoundWebinar } from '@repo/ui/lib/types';
import GradientBackground from '@repo/ui/components/GradientBackground';
import FooterSection from '@repo/ui/components/FooterSection';
import { useSokolSession } from '@repo/ui/components/SokolSessionHandler';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WebinarClientSchedule {
    schedule_id: string;
    start_date: Date;
}

const getEffectiveDateFromParams = (searchParams: URLSearchParams): Date => {
    const timeParam = searchParams.get('time');
    const baseDate = new Date();

    if (timeParam && /^\d{4}$/.test(timeParam)) {
        const hours = parseInt(timeParam.substring(0, 2), 10);
        const minutes = parseInt(timeParam.substring(2, 4), 10);

        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            const newDate = new Date(baseDate);
            newDate.setHours(hours, minutes, 0, 0);

            console.log(`Simulating time: ${newDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })} (Effective full date: ${newDate.toString()})`);
            return newDate;

        } else
            throw new Error(`Invalid time parameter format: ${timeParam}. Expected HHMM. Ensure the 'time' parameter is a 4-digit string representing HHMM (e.g., 0930 for 9:30 AM). Using current time as fallback.`);
    }

    return new Date(baseDate);
};

const timeToMinutes = (timeStr: string): number => {
    const trimmedTimeStr = timeStr.trim();
    if (!/^\d{1,2}:\d{1,2}$/.test(trimmedTimeStr)) {
        throw new Error(`Invalid time string format: '${trimmedTimeStr}'. Expected HH:MM.`);
    }
    const [hours, minutes] = trimmedTimeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time value in string: '${trimmedTimeStr}'.`);
    }
    return hours * 60 + minutes;
};

function WebinarContent() {
    const { userId, isInitialized } = useSokolSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const effectiveNow = useMemo(() => {
        return getEffectiveDateFromParams(searchParams);
    }, [searchParams]);

    const [formStep, setFormStep] = useState(0);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState<WebinarClientSchedule | null>(null);

    const [error, setError] = useState('');
    const [jitTargetTime, setJitTargetTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const prevTimeLeftRef = useRef<typeof timeLeft>(timeLeft);

    const [userContext, setUserContext] = useState<UserContextData | null>(null);
    const [webinarResponse, setWebinarResponse] = useState<FoundWebinar | null>(null);
    const [schedules, setSchedules] = useState<WebinarClientSchedule[]>([]);

    const [isLoading, setLoading] = useState(true);
    const [isSubmitting, setSubmitting] = useState(false);
    const [isRedirecting, setRedirecting] = useState(false);

    useEffect(() => {
        const cookieEmail = Cookies.get('lead_email');
        const cookieName = Cookies.get('lead_name');

        if (cookieEmail)
            setEmail(cookieEmail);

        if (cookieName)
            setName(cookieName);
    }, []);

    const populateDates = useCallback(() => {
        if (!webinarResponse || !webinarResponse.schedules || webinarResponse.schedules.length === 0) {
            setSchedules([]);

            return;
        }

        const now = effectiveNow;
        const generatedSlots: Array<{ originalSchedule: WebinarSchedule; slotDate: Date; type: WebinarScheduleType }> = [];

        webinarResponse.schedules.forEach(schedule => {
            const scheduleType = schedule.type;

            if (scheduleType === WebinarScheduleType.JUST_IN_TIME && schedule.jit) {
                const { intervals = [0, 15, 30, 45], slot_amount_to_offer = 3 } = schedule.jit;
                let slotsCollected = 0;
                for (let hourOffset = 0; slotsCollected < slot_amount_to_offer && hourOffset < 24; hourOffset++) {
                    const targetHourDate = new Date(now);
                    targetHourDate.setHours(now.getHours() + hourOffset, 0, 0, 0);
                    for (const minuteInterval of intervals) {
                        const potentialSlot = new Date(targetHourDate);
                        potentialSlot.setMinutes(minuteInterval);
                        if (potentialSlot > now) {
                            generatedSlots.push({ originalSchedule: schedule, slotDate: new Date(potentialSlot), type: scheduleType });
                            slotsCollected++;

                            if (slotsCollected >= slot_amount_to_offer)
                                break;
                        }
                    }
                }
            } else if (scheduleType === WebinarScheduleType.RECURRING && schedule.recurrence) {
                const { frequency, days, time } = schedule.recurrence;
                const [slotHour, slotMinute] = time.split(':').map(Number);
                if (frequency === 'WEEKLY') {
                    for (let i = 0; i < 14; i++) { // Check for next 2 weeks
                        const tempDate = new Date(now);
                        tempDate.setDate(now.getDate() + i);
                        tempDate.setHours(slotHour, slotMinute, 0, 0);
                        const dayAbbr = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][tempDate.getDay()];
                        if (days.includes(dayAbbr as any) && tempDate > now) {
                            generatedSlots.push({ originalSchedule: schedule, slotDate: new Date(tempDate), type: scheduleType });
                        }
                    }
                }
            } else if (scheduleType === WebinarScheduleType.DAILY && schedule.daily) {
                const { time, days_ahead, require_before_time } = schedule.daily;
                const [slotHour, slotMinute] = time.split(':').map(Number);
                days_ahead.forEach(dayOffset => {
                    const slotDate = new Date(now);
                    slotDate.setDate(now.getDate() + dayOffset);
                    slotDate.setHours(slotHour, slotMinute, 0, 0);
                    if (slotDate > now) {
                        if (dayOffset === 0 && require_before_time) {
                            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                            const slotTimeMinutes = slotHour * 60 + slotMinute;
                            if (currentTimeMinutes < slotTimeMinutes) {
                                generatedSlots.push({ originalSchedule: schedule, slotDate: slotDate, type: scheduleType });
                            }
                        } else {
                            generatedSlots.push({ originalSchedule: schedule, slotDate: slotDate, type: scheduleType });
                        }
                    }
                });
            }
        });

        const validSlots = generatedSlots.filter(({ originalSchedule, slotDate }) => {
            if (originalSchedule.type === WebinarScheduleType.JUST_IN_TIME && originalSchedule.jit?.block_out) {
                const blockOut = originalSchedule.jit.block_out;
                if (blockOut.holidays) {
                    const slotDateString = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
                    if (blockOut.holidays.includes(slotDateString)) return false;
                }
                if (blockOut.days_of_week) {
                    if (blockOut.days_of_week.includes(slotDate.getDay())) return false;
                }
                if (blockOut.time_ranges) {
                    const slotTimeMinutes = slotDate.getHours() * 60 + slotDate.getMinutes();
                    for (const range of blockOut.time_ranges) {
                        const startMinutes = timeToMinutes(range.start);
                        const endMinutes = timeToMinutes(range.end);

                        // Check if this is an overnight range (start time is later than end time)
                        if (startMinutes > endMinutes) {
                            // For overnight ranges, block if time is after start OR before end
                            if (slotTimeMinutes >= startMinutes || slotTimeMinutes < endMinutes)
                                return false;
                        } else {
                            // For same-day ranges, block if time is between start and end
                            if (slotTimeMinutes >= startMinutes && slotTimeMinutes < endMinutes)
                                return false;
                        }
                    }
                }
            }
            return true;
        });

        const uniqueSlotsMap = new Map<number, { originalSchedule: WebinarSchedule; slotDate: Date; type: WebinarScheduleType }>();
        validSlots.sort((a, b) => a.slotDate.getTime() - b.slotDate.getTime());

        validSlots.forEach(slot => {
            const timeKey = slot.slotDate.getTime();
            const existingSlot = uniqueSlotsMap.get(timeKey);
            if (!existingSlot || (existingSlot.type !== WebinarScheduleType.JUST_IN_TIME && slot.type === WebinarScheduleType.JUST_IN_TIME)) {
                uniqueSlotsMap.set(timeKey, slot);
            } else if (existingSlot.type === WebinarScheduleType.JUST_IN_TIME && slot.type === WebinarScheduleType.JUST_IN_TIME) {
                uniqueSlotsMap.set(timeKey, slot);
            }
        });

        const finalUniqueSlots = Array.from(uniqueSlotsMap.values());
        finalUniqueSlots.sort((a, b) => a.slotDate.getTime() - b.slotDate.getTime());

        const clientSchedules: WebinarClientSchedule[] = finalUniqueSlots.map(s => ({
            schedule_id: s.originalSchedule.id,
            start_date: s.slotDate,
        }));

        setSchedules(clientSchedules);

        const firstJitSlot = finalUniqueSlots.find(s => s.type === WebinarScheduleType.JUST_IN_TIME);

        if (firstJitSlot)
            setJitTargetTime(firstJitSlot.slotDate);

        else if (clientSchedules.length > 0)
            setJitTargetTime(clientSchedules[0].start_date);
    }, [effectiveNow, webinarResponse]);

    useEffect(() => {
        const fetchWebinarData = async () => {
            setLoading(true);
            setError('');
            setSchedules([]);
            setJitTargetTime(null);
            setWebinarResponse(null);

            try {
                setUserContext(await retrieveData());

                const response = await fetchJsonPost('/api/webinar/find-webinar-and-session', {
                    webinar_slug: pathname,
                }) as FoundWebinar;

                setWebinarResponse(response);

            } catch (error: any) {
                sendClientErrorEmail('Došlo je do pogreške prilikom dohvaćanja termina webinara', error);
                setError(error.message);
                setWebinarResponse(null);
            } finally {
                setLoading(false);
            }
        };
        fetchWebinarData();
    }, [pathname, searchParams]);

    useEffect(() => {
        if (isLoading)
            return;

        if (!webinarResponse) {
            setSchedules([]);
            setJitTargetTime(null);
            return;
        }

        if (webinarResponse.title)
            document.title = webinarResponse.title;

        populateDates();

    }, [webinarResponse, isLoading, effectiveNow, populateDates]);

    useEffect(() => {
        if (!jitTargetTime && (!webinarResponse?.active_session || !webinarResponse.active_session.start_date)) {
            setTimeLeft(null);
            return;
        }

        const timerInstanceEffectiveStartTime = new Date(effectiveNow);
        const realWorldTimeAtTimerStart = Date.now();
        let intervalId: number | null = null;

        const updateCountdown = () => {
            const targetDate = webinarResponse?.active_session?.start_date
                ? new Date(webinarResponse.active_session.start_date)
                : jitTargetTime;

            if (!targetDate) {
                setTimeLeft(null);
                if (intervalId) window.clearInterval(intervalId);
                return false;
            }

            const elapsedRealWorldTime = Date.now() - realWorldTimeAtTimerStart;
            const currentCountdownTime = new Date(timerInstanceEffectiveStartTime.getTime() + elapsedRealWorldTime);
            const difference = targetDate.getTime() - currentCountdownTime.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
                return true;
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                if (intervalId) window.clearInterval(intervalId);
                return false;
            }
        };

        if (!updateCountdown()) {
            return;
        }

        intervalId = window.setInterval(updateCountdown, 1000);

        return () => {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [jitTargetTime, webinarResponse, effectiveNow]);

    const performRedirect = useCallback((path: string) => {
        setRedirecting(true);
        router.push(path);
    }, [router]);

    useEffect(() => {
        const timerJustExpired =
            prevTimeLeftRef.current &&
            (prevTimeLeftRef.current.days > 0 || prevTimeLeftRef.current.hours > 0 || prevTimeLeftRef.current.minutes > 0 || prevTimeLeftRef.current.seconds > 0) && // Timer was running
            timeLeft &&
            timeLeft.days === 0 &&
            timeLeft.hours === 0 &&
            timeLeft.minutes === 0 &&
            timeLeft.seconds === 0;

        if (timerJustExpired) {
            if (webinarResponse?.active_session && !isRedirecting) {
                const sessionStartDate = new Date(webinarResponse.active_session.start_date);
                const currentEffectiveTime = new Date(effectiveNow); // Use the stable effectiveNow

                if (currentEffectiveTime >= sessionStartDate)
                    performRedirect(`/webinar/live/${webinarResponse.active_session.id}`);
            }
        }
        prevTimeLeftRef.current = timeLeft;
    }, [timeLeft, webinarResponse, isRedirecting, router, effectiveNow, performRedirect]);

    const scrollToForm = () => {
        const element = document.getElementById('webinar-form');

        if (element)
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleEmailSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        if (!userContext || !webinarResponse) {
            setSubmitting(false);
            throw new Error('User context or region not found');
        }

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError('Molimo unesite email adresu');
            setSubmitting(false);
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            setError('Molimo unesite ispravnu email adresu');
            setSubmitting(false);
            return;
        }

        if (!userId) {
            throw new Error('Critical error: userId not available for webinar_email tracking');
        }

        track('webinar_email', {
            email: trimmedEmail,
            region: userContext.region,
            primary_offer_slug: webinarResponse.offer_slug,
            user_id: userId
        });

        Cookies.set('lead_email', trimmedEmail);

        setEmail(trimmedEmail);
        setError('');
        setSubmitting(false);
        setFormStep(2);
    };

    const handleNameSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

        if (!userContext || !webinarResponse) {
            setSubmitting(false);
            throw new Error('User context or region not found');
        }

        if (!selectedSchedule) {
            setError('Molimo odaberite vrijeme webinara. Vratite se na prvi korak.');
            setSubmitting(false);
            setFormStep(0);
            return;
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 2) {
            setError('Molimo unesite vaše ime');
            setSubmitting(false);
            return;
        }

        if (trimmedName.includes('@')) {
            setError('Molimo unesite vaše ime bez email adrese');
            setSubmitting(false);
            return;
        }

        if (!userId) {
            throw new Error('Critical error: userId not available for webinar_name tracking');
        }

        track('webinar_name', {
            name: trimmedName,
            email: email,
            region: userContext.region,
            primary_offer_slug: webinarResponse.offer_slug,
            user_id: userId
        });

        Cookies.set('lead_name', trimmedName);

        setName(trimmedName);
        setError('');
        completeRegistration();
    };

    const completeRegistration = async () => {
        if (!selectedSchedule) {
            setError('Molimo odaberite vrijeme webinara');
            setSubmitting(false);
            return;
        }

        if (!webinarResponse) {
            setError('Webinar nije definiran. Molimo kontaktirajte podršku.');
            sendClientErrorEmail('Webinar is undefined on webinar opt-in page', new Error('API did not return webinar'));
            setSubmitting(false);

            return;
        }

        if (!userContext) {
            setSubmitting(false);
            throw new Error('User context not found');
        }

        if (!userId) {
            throw new Error('Critical error: userId not available for sign_up tracking');
        }

        await track('sign_up', {
            name: name,
            email: email,
            region: Cookies.get('region') || '',
            primary_offer_slug: webinarResponse.offer_slug,
            user_id: userId
        });

        try {
            setRedirecting(true);

            const response = await fetchJsonPost('/api/webinar/start-session', {
                webinar_id: webinarResponse.webinar_id,
                email: email,
                name: name,
                schedule_id: selectedSchedule.schedule_id,
                start_date: selectedSchedule.start_date
            });

            if (response.error) {
                setError(response.error);
                setSubmitting(false);
                setRedirecting(false);
                return;
            }

            if (!response.session_id) {
                setError('Nije uspjelo kreiranje sesije webinara. Molimo pokušajte ponovno ili nas kontaktirajte.');
                setSubmitting(false);
                setRedirecting(false);
                return;
            }

            router.push(`/webinar/thank-you/${response.session_id}`);

        } catch (error: any) {
            setError('Failed to register for webinar: ' + error.message);
            sendClientErrorEmail('Error starting webinar session', error);
            setSubmitting(false);
            setRedirecting(false);
        }
    };

    const handleScheduleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!selectedSchedule) {
            setError('Molimo odaberite vrijeme webinara');
            return;
        }

        setSubmitting(false);
        setFormStep(1);
    };

    const benefits = [
        "Prestanite sabotirati svoje veze i naučite kako stvoriti sigurnu povezanost s partnerom",
        "Oslobodite se anksioznosti i straha koji Vas sprječavaju u stvaranju intimnih veza",
        "Naučite postaviti zdrave granice bez osjećaja krivnje ili straha od napuštanja",
        "Razumijte kako vaš stil privrženosti utječe na vaše ponašanje u vezama",
        "Savladajte tehnike regulacije emocija i stresa u odnosima",
        "Razvijte vještine za stvaranje i održavanje duboke povezanosti"
    ];

    const handleSessionAction = () => {
        if (!webinarResponse?.active_session || isRedirecting)
            return;

        if (webinarResponse.active_session.status === 'active')
            performRedirect(`/webinar/live/${webinarResponse.active_session.id}`);
        else
            performRedirect(`/webinar/thank-you/${webinarResponse.active_session.id}`);
    };

    // Ensure session is initialized before rendering
    if (!isInitialized) {
        return (
            <div className="min-h-screen relative py-4 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mx-auto w-10 h-10 border-4 border-[#6B498F] border-t-transparent rounded-full mb-4"></div>
                    <p className="text-[#6B498F]">Priprema sesije...</p>
                </div>
            </div>
        );
    }

    // userId MUST be available after initialization
    if (!userId) {
        throw new Error('Critical error: Session initialized but userId is not available. This should never happen.');
    }

    return (
        <>
            <div className="bg-[#6B498F] text-white py-2 px-4 text-center font-medium">
                <div className="container max-w-7xl mx-auto flex items-center justify-center space-x-2">
                    <Clock className="h-7 w-7" />
                    <p className="text-xs md:text-base font-medium">
                        <span className="font-bold">Danas je {effectiveNow.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long' })}</span> – već do {new Date(new Date(effectiveNow).setDate(effectiveNow.getDate() + 17)).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long' })} mogli biste uspostaviti zdravije obrasce privrženosti u vašoj vezi
                    </p>
                </div>
            </div>

            <div className="min-h-screen relative py-4 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB]">
                <GradientBackground />

                <div className="container mx-auto px-2 relative z-10">

                    <section className="w-full md:py-8">
                        <div className="flex justify-center mb-8">
                            <motion.div className="flex items-center justify-center gap-1.5 sm:gap-2 sm:bg-[#6B498F]/20 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[#6B498F] w-full sm:w-auto mx-1 sm:mx-0">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-center">Pozvani ste na besplatni webinar koji počinje danas</span>
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
                            </motion.div>
                        </div>

                        <div className="container px-4 md:px-6 mx-auto">
                            <motion.div
                                className="flex flex-col items-center text-center space-y-4 mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold tracking-tight text-[#4b2c5e] max-w-4xl">
                                    Kako prevladati <span className="text-[#6B498F]">nesigurne obrasce privrženosti</span> i stvoriti zdravu, dugotrajnu vezu
                                </h1>
                                <p className="text-xl md:text-2xl text-[#6B498F] max-w-2xl">
                                    (Čak i ako ste već isprobali &quot;sve&quot;)
                                </p>
                            </motion.div>

                            <motion.div
                                className={`max-w-xl mx-auto`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                id="webinar-form"
                            >
                                <div className="bg-[#FFEAFF]/70 backdrop-blur-md rounded-2xl p-4 md:p-6 py-6 border border-[#D4B5A0]/50 shadow-xl">
                                    {isLoading ? (
                                        <div className="text-center py-6">
                                            <div className="animate-spin mx-auto w-10 h-10 border-4 border-[#6B498F] border-t-transparent rounded-full mb-4"></div>
                                            <p className="text-[#6B498F]">Učitavanje...</p>
                                        </div>
                                    ) : webinarResponse && webinarResponse.active_session ? (
                                        <motion.div
                                            key="active-session"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5 }}
                                            className="text-center py-6 space-y-4"
                                        >
                                            <div className={`mx-auto ${webinarResponse.active_session.status === 'active' ? 'bg-green-500/20' : 'bg-[#F1BBB0]/30'} rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4`}>
                                                <Check className={`h-8 w-8 ${webinarResponse.active_session.status === 'active' ? 'text-green-600' : 'text-[#6B498F]'}`} />
                                            </div>
                                            <h2 className="text-2xl font-bold text-[#4b2c5e]">Već ste registrirani!</h2>
                                            {webinarResponse.active_session.status === 'active' ? (
                                                <p className="text-[#6B498F] mb-6">
                                                    Webinar <span className="font-semibold text-[#4b2c5e]">{webinarResponse.title}</span> je trenutno u tijeku.
                                                    Možete se pridružiti odmah.
                                                </p>
                                            ) : (
                                                <div>
                                                    <p className="text-[#6B498F] mb-4">
                                                        Već ste registrirani za webinar <span className="font-semibold text-[#4b2c5e]">{webinarResponse.title}</span>.
                                                    </p>

                                                    {webinarResponse.active_session.start_date && (
                                                        <div className="bg-[#E1CCEB]/30 rounded-lg p-4 mb-6">
                                                            <p className="text-sm text-[#6B498F] mb-2">Vaš webinar počinje:</p>
                                                            <p className="font-medium text-[#4b2c5e] mb-3">
                                                                {new Date(webinarResponse.active_session.start_date).toLocaleDateString('hr-HR', {
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>

                                                            {timeLeft && (
                                                                <div className="flex justify-center items-start space-x-2 sm:space-x-3">
                                                                    {timeLeft.days > 0 && (
                                                                        <>
                                                                            <div className="text-center bg-[#6B498F]/20 p-2 rounded-md">
                                                                                <div className="text-xl font-bold text-[#4b2c5e]">{String(timeLeft.days).padStart(2, '0')}</div>
                                                                                <div className="text-xs text-[#6B498F] uppercase tracking-wider">Dana</div>
                                                                            </div>
                                                                            <div className="text-lg font-bold text-[#6B498F] self-center">:</div>
                                                                        </>
                                                                    )}
                                                                    <div className="text-center bg-[#6B498F]/20 p-2 rounded-md">
                                                                        <div className="text-xl font-bold text-[#4b2c5e]">{String(timeLeft.hours).padStart(2, '0')}</div>
                                                                        <div className="text-xs text-[#6B498F] uppercase tracking-wider">Sati</div>
                                                                    </div>
                                                                    <div className="text-lg font-bold text-[#6B498F] self-center">:</div>
                                                                    <div className="text-center bg-[#6B498F]/20 p-2 rounded-md">
                                                                        <div className="text-xl font-bold text-[#4b2c5e]">{String(timeLeft.minutes).padStart(2, '0')}</div>
                                                                        <div className="text-xs text-[#6B498F] uppercase tracking-wider">Min</div>
                                                                    </div>
                                                                    <div className="text-lg font-bold text-[#6B498F] self-center">:</div>
                                                                    <div className="text-center bg-[#6B498F]/20 p-2 rounded-md">
                                                                        <div className="text-xl font-bold text-[#4b2c5e]">{String(timeLeft.seconds).padStart(2, '0')}</div>
                                                                        <div className="text-xs text-[#6B498F] uppercase tracking-wider">Sek</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleSessionAction}
                                                disabled={isRedirecting}
                                                className={`w-full ${webinarResponse.active_session.status === 'active'
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-[#6B498F] hover:bg-[#4b2c5e]'} text-white px-6 py-3 rounded-lg font-semibold transition-colors group flex items-center justify-center disabled:opacity-80`}
                                            >
                                                {isRedirecting ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Preusmjeravanje...
                                                    </>
                                                ) : (
                                                    <>
                                                        {webinarResponse.active_session.status === 'active'
                                                            ? 'Pridružite se webinaru sada'
                                                            : 'Pregledajte detalje registracije'}
                                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    ) : webinarResponse?.schedules?.length === 0 ? (
                                        <motion.div
                                            key="no-webinars"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5 }}
                                            className="text-center py-6 space-y-4"
                                        >
                                            <div className="mx-auto bg-[#6B498F]/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                                                <Calendar className="h-8 w-8 text-[#6B498F]" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-[#4b2c5e]">Nema dostupnih webinara</h2>
                                            <p className="text-[#6B498F]">
                                                Trenutno nema zakazanih webinara. Molimo provjerite kasnije ili kontaktirajte podršku za više informacija.
                                            </p>
                                        </motion.div>
                                    ) : formStep === 0 ? (
                                        <motion.form
                                            key="time-form"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            onSubmit={handleScheduleSubmit}
                                            className="space-y-4"
                                        >
                                            <div className="text-center mb-6">
                                                <h2 className="text-xl font-semibold text-[#4b2c5e]">Odaberite vrijeme webinara</h2>
                                            </div>

                                            <div className="space-y-2">
                                                {(isLoading || (webinarResponse?.schedules?.length === 0)) && !error ? (
                                                    <p className="text-center text-[#6B498F] py-4">Učitavanje dostupnih termina...</p>
                                                ) : null}

                                                {!isLoading ? schedules?.map((schedule: WebinarClientSchedule, index: number) => {
                                                    const today = effectiveNow;
                                                    const tomorrow = new Date(today);
                                                    tomorrow.setDate(today.getDate() + 1);

                                                    const isToday = schedule.start_date.getDate() === today.getDate() &&
                                                        schedule.start_date.getMonth() === today.getMonth() &&
                                                        schedule.start_date.getFullYear() === today.getFullYear();

                                                    const isTomorrow = schedule.start_date.getDate() === tomorrow.getDate() &&
                                                        schedule.start_date.getMonth() === tomorrow.getMonth() &&
                                                        schedule.start_date.getFullYear() === tomorrow.getFullYear();

                                                    const [hours, minutes] = schedule.start_date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }).split(':');
                                                    const h = parseInt(hours);
                                                    const m = parseInt(minutes);

                                                    let timeRemaining = null;
                                                    let diffMins = 0;
                                                    let isLessThan15Min = false;

                                                    if (isToday) {
                                                        const sessionTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
                                                        const diffMs = sessionTime.getTime() - today.getTime();

                                                        if (diffMs > 0) {
                                                            diffMins = Math.floor(diffMs / 60000);
                                                            isLessThan15Min = diffMins < 15;

                                                            if (isLessThan15Min) {
                                                                const hrs = Math.floor(diffMins / 60);
                                                                const mins = diffMins % 60;
                                                                const secs = Math.floor((diffMs % 60000) / 1000);

                                                                if (hrs > 0) {
                                                                    timeRemaining = `(${hrs} h ${mins} min)`;
                                                                } else {
                                                                    timeRemaining = `(${mins} min ${secs} s)`;
                                                                }
                                                            }
                                                        }
                                                    }

                                                    let dateDisplay;

                                                    if (isToday)
                                                        dateDisplay = `Danas u ${h}:${m < 10 ? '0' + m : m}`;
                                                    else if (isTomorrow)
                                                        dateDisplay = `Sutra u ${h}:${m < 10 ? '0' + m : m}`;
                                                    else
                                                        dateDisplay = `${schedule.start_date.getDate()}.${schedule.start_date.getMonth() + 1}.${schedule.start_date.getFullYear()}. u ${h}:${m < 10 ? '0' + m : m}`;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`
                                                                flex items-center border rounded-lg p-4 cursor-pointer transition-all relative overflow-hidden
                                                                ${selectedSchedule?.schedule_id === schedule.schedule_id ? "border-[#6B498F] bg-[#6B498F]/20" : "border-[#6B498F]/40 hover:border-[#6B498F]/70"}
                                                            `}
                                                            onClick={() => setSelectedSchedule(schedule)}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="time"
                                                                value={schedule.schedule_id}
                                                                id={schedule.schedule_id}
                                                                checked={selectedSchedule?.schedule_id === schedule.schedule_id}
                                                                onChange={() => setSelectedSchedule(schedule)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 ${selectedSchedule?.schedule_id === schedule.schedule_id ? "border-2 border-[#6B498F] bg-[#6B498F]" : "border border-[#6B498F]/40"}`} />
                                                            <div className="flex-1">
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                                    <div className="flex items-center">
                                                                        <span className="text-base font-medium text-[#4b2c5e]">
                                                                            {dateDisplay}
                                                                        </span>
                                                                        {timeRemaining && (
                                                                            <span className="ml-2 text-sm font-medium text-[#F1BBB0]">
                                                                                {timeRemaining}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {isLessThan15Min && (
                                                                        <span className="text-xs bg-[#F1BBB0]/20 text-[#6B498F] px-2 py-0.5 rounded mt-1 sm:mt-0 inline-flex items-center">
                                                                            <Clock className="h-3 w-3 mr-1" />
                                                                            Uskoro
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isLessThan15Min && (
                                                                <div className="absolute top-0 right-0 w-16 h-16 -mt-6 -mr-6 transform rotate-45 bg-[#F1BBB0]/10" />
                                                            )}
                                                        </div>
                                                    );
                                                }) : null}
                                            </div>

                                            {error && (
                                                <div className="bg-[#F1BBB0]/30 border border-[#6B498F]/30 rounded-lg p-3">
                                                    <p className="text-[#4b2c5e] text-sm font-medium">{error}</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col space-y-3">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="flex-1 bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors group flex items-center justify-center disabled:opacity-70 disabled:hover:bg-purple-600"
                                                >
                                                    {isRedirecting ? (
                                                        <>Preusmjeravanje...</>
                                                    ) : isSubmitting ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Obrađujem...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Rezerviraj svoje mjesto
                                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-xs text-center text-[#6B498F] mt-2">
                                                    <Shield className="inline-block h-3 w-3 mr-1 text-[#6B498F] align-[-1px]" />
                                                    Vaši podaci su sigurni i nikada ih nećemo dijeliti s trećim stranama.
                                                </p>
                                            </div>
                                        </motion.form>
                                    ) : formStep === 1 ? (
                                        <motion.form
                                            key="email-form"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            onSubmit={handleEmailSubmit}
                                            className="space-y-4"
                                        >
                                            <div className="text-center mb-6">
                                                <p className="text-[#6B498F] mt-1">Rezervirajte svoje mjesto na besplatnom webinaru</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="email" className="block text-sm font-medium text-[#4b2c5e] mb-2">
                                                    Vaš email
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B498F]" />
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        placeholder="ime@gmail.com"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 bg-white/60 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] placeholder-[#6B498F]/50 focus:ring-[#6B498F]/50 focus:border-[#6B498F]/50 focus:bg-white/80"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="bg-[#F1BBB0]/30 border border-[#6B498F]/30 rounded-lg p-3">
                                                    <p className="text-[#4b2c5e] text-sm font-medium">{error}</p>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors group flex items-center justify-center disabled:opacity-70 disabled:hover:bg-purple-600"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Obrađujem…
                                                    </>
                                                ) : (
                                                    <>
                                                        Nastavite
                                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-xs text-center text-[#6B498F] mt-4">
                                                <Shield className="inline-block h-3 w-3 mr-1 text-[#6B498F] align-[-1px]" />
                                                Vaši podaci su sigurni i nikada ih nećemo dijeliti s trećim stranama.
                                            </p>
                                        </motion.form>
                                    ) : formStep === 2 ? (
                                        <motion.form
                                            key="name-form"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            onSubmit={handleNameSubmit}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="block text-sm font-medium text-[#4b2c5e] mb-2">
                                                    <User className="inline-block h-4 w-4 mr-1 text-[#6B498F] align-[-1px]" />
                                                    Vaše ime
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="name"
                                                        placeholder="Ime Prezime"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full pl-4 pr-4 py-2 bg-white/60 border border-[#6B498F]/30 rounded-lg text-[#4b2c5e] placeholder-[#6B498F]/50 focus:ring-[#6B498F]/50 focus:border-[#6B498F]/50 focus:bg-white/80"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="bg-[#F1BBB0]/30 border border-[#6B498F]/30 rounded-lg p-3">
                                                    <p className="text-[#4b2c5e] text-sm font-medium">{error}</p>
                                                </div>
                                            )}

                                            <div className="flex space-x-3">
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || isRedirecting}
                                                    className="flex-1 bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors group flex items-center justify-center disabled:opacity-70 disabled:hover:bg-purple-600"
                                                >
                                                    {isSubmitting || isRedirecting ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            {isRedirecting ? "Preusmjeravanje..." : "Obrađujem…"}
                                                        </>
                                                    ) : (
                                                        <>
                                                            Nastavite
                                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <p className="text-xs text-center text-[#6B498F] mt-4">
                                                <Shield className="inline-block h-3 w-3 mr-1 text-[#6B498F] align-[-1px]" />
                                                Vaši podaci su sigurni i nikada ih nećemo dijeliti s trećim stranama.
                                            </p>
                                        </motion.form>
                                    ) : null}
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {timeLeft && webinarResponse && webinarResponse?.schedules?.length > 0 && !webinarResponse?.active_session && (
                        <section className="w-full py-2 mb-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="container px-1 md:px-6 mx-auto text-center"
                            >
                                <h2 className="text-xl md:text-2xl font-medium text-[#6B498F] mb-4 md:mb-6">
                                    Sljedeći webinar počinje za:
                                </h2>
                                <div className="flex justify-center items-start space-x-2 sm:space-x-4 md:space-x-8">
                                    {timeLeft.days > 0 && (
                                        <>
                                            <div className="text-center">
                                                <div className="text-4xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-[#4b2c5e] bg-[#6B498F]/10 px-1 sm:px-3 py-2 rounded-lg w-[55px] sm:w-[70px] md:w-[100px] lg:w-[120px] flex justify-center items-center h-[70px] sm:h-[70px] md:h-[90px]">
                                                    {String(timeLeft.days).padStart(2, '0')}
                                                </div>
                                                <div className="text-xs md:text-sm text-[#6B498F] uppercase tracking-wider mt-1 md:mt-2">Dana</div>
                                            </div>
                                            <div className="text-3xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-[#6B498F] self-center w-4 sm:w-4 flex justify-center">:</div>
                                        </>
                                    )}
                                    <div className="text-center">
                                        <div className="text-4xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-[#4b2c5e] bg-[#6B498F]/10 px-1 sm:px-3 py-2 rounded-lg w-[55px] sm:w-[70px] md:w-[100px] lg:w-[120px] flex justify-center items-center h-[70px] sm:h-[70px] md:h-[90px]">
                                            {String(timeLeft.hours).padStart(2, '0')}
                                        </div>
                                        <div className="text-xs md:text-sm text-[#6B498F] uppercase tracking-wider mt-1 md:mt-2">Sati</div>
                                    </div>
                                    <div className="text-3xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-[#6B498F] self-center w-4 sm:w-4 flex justify-center">:</div>
                                    <div className="text-center">
                                        <div className="text-4xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-[#4b2c5e] bg-[#6B498F]/10 px-1 sm:px-3 py-2 rounded-lg w-[55px] sm:w-[70px] md:w-[100px] lg:w-[120px] flex justify-center items-center h-[70px] sm:h-[70px] md:h-[90px]">
                                            {String(timeLeft.minutes).padStart(2, '0')}
                                        </div>
                                        <div className="text-xs md:text-sm text-[#6B498F] uppercase tracking-wider mt-1 md:mt-2">Minute</div>
                                    </div>
                                    <div className="text-3xl sm:text-3xl md:text-5xl lg:text-7xl font-bold text-[#6B498F] self-center w-4 sm:w-4 flex justify-center">:</div>
                                    <div className="text-center">
                                        <div className="text-4xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-[#4b2c5e] bg-[#6B498F]/10 px-1 sm:px-3 py-2 rounded-lg w-[55px] sm:w-[70px] md:w-[100px] lg:w-[120px] flex justify-center items-center h-[70px] sm:h-[70px] md:h-[90px]">
                                            {String(timeLeft.seconds).padStart(2, '0')}
                                        </div>
                                        <div className="text-xs md:text-sm text-[#6B498F] uppercase tracking-wider mt-1 md:mt-2">Sekunde</div>
                                    </div>
                                </div>
                            </motion.div>
                        </section>
                    )}

                    {timeLeft && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && webinarResponse && schedules?.length > 0 && !webinarResponse?.active_session && (
                        <section className="w-full py-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="container px-4 md:px-6 mx-auto text-center"
                            >
                                <div className="bg-[#E1CCEB]/30 border border-[#6B498F]/30 rounded-xl p-6 max-w-2xl mx-auto">
                                    <div className="text-[#6B498F] mb-2">
                                        <Clock className="h-12 w-12 mx-auto mb-4" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-[#4b2c5e] mb-3">
                                        Webinar je započeo!
                                    </h2>
                                    <p className="text-[#6B498F] mb-6">
                                        Dobra vijest je da još uvijek možete prisustvovati. Prijavite se i pridružite se webinaru u tijeku.
                                    </p>
                                    <button
                                        onClick={scrollToForm}
                                        className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        Prijavite se sada
                                    </button>
                                </div>
                            </motion.div>
                        </section>
                    )}

                    <section className="w-full py-16 pb-20">
                        <div className="container px-4 md:px-6 mx-auto">
                            <div className="grid md:grid-cols-2 gap-15 items-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                    className="relative"
                                >
                                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#6B498F]/10 rounded-full -z-10" />
                                    <Image
                                        src="https://images.pexels.com/photos/4049992/pexels-photo-4049992.jpeg"
                                        alt="Kristina Mitrovic"
                                        width={800}
                                        height={600}
                                        priority
                                        className="rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                                    />
                                    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#6B498F]/5 rounded-full -z-10" />
                                </motion.div>

                                <div className="space-y-6">
                                    <h2 className="text-2xl md:text-3xl font-bold text-[#4b2c5e] tracking-tight">
                                        Revolucionarni pristup razumijevanju privrženosti
                                    </h2>

                                    <ul className="space-y-3">
                                        {benefits.map((benefit, index) => (
                                            <li key={index} className="flex items-start">
                                                <div className="mr-3 mt-1 bg-[#6B498F]/20 rounded-full p-1 flex-shrink-0">
                                                    <Check className="h-4 w-4 text-[#6B498F]" />
                                                </div>
                                                <span className="text-[#6B498F]">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="text-center py-10">
                                        <button
                                            onClick={scrollToForm}
                                            className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg text-lg font-semibold transform transition-all shadow-lg"
                                        >
                                            Rezervirajte svoje mjesto sada
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div >
            </div >

            <FooterSection
                showLinks={false}
            />
        </>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen relative py-4 overflow-hidden bg-gradient-to-br from-[#FFF9E9] to-[#E1CCEB] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mx-auto w-10 h-10 border-4 border-[#6B498F] border-t-transparent rounded-full mb-4"></div>
                    <p className="text-[#6B498F]">Učitavanje...</p>
                </div>
            </div>
        }>
            <WebinarContent />
        </Suspense>
    );
}
