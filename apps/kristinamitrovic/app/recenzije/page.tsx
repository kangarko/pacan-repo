'use client';

import React, { useState } from 'react';
import Navigation from '@repo/ui/components/Navigation';
import FooterSection from '@repo/ui/components/FooterSection';
import { Quote, Star, Heart, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import CtaToSalesPageSection from '@/components/CtaSection';

interface Review {
    name: string;
    location?: string;
    role?: string;
    content: string;
    highlight?: string;
    rating?: number;
}

// Helper function to format names with first initial of last name
const formatName = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
};

// Helper function to split long paragraphs
const splitParagraphs = (text: string): string[] => {
    // Split by sentences (roughly)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const paragraphs: string[] = [];
    let currentParagraph = '';
    
    sentences.forEach((sentence) => {
        if (currentParagraph.length + sentence.length > 300) {
            if (currentParagraph) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = sentence;
            }
        } else {
            currentParagraph += sentence;
        }
    });
    
    if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
    }
    
    return paragraphs.length > 0 ? paragraphs : [text];
};

const reviews: Review[] = [
    {
        name: "Aleksandra",
        content: "Doživela sam wauu momenat već sa prvih 20 stranica koje sam stigla da pročitam. Sama prolazim kroz anksioznost, pogotovo posle porođaja i promene sredine u kojoj sada živim, a imam i malu dvojčicu od 3 godine i sada sam više svesnija gde sam grešila i u našem odnosu za ove 3 godine. I baš sam tužna kada pomislim koliko sam joj stvorila na neki način nesigurnu sredinu u prvih par godina jer i sama nisam bila dobro. Baš sam radosna što sam krenula sa čitanjem vaše knjige. Mnogo uvida imam i verujem da ću do kraja čitanja biti zapanjena sa uvidima. Raduje me čitanje dalje... javljam još utisaka a nadam se da ću imati mogućnost i da Vam postavim neka pitanja kada predjem sve sa čitanjem.",
        highlight: "Wauu momenat već sa prvih 20 stranica",
        rating: 5
    },
    {
        name: "Anđela V.",
        content: "Skoro sam pri kraju sa čitanjem knjige. Ostalo mi je još šesto poglavlje da pročitam. Knjiga je odlična. Otkrila sam da imam anksioznu privrženost. Čak sam napisala i granice za sve osobe iz mog okruženja. Počela sam i da ih primjenjujem. Osjećam se nekako opuštenije od kad ih primjenjujem. Nisam više u grču šta će neko reći zbog mojih granica. Ranije me je bilo strah da ih postavim.",
        highlight: "Osjećam se nekako opuštenije od kad primjenjujem granice",
        rating: 5
    },
    {
        name: "Miljenka H.",
        location: "Zagreb",
        role: "73 godine",
        content: "Vaša knjiga mi je jako pomogla. Do nje nisam nikad razmatrala problem PRIVRŽENOSTI, a on je moj problem cijeli život. Najednom sam shvatila što me muči, a i zašto. Prekrasno ste razradili temu, objasnila i sad po tome treba raditi. Pročitala sam 2/3 knjige, rješila test i sama sebi priznala da funkcioniram s anksioznom i distanciranom privrženosti. Od unuka dobivam pravu privrženost i on me uči i upućuje kako to može izgledati. Vaša knjiga mi je sve to pojasnila. Sa suprugom često imam nesporazume jer mislim da od njega ne dobivam dovoljno potvrde da vrijedim i onda gradim između nas zidove. Sad sam sve to opisala kako bi vam rekla koliko mi je trebao sadržaj kojim se vi bavite. E, sad planiram još pročitati knjigu do kraja, a onda opet iz početka sa bilježnicom u kojoj ću se baviti svakom vašom crticom i opisivati što mi se događa. Jako mi je stalo da popravim svoju privrženost. Povjerovala sam vašim tekstovima i tezama.",
        highlight: "Najednom sam shvatila što me muči, a i zašto",
        rating: 5
    },
    {
        name: "Višnja",
        content: "Jako mi se svidjela knjiga jer ide u bit i jer mislim da je jako korisna za svakog od nas. Za mene je bio najkorisniji dio o granicama. Prepoznala sam svoje pogrešne obrasce ponašanja i već počela s malim vježbama u stvarnosti. Ne mogu reći da me nešto posebno uzrujalo jer sam ja već odavno velika cura. 😉 Najljepši dio mi je bio o tome kako postupiti nakon konflikta jer sam to već bila primjenila pa sam se osjećala ponosno. A posebno me se dojmio dio o zdravoj intimnosti jer mi se srce rastopilo od ljepote. Dio o traumama jako koristan za mene jer sam prošla kroz neke teške situacije koje su pošteno uzdrmale tlo pod mojim nogama. Naravno da sam potražila stručnu pomoć. Eto ukratko. Još nešto, slobodno povećajte cijenu knjige jer mislim da je mala obzirom na dobrobit koju pruža.",
        highlight: "Srce mi se rastopilo od ljepote",
        rating: 5
    },
    {
        name: "Maja",
        content: "Knjiga Stilovi privrzenosti mi se jako dopala, izuzetno je korisna i jasno napisana. Na Facebook-u sam sasvim slucajno naisla na reklamu za knjigu, gdje me je privukao tekst u opisu jer sam se prepoznala u njemu, i to me potaknulo da je narucim. U posljednje vrijeme intenzivno radim na sebi, a ova knjiga mi je dosla kao odlican alat u tom mom procesu. Posebno su mi znacili testovi o privrzenosti (kod mene je neki mix, izmedju anksiozne i umjrene privrzenosti, vjerotano varira od situacije), koji su mi pomogli da bolje razumijem sebe i svoje obrasce u odnosima. Takodjer su mi posebno koristili i odjeljci sa prakticnom primjenom u svakodnevnom zivotu (afirmacije, disanje..). Zaista pruzaju konkretne smjernice koje mogu odmah da se primjene. Vjerujem da bi svako mogao imati koristi od ove knjige, bez obzira na zivotnu fazu u kojoj se nalazi. Zaista sam zadovoljna i rado je preporucujem svima koji zele da rade na sebi i svojim odnosima.",
        highlight: "Konkretne smjernice koje mogu odmah da se primjene",
        rating: 5
    },
    {
        name: "Dr. Azra A.",
        role: "Liječnica i psihoterapeut",
        location: "Bosna i Hercegovina",
        content: "Razumijem sve o čemu pričate i pišete, jer sam liječnica i psihoterapeut. Vaša knjiga mi se učinila interesantnom za naručiti i koristiti u radu sa klijentima.",
        highlight: "Interesantna za koristiti u radu sa klijentima",
        rating: 5
    },
    {
        name: "Željko P.",
        content: "Iako je još uvek nisam završio sa čitanjem ne zurim i studiozno je čitam. Mislim da je fenomenalno iskustveno i istinito napisana jer se u dosta situacija pronalazim...",
        highlight: "Fenomenalno iskustveno i istinito napisana",
        rating: 5
    },
    {
        name: "Andrea",
        content: "Prije svega Vam se zahvaljujem na javljanju, lijepo od Vas što se interesujete šta čitaoci misle. Prešla sam je već jednom ali definitvno ću je čitati redovno i često, laka je i više je kao priručnik, želim da zapamtim i primejenjujem redovno ritaule. Trenutno nemam vremena za vježbe ali naću ću sigurno. Iskrena da budem, mnogo se bavim sa sobom već godinama od porodičnih konstelacija do rada sa terapeutima, dosta sam i knjiga pročitala i čitam stalno. Ovaj način na koji ste objasnili stilove privrženosti je veoma lagan i lako prihvatljiv, ja sam u dilemi između prvog i četvrtog, mada nisam stigla test uraditi još. Sviđa mi se što je sve na jednom mjestu, obuhvatili ste neke stvari na koje sam ja nailazila u različitim knjigama. Može se primjeniti na dnevnom nivou, da postane rutina, jer je kratko i jasno. Mene malo smara činjenica da svako kaže izdvojite 15 minuta za ovo, za ono, to u startu odbija, jer je vrijeme takvo da smo puni obaveza. Ovo mi je nekako u hodu kratko i jasno.",
        highlight: "Može se primjeniti na dnevnom nivou",
        rating: 5
    },
    {
        name: "Biljana Ž.",
        content: "Mnogo mi se dopala knjiga. Pročitala sam je brzo iz dva tri navrata, nijesam mogla prestati, kao da sam gutala... U mnogim stvarima sam se pronašla. Tehnike disanja, opuštanja mi se sviđaju. Onaj dodatak što nudite uz ovu knjigu, vidjet ću da poručim. Divna ste, originalna.",
        highlight: "Nijesam mogla prestati, kao da sam gutala",
        rating: 5
    },
    {
        name: "Azra",
        content: "Uspijela sam vec jedan dio da procitam, jako je korisno, detaljnije bih vam opisala kad sve procitam. U medjuvremenu počela sam primjenjivati savjete iz knjige u svojim odnosima. Pokazalo se na mnogim djelovima da drugacije reagujem. Čak su mi i bliski ljudi rekli da puno bolje reagujem na neke situacije. Iznenadili su se. To je zahvaljujuci vasoj knjizi i primjeni knjige. Vase su mi neke rijeci iz knjige odzvanjale u usima. Takodjer su se i stari obrasci pojavili gdje sam odreagovala kao uvjek i sa tim mi upravo nije uopste dobro. Napravila sam dva koraka naprijed a tri nazad. Ne mogu da opisem. Tako mi tesko pada neke obrasce odbaciti. Imala sam odlicnu priliku da vidim da li sam razumjela sebe kroz vasu knjigu. Medjutim neke stvari su bolje, ali neke su jako teske za odbaciti.",
        highlight: "Puno bolje reagujem na situacije",
        rating: 5
    },
    {
        name: "Gabrijela",
        content: "Hvala vam na knjizi, upravo je došla do mene kada mi je najviše trebala. Čitam ju polako i zapisujem sve.",
        highlight: "Došla kada mi je najviše trebala",
        rating: 5
    },
    {
        name: "Mika",
        role: "Specijalizacija iz medicine",
        content: "Počela sam čitati i onda sam stala jer sam imala jedan ispit koji sam položila iz medicine specijalizacija je u pitanju... vrlo zanimljiva, sažeta i lepo objašnjena. Utkana u nadu. Za sad takav dojam je ostavila na meni.",
        highlight: "Utkana u nadu",
        rating: 5
    },
    {
        name: "Sladjana",
        content: "Procitala sam sadrzaj i mislim da ce mi biti i korisno i zanimljivo. Naci cu vremena jer jedva cekam da citam jer to moja tema. Pisem utiske!!!",
        highlight: "Jedva čekam da čitam jer je to moja tema",
        rating: 5
    }
];

