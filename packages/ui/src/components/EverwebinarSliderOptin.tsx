'use client';

import { Fragment, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Mail, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { fetchJsonPost } from '@repo/ui/lib/utils';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatWebinarDate = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
    const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(date);
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);

    return (
        <>
            <span className="font-semibold">{weekday}</span>, {day} {month} {time} <span className="text-gray-400 ml-1.5">{timezone}</span>
        </>
    );
};

interface EverWebinarSchedule {
    date: string;
    schedule: number;
    comment: string;
}

interface EverWebinarDetails {
    webinar_id: number;
    name: string;
    title: string;
    description: string;
    schedules: EverWebinarSchedule[];
    timezone: string;
}

interface EverwebinarSliderOptinProps {
    webinarId: number;
}

export function EverwebinarSliderOptin({ webinarId }: EverwebinarSliderOptinProps) {
    const router = useRouter();

    const [formStep, setFormStep] = useState(0);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState<EverWebinarSchedule | null>(null);

    const [error, setError] = useState('');

    const [webinarDetails, setWebinarDetails] = useState<EverWebinarDetails | null>(null);
    const [nextSessionTime, setNextSessionTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [isWorkshopStarted, setWorkshopStarted] = useState(false);

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

    useEffect(() => {
        const fetchWebinarDetails = async () => {
            if (!webinarId)
                return;

            setLoading(true);
            setError('');
            setWebinarDetails(null);

            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                const response = await fetchJsonPost('/api/everwebinar/get-details', {
                    webinar_id: webinarId,
                    timezone: timezone
                });

                setWebinarDetails(response);

                if (response && response.schedules && response.schedules.length > 0) {
                    const now = new Date();
                    const upcomingSession = response.schedules
                        .map((s: EverWebinarSchedule) => new Date(s.date))
                        .sort((a: Date, b: Date) => a.getTime() - b.getTime())
                        .find((d: Date) => d > now);

                    if (upcomingSession) {
                        setNextSessionTime(upcomingSession);
                    }
                }
            } catch (error: any) {
                setError(error.message || 'Error fetching webinar details.');
                setWebinarDetails(null);
            } finally {
                setLoading(false);
            }
        };
        fetchWebinarDetails();
    }, [webinarId]);

    useEffect(() => {
        if (!nextSessionTime) {
            setTimeLeft(null);
            return;
        }

        const intervalId = setInterval(() => {
            const now = new Date();
            const difference = nextSessionTime.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeLeft({
                    hours: days * 24 + hours,
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
            } else {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                setWorkshopStarted(true);
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [nextSessionTime]);


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


    const handleEmailSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);

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

        Cookies.set('lead_email', trimmedEmail);

        setEmail(trimmedEmail);
        setError('');
        setSubmitting(false);
        setFormStep(2);
    };

    const handleNameSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

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

        const nameParts = trimmedName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        Cookies.set('lead_name', trimmedName);
        setName(trimmedName);

        try {
            setRedirecting(true);

            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const response = await fetchJsonPost('/api/everwebinar/register', {
                webinar_id: webinarId,
                email: email,
                first_name: firstName,
                last_name: lastName,
                schedule: selectedSchedule.schedule,
                timezone: timezone
            });

            if (response.error) {
                setError(response.error);
                setSubmitting(false);
                setRedirecting(false);
                return;
            }

            if (response.status === 'success' && response.user?.thank_you_url) {
                router.push(response.user.thank_you_url);
            } else {
                setError('Nije uspjelo kreiranje sesije webinara. Molimo pokušajte ponovno ili nas kontaktirajte.');
                setSubmitting(false);
                setRedirecting(false);
            }

        } catch (error: any) {
            setError('Failed to register for webinar: ' + error.message);
            setSubmitting(false);
            setRedirecting(false);
        }
    };


    return (
        <Fragment>
            <div className="w-full mx-auto">
                {isLoading ? (
                    <div className="text-center py-6">
                        <div className="animate-spin mx-auto w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-gray-300">Loading available times...</p>
                    </div>
                ) : !webinarDetails || webinarDetails.schedules.length === 0 ? (
                    <motion.div
                        key="no-webinars"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-6 space-y-4"
                    >
                        <div className="mx-auto bg-indigo-500/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                            <Calendar className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">No webinars available</h2>
                        <p className="text-gray-400">
                            There are currently no scheduled webinars. Please check back later or contact support for more information.
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
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {webinarDetails.schedules.map((schedule, index) => {
                                return (
                                    <div
                                        key={index}
                                        className={`
                                        flex items-center border rounded-lg p-4 cursor-pointer transition-all relative overflow-hidden
                                        ${selectedSchedule?.schedule === schedule.schedule ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" : "border-gray-700 hover:border-indigo-600 hover:bg-gray-800/50"}
                                    `}
                                        onClick={() => setSelectedSchedule(schedule)}
                                    >
                                        <input
                                            type="radio"
                                            name="time"
                                            value={schedule.schedule}
                                            id={String(schedule.schedule)}
                                            checked={selectedSchedule?.schedule === schedule.schedule}
                                            onChange={() => setSelectedSchedule(schedule)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border mr-3 flex-shrink-0 ${selectedSchedule?.schedule === schedule.schedule ? "border-2 border-indigo-500 bg-indigo-500" : "border border-gray-600"}`} />
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-base font-medium text-white">
                                                        {formatWebinarDate(schedule.date, webinarDetails.timezone)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                                <p className="text-white text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="flex flex-col space-y-3">
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedSchedule}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all group flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                                {isRedirecting ? (
                                    <>Redirecting...</>
                                ) : isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Reserve My Spot
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
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

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                Your Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                                <p className="text-white text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all group flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            <Shield className="inline-block h-3 w-3 mr-1 text-gray-500 align-[-1px]" />
                            Your information is safe and will never be shared.
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
                            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                                <User className="inline-block h-4 w-4 mr-1 text-gray-400 align-[-1px]" />
                                Your Name
                            </label>
                            <div className="relative">
                                <input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-4 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                                <p className="text-white text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={isSubmitting || isRedirecting}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all group flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg"
                            >
                                {isSubmitting || isRedirecting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isRedirecting ? "Redirecting..." : "Processing..."}
                                    </>
                                ) : (
                                    <>
                                        Complete Registration
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            <Shield className="inline-block h-3 w-3 mr-1 text-gray-500 align-[-1px]" />
                            Your information is safe and will never be shared.
                        </p>
                    </motion.form>
                ) : null}
            </div>

            {timeLeft && (
                <div className="text-center mt-6">
                    {isWorkshopStarted ? (
                        <p className="text-amber-400 text-lg font-medium">
                            The workshop has already started, finish your registration to get in
                        </p>
                    ) : (
                        <>
                            <p className="text-gray-400 text-lg mb-4 font-medium">Next Workshop Opens In</p>
                            <div className="flex justify-center items-center space-x-2 md:space-x-4">
                                <div className="bg-gray-800/30 rounded-lg p-2 md:p-4 text-center">
                                    <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">{String(timeLeft.hours)}</div>
                                    <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">Hours</div>
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-gray-600 animate-pulse">:</div>
                                <div className="bg-gray-800/30 rounded-lg p-2 md:p-4 text-center">
                                    <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</div>
                                    <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">Minutes</div>
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-gray-600 animate-pulse">:</div>
                                <div className="bg-gray-800/30 rounded-lg p-2 md:p-4 text-center">
                                    <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</div>
                                    <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">Seconds</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Fragment>
    );
} 