// Featured Review Card Component (Large)
const FeaturedReviewCard = ({ review }: { review: Review }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const paragraphs = splitParagraphs(review.content);
    const preview = paragraphs[0].slice(0, 300) + (paragraphs[0].length > 300 || paragraphs.length > 1 ? '...' : '');
    const shouldShowButton = review.content.length > 300;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="col-span-full bg-gradient-to-br from-[#E1CCEB]/30 via-[#FFEAFF]/50 to-[#E1CCEB]/20 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 border border-[#D4B5A0]/30 hover:border-[#D4B5A0]/50 transition-all duration-300 relative overflow-hidden group shadow-2xl"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-[#6B498F]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 sm:-bottom-24 md:-bottom-32 -left-16 sm:-left-24 md:-left-32 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-[#F1BBB0]/10 rounded-full blur-3xl" />
            
            {/* Featured badge */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 bg-[#6B498F]/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                <span className="text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    <span className="hidden sm:inline">Istaknuta recenzija</span>
                    <span className="sm:hidden">Istaknuta</span>
                </span>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                    {/* Left side - Author info */}
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <div className="flex items-center gap-4 md:flex-col md:items-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#6B498F] to-[#4b2c5e] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-xl sm:text-2xl md:text-3xl">
                                    {formatName(review.name).charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 md:flex-none md:mt-4 md:text-center">
                                <h4 className="font-bold text-[#4b2c5e] text-base sm:text-lg">{formatName(review.name)}</h4>
                                {review.role && <p className="text-[#6B498F] text-xs sm:text-sm">{review.role}</p>}
                                {review.location && <p className="text-gray-500 text-xs sm:text-sm">{review.location}</p>}
                                {/* Rating on mobile */}
                                {review.rating && (
                                    <div className="flex gap-0.5 mt-2 md:hidden">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Rating on desktop */}
                        {review.rating && (
                            <div className="hidden md:flex gap-1 mt-3 justify-center">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Right side - Review content */}
                    <div className="flex-1">
                        {/* Large quote icon */}
                        <Quote className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-[#6B498F]/20 mb-3 md:mb-4" />
                        
                        {/* Highlight */}
                        {review.highlight && (
                            <div className="mb-4 md:mb-6">
                                <div className="inline-flex items-center gap-2 sm:gap-3 bg-[#6B498F]/20 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#6B498F]" />
                                    <span className="text-[#4b2c5e] font-semibold text-sm sm:text-base md:text-lg">
                                        &ldquo;{review.highlight}&rdquo;
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* Review text */}
                        {isExpanded ? (
                            <div className="text-[#4b2c5e]/80 mb-4 md:mb-6 leading-relaxed space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg">
                                {paragraphs.map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#4b2c5e]/80 mb-4 md:mb-6 leading-relaxed text-sm sm:text-base md:text-lg">
                                {preview}
                            </p>
                        )}
                        
                        {/* Show more/less button */}
                        {shouldShowButton && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-2 text-[#6B498F] hover:text-[#4b2c5e] transition-colors text-sm sm:text-base font-medium"
                            >
                                {isExpanded ? (
                                    <>
                                        Prikaži manje <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </>
                                ) : (
                                    <>
                                        Prikaži više <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Regular Review Card Component
const ReviewCard = ({ review, index, variant = 'default' }: { review: Review; index: number; variant?: 'default' | 'compact' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const paragraphs = splitParagraphs(review.content);
    const previewLength = variant === 'compact' ? 120 : 150;
    const preview = paragraphs[0].slice(0, previewLength) + (paragraphs[0].length > previewLength || paragraphs.length > 1 ? '...' : '');
    const shouldShowButton = review.content.length > previewLength;
    
    const cardClasses = variant === 'compact' 
        ? "bg-[#FFEAFF]/40 backdrop-blur-sm rounded-xl p-6 border border-[#E1CCEB]/50 hover:border-[#D4B5A0]/50"
        : "bg-[#FFEAFF]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#E1CCEB]/50 hover:border-[#D4B5A0]/50";
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`${cardClasses} transition-all duration-300 relative overflow-hidden group h-full flex flex-col`}
        >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#F1BBB0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Quote icon */}
            <Quote className={`absolute -top-2 -left-2 ${variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'} text-[#6B498F]/10`} />
            
            {/* Rating */}
            {review.rating && (
                <div className="flex gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className={`${variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-400 fill-current`} />
                    ))}
                </div>
            )}
            
            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                {/* Highlight */}
                {review.highlight && (
                    <div className="mb-3">
                        <div className={`inline-flex items-center gap-2 bg-[#6B498F]/20 ${variant === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2'} rounded-full`}>
                            <Sparkles className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} text-[#6B498F]`} />
                            <span className={`text-[#4b2c5e] font-medium ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
                                &ldquo;{review.highlight}&rdquo;
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Review text */}
                <div className="flex-1">
                    {isExpanded ? (
                        <div className={`text-[#4b2c5e]/80 mb-4 leading-relaxed space-y-3 ${variant === 'compact' ? 'text-sm' : ''}`}>
                            {paragraphs.map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))}
                        </div>
                    ) : (
                        <p className={`text-[#4b2c5e]/80 mb-4 leading-relaxed ${variant === 'compact' ? 'text-sm' : ''}`}>
                            {preview}
                        </p>
                    )}
                    
                    {/* Show more/less button */}
                    {shouldShowButton && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex items-center gap-2 text-[#6B498F] hover:text-[#4b2c5e] transition-colors font-medium ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}
                        >
                            {isExpanded ? (
                                <>
                                    Prikaži manje <ChevronUp className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                </>
                            ) : (
                                <>
                                    Prikaži više <ChevronDown className={`${variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                </>
                            )}
                        </button>
                    )}
                </div>
                
                {/* Author info */}
                <div className={`border-t border-[#D4B5A0]/30 ${variant === 'compact' ? 'pt-3' : 'pt-4'} mt-auto`}>
                    <div className="flex items-center gap-3">
                        <div className={`${variant === 'compact' ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-[#6B498F] to-[#4b2c5e] rounded-full flex items-center justify-center`}>
                            <span className={`text-white font-bold ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>
                                {formatName(review.name).charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h4 className={`font-semibold text-[#4b2c5e] ${variant === 'compact' ? 'text-sm' : ''}`}>{formatName(review.name)}</h4>
                            <div className={`${variant === 'compact' ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                {review.role && <span>{review.role}</span>}
                                {review.role && review.location && <span> • </span>}
                                {review.location && <span>{review.location}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function ReviewsPage() {
    return (
        <div className="min-h-screen bg-[#FFF9E9]">
            <Navigation />
            
            {/* Hero Section */}
            <section className="relative pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E1CCEB]/20 via-[#FFF9E9] to-[#FFF9E9]" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6B498F]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F1BBB0]/10 rounded-full blur-3xl" />
                
                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8 sm:mb-12 md:mb-16"
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-[#E1CCEB]/30 rounded-full mb-3 sm:mb-4 md:mb-6">
                            <Heart className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#6B498F]" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#4b2c5e] mb-2 sm:mb-4 md:mb-6 px-4">
                            Što kažu naše čitateljice
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-[#6B498F] max-w-3xl mx-auto px-4">
                            Pročitajte iskustva žena koje su transformirale svoje odnose uz pomoć knjige &ldquo;Stilovi privrženosti&rdquo;
                        </p>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-12 max-w-3xl mx-auto px-4">
                            <div className="text-center py-2 sm:py-4 sm:py-0">
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#6B498F] mb-0.5 sm:mb-1 md:mb-2">1000+</div>
                                <div className="text-xs sm:text-sm md:text-base text-[#4b2c5e]/80">Zadovoljnih čitateljica</div>
                            </div>
                            <div className="text-center py-2 sm:py-4 sm:py-0 border-y sm:border-y-0 border-[#D4B5A0]/50">
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#6B498F] mb-0.5 sm:mb-1 md:mb-2">4.9/5</div>
                                <div className="text-xs sm:text-sm md:text-base text-[#4b2c5e]/80">Prosječna ocjena</div>
                            </div>
                            <div className="text-center py-2 sm:py-4 sm:py-0">
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#6B498F] mb-0.5 sm:mb-1 md:mb-2">90%</div>
                                <div className="text-xs sm:text-sm md:text-base text-[#4b2c5e]/80">Preporučuje knjigu</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Reviews Dynamic Grid */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Featured Review - 1 large */}
                    <div className="grid grid-cols-1">
                        <FeaturedReviewCard review={reviews[0]} />
                    </div>
                    
                    {/* Row 1 - 3 regular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.slice(1, 4).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index + 1} />
                        ))}
                    </div>
                    
                    {/* Row 2 - 2 regular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reviews.slice(4, 6).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index + 4} />
                        ))}
                    </div>
                    
                    {/* Row 3 - 3 compact */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {reviews.slice(6, 9).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index + 6} variant="compact" />
                        ))}
                    </div>
                    
                    {/* Row 4 - 2 regular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reviews.slice(9, 11).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index + 9} />
                        ))}
                    </div>
                    
                    {/* Row 5 - 3 regular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.slice(11, 14).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index + 11} />
                        ))}
                    </div>
                    
                    {/* Row 6 - 2 compact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.slice(14, 16).map((review, index) => (
                            <ReviewCard key={index} review={review} index={index + 14} variant="compact" />
                        ))}
                    </div>
                    
                    {/* Row 7 - Remaining reviews */}
                    {reviews.length > 16 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {reviews.slice(16).map((review, index) => (
                                <ReviewCard key={index} review={review} index={index + 16} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <CtaToSalesPageSection />
            <FooterSection />
        </div>
    );
} 