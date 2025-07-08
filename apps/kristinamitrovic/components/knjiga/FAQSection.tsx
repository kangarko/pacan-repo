'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, HelpCircle, Heart } from 'lucide-react';

const FAQSection = () => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    // Regular questions
    const regularQuestions = [
        {
            question: "Što čini ovu knjigu drugačijom od ostalih knjiga o vezama?",
            answer: "Za razliku od uobičajnih savjeta, ova knjiga donosi revolucionarni pristup temeljen na najnovijim znanstvenim istraživanjima iz neuroznanosti i teorije privrženosti. Umjesto površnih savjeta, dobivate precizne, znanstveno dokazane tehnike koje su već transformirale živote više od 1000 osoba. Svaka tehnika je testirana i optimizirana kroz godine rada s klijentima, s posebnim fokusom na rješavanje specifičnih izazova nesigurnih stilova privrženosti – nešto što većina drugih knjiga potpuno zanemaruje."
        },
        {
            question: "Je li ovo štampana ili digitalna knjiga?",
            answer: "Ovo je digitalna kopija kojem dobivate trenutni pristup odmah nakon kupnje – bez čekanja na dostavu. Dizajniran je za optimalno iskustvo čitanja na bilo kojem uređaju – računalu, tabletu ili mobitelu. Digitalni format ima ključnu prednost: dobivate SVE buduće nadogradnje, dodatne materijale i bonus sadržaje potpuno besplatno, doživotno. U usporedbi sa štampanim knjigama, ova digitalna verzija također sadrži interaktivne elemente, radne listove i dodatne resurse koji značajno pojačavaju vaše rezultate."
        },
        {
            question: "Kako se ova metodologija razlikuje od klasične CBT ili psihoterapije?",
            answer: "Ova metodologija predstavlja revolucionarni korak naprijed integriranjem tri ključna elementa koje tradicionalni pristupi često propuštaju. Prvo, za razliku od klasične kognitivno-bihevioralne terapije (CBT) koja se primarno fokusira na misli i ponašanja, naš pristup integrira najnovija otkrića interpersonalne neurobiologije koja pokazuju kako je za trajnu promjenu ključno reprogramiranje neuroloških puteva oblikovanih ranim odnosima. Drugo, dok mnoge terapije naglašavaju uvid i razumijevanje, ova metodologija donosi precizan set praktičnih, neurobiološki informiranih tehnika za trenutnu regulaciju živčanog sustava u stresnim situacijama. Treće, za razliku od tradicionalne psihoterapije koja može biti dugotrajna i često bez jasne strukture, naš pristup nudi sistematičan, korak-po-korak proces s mjerljivim rezultatima koji su vidljivi već unutar 21 dana."
        },
        {
            question: "Koliko brzo mogu očekivati rezultate?",
            answer: "93% čitatelja primjećuje značajne promjene već unutar prvih 21 dana primjene ovih tehnika. To uključuje dramatično smanjenu anksioznost u odnosima, sposobnost postavljanja zdravih granica bez osjećaja krivnje, i dublje razumijevanje vlastitih obrazaca. Jedna čitateljica je nakon samo 10 dana izvijestila: 'Prvi put nakon 15 godina mogu spavati noću bez stalne brige o svojoj vezi.' Za dublje transformacije koje mijenjaju život, većina korisnika doživljava značajne promjene kroz 6-8 tjedana predanog rada na sebi."
        },
        {
            question: "Koliko vremena trebam posvetiti dnevno?",
            answer: "Za optimalne rezultate, preporučujemo samo 15-20 minuta fokusiranog rada dnevno. Knjiga je strateški strukturirana u module koje možete pratiti vlastitim tempom, uklapajući ih i u najzauzetiji raspored. Ključ uspjeha nije u količini vremena, već u dosljednosti primjene – naši podaci pokazuju da čitatelji koji prakticiraju tehnike 10-15 minuta dnevno postižu značajno bolje rezultate od onih koji rade sat vremena jednom tjedno. Jednostavne, svakodnevne prakse koje ćete naučiti mogu se integrirati u vaš postojeći životni ritam, što čini ovu metodologiju izuzetno praktičnom čak i ako ste zauzeti."
        },
        {
            question: "Što ako nemam vremena za duboko proučavanje psihologije?",
            answer: "Upravo za vas je ova knjiga dizajnirana! Za razliku od akademskih tekstova koji zahtijevaju predznanje i sate proučavanja, ova metodologija predstavljena je u praktičnom, korak-po-korak formatu koji svatko može odmah primijeniti. Kristina je provela godine transformirajući složene psihološke koncepte u jednostavne, lako razumljive tehnike. Knjiga je strukturirana u kratke, probavljive module od 10-15 minuta, s jasnim akcijskim koracima nakon svakog poglavlja. 91% čitatelja bez ikakvog znanja o psihologiji izvijestilo je da su lako razumjeli i primijenili tehnike. Kao što je jedan čitatelj rekao: 'Konačno knjiga koja objašnjava kompleksne koncepte kao da razgovaram s prijateljem, a ne s profesorom psihologije.' Nećete se izgubiti u teoriji - dobit ćete jasne, praktične alate koje možete početi koristiti istog trenutka."
        },
        {
            question: "Je li ova knjiga namijenjena samo ženama?",
            answer: "Apsolutno ne! Iako je knjiga pisana s perspektivom primarno ženskog iskustva, principi sigurne privrženosti jednako su primjenjivi i korisni za oba roda. Kristina ima bogato iskustvo rada s klijentima oba roda i prilagodila je svoje tehnike tako da budu univerzalno učinkovite. Zapravo, 32% naših čitatelja su muškarci koji su doživjeli jednako impresivne transformacije. Neurobiologija privrženosti funkcionira na isti način bez obzira na rod, a metodologija predstavljena u knjizi temelji se na tim univerzalnim principima. I muškarci i žene se suočavaju s izazovima nesigurne privrženosti, samo ih ponekad različito ispoljavaju."
        },
        {
            question: "Trebam li biti u vezi da bih imala koristi od knjige?",
            answer: "Apsolutno ne! Zapravo, 68% naših najuspješnijih čitatelja počeli su rad na sebi upravo kada NISU bili u vezi. Ovo je savršen trenutak za transformaciju jer možete fokusirano raditi na sebi bez 'buke' trenutnih odnosa. Knjiga vas vodi kroz dubinski proces razumijevanja i preobrazbe vaših obrazaca privrženosti, postavljajući snažne temelje za sve buduće odnose. Mnogi su izvijestili da su, nakon rada na sebi kroz ovu metodologiju, privukli potpuno drugačiju vrstu partnera – nekoga tko podržava njihov novi, sigurni stil privrženosti."
        },
        {
            question: "Mogu li primjenjivati ove tehnike ako moj partner nije zainteresiran za rad na sebi?",
            answer: "Apsolutno! To je zapravo jedna od ključnih prednosti ove metodologije. Mnogi naši čitatelji koji su započeli transformaciju samostalno izvijestili su o značajnim poboljšanjima u svojim vezama, čak i kada njihovi partneri nisu aktivno sudjelovali. Zašto? Jer promjena dinamike veze često počinje s promjenom jedne osobe. Kad vi promijenite svoje obrasce privrženosti, automatski mijenjate i dinamiku odnosa. Mnogi čitatelji opisuju kako su njihovi partneri spontano počeli pokazivati pozitivne promjene kao odgovor na njihovu transformaciju. Vaša osobna promjena djeluje kao katalizator koji može pokrenuti pozitivnu spiralu u cijelom odnosu. Knjiga vas uči specifičnim tehnikama kako postići ovu transformaciju neovisno o partnerovom angažmanu."
        },
        {
            question: "Je li ova knjiga prikladna ako imam traumatska iskustva iz prošlih veza?",
            answer: "Ovo je izuzetno važno pitanje. Kristina je posebno pažljivo razvila metodologiju imajući na umu osobe s traumatskim iskustvima. Nekoliko naših čitatelja dolazi s poviješću traumatskih iskustava iz veza i posebno cijene nježan, postupan pristup koji knjiga nudi. Umjesto dramatičnog suočavanja koje može biti preplavljujuće, metodologija vas vodi kroz niz manjih, sigurnih koraka koji grade emocionalnu stabilnost. Knjiga sadrži posebno poglavlje posvećeno tehnikama za regulaciju živčanog sustava koje pomažu kod traumatskih reakcija. Međutim, važno je napomenuti da iako knjiga može biti iznimno korisna, ona je zamišljena kao komplementarni alat terapiji za osobe s traumom. Mnogi naši čitatelji kombiniraju tehnike iz knjige sa svojim terapijskim procesom i izvještavaju o ubrzanom napretku. Kristina nudi posebne smjernice za taj integrirani pristup."
        },
        {
            question: "Trebam li terapiju uz ovu knjigu?",
            answer: "Iako ova knjiga pruža moćne alate za transformaciju privrženosti, ona nije zamjena za profesionalnu terapiju ako se nosite s dubokom traumom ili ozbiljnim mentalnim izazovima. Mnogi naši čitatelji uspješno koriste knjigu kao vrijednu nadopunu terapiji, dok je drugi koriste samostalno za osobni razvoj. Ono što ovu knjigu čini jedinstvenom jest pristupačan način na koji objašnjava složene koncepte i pruža praktične tehnike koje možete početi primjenjivati odmah. Preporučujemo da se posavjetujete sa stručnjakom za mentalno zdravlje ako niste sigurni što je najbolje za vašu situaciju."
        },
        {
            question: "Što ako nisam zadovoljna knjigom?",
            answer: "Nudimo bezuvjetno 30-dnevno jamstvo povrata novca bez postavljanja pitanja. Toliko smo uvjereni u transformativnu moć ove metodologije da preuzimamo 100% rizika. Ako iz bilo kojeg razloga niste potpuno zadovoljni, jednostavno nas kontaktirajte i dobit ćete puni povrat novca – bez pitanja, bez komplikacija. To znači da možete provesti puni mjesec primjenjujući ove tehnike bez ikakvog rizika. Već preko 1000 ljudi vjeruje ovoj metodologiji, i uvjereni smo da ćete i vi vidjeti njezinu vrijednost."
        }
    ];

    // Organize FAQs into sections
    const faqSections = [
        {
            title: "",
            questions: regularQuestions
        }
    ];


    // Convert section/question index to flat index
    const getFlatIndex = (sectionIndex: number, questionIndex: number): number => {
        let flatIndex = 0;
        for (let i = 0; i < sectionIndex; i++) {
            flatIndex += faqSections[i].questions.length;
        }
        return flatIndex + questionIndex;
    };

    // Handle opening a question
    const handleOpenQuestion = (sectionIndex: number, questionIndex: number) => {
        const flatIndex = getFlatIndex(sectionIndex, questionIndex);
        setOpenIndex(openIndex === flatIndex ? null : flatIndex);
    };

    return (
        <div id="faq" className="bg-gradient-to-b from-[#FFF9E9] to-[#E1CCEB]/40 py-24 relative overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6B498F]/10 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#F1BBB0]/10 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#E1CCEB]/20 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-4 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-3 bg-[#FFEAFF]/80 px-8 py-3 rounded-full mb-8 border border-[#E1CCEB]/50 backdrop-blur-sm">
                        <HelpCircle className="w-4 h-4 text-[#6B498F]" />
                        <span className="text-sm font-medium text-[#6B498F]">
                            Česta pitanja
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-[#4b2c5e] mb-4 md:mb-6 leading-tight">
                        Sve što trebate znati
                    </h2>
                    <p className="text-lg md:text-xl text-[#4b2c5e]/80 max-w-3xl mx-auto leading-relaxed">
                        Odgovori na najčešća pitanja o knjizi i metodologiji
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto space-y-16">
                    {faqSections.map((section, sectionIndex) => (
                        <motion.div
                            key={sectionIndex}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            {/* Section Title */}
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-2xl font-bold text-[#4b2c5e]">{section.title}</h3>
                            </div>

                            {/* Questions in this section */}
                            <div className="space-y-4">
                                {section.questions.map((faq, questionIndex) => {
                                    const flatIndex = getFlatIndex(sectionIndex, questionIndex);
                                    const isOpen = openIndex === flatIndex;

                                    return (
                                        <motion.div
                                            key={questionIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: questionIndex * 0.1 }}
                                            className={`bg-[#FFEAFF]/60 backdrop-blur-sm rounded-2xl border border-[#E1CCEB]/50 overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-lg shadow-purple-500/10' : ''}`}
                                        >
                                            <button
                                                onClick={() => handleOpenQuestion(sectionIndex, questionIndex)}
                                                className="w-full text-left px-8 py-6 flex items-start gap-4 hover:bg-[#E1CCEB]/20 transition-colors"
                                            >
                                                <div className="pt-1">
                                                    <HelpCircle className="w-5 h-5 text-[#6B498F] flex-shrink-0" />
                                                </div>
                                                <span className="text-lg md:text-xl font-medium text-[#4b2c5e] flex-grow">
                                                    {faq.question}
                                                </span>
                                                <div className="pt-1">
                                                    {isOpen ? (
                                                        <Minus className="w-5 h-5 text-[#6B498F] flex-shrink-0" />
                                                    ) : (
                                                        <Plus className="w-5 h-5 text-[#6B498F] flex-shrink-0" />
                                                    )}
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="px-8 pb-8 pl-[4.5rem]">
                                                    <div className="prose max-w-none">
                                                        {faq.answer.split('. ').map((sentence, i, sentences) => {
                                                            // Skip empty sentences
                                                            if (!sentence.trim()) return null;

                                                            // Add period back except for last sentence which might already have other punctuation
                                                            const formattedSentence = i < sentences.length - 1 ?
                                                                `${sentence.trim()}.` :
                                                                sentence.trim();

                                                            // Create paragraph breaks every 2-3 sentences for readability
                                                            const shouldBreak = (i > 0 && i % 3 === 0) ||
                                                                (formattedSentence.includes('!') ||
                                                                    formattedSentence.includes('?') ||
                                                                    formattedSentence.length > 100);

                                                            return (
                                                                <React.Fragment key={i}>
                                                                    {shouldBreak && i > 0 && <div className="my-2" />}
                                                                    <span className={`text-[#4b2c5e]/80 leading-relaxed ${formattedSentence.includes('%') ||
                                                                        (formattedSentence.includes(':') && formattedSentence.length < 60) ?
                                                                        'font-medium' : ''}`}>
                                                                        {formattedSentence}{' '}
                                                                    </span>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mt-16"
                >
                    <div className="inline-flex items-center justify-center gap-2 bg-[#E1CCEB]/30 px-6 py-4 rounded-2xl">
                        <Heart className="w-5 h-5 text-[#6B498F]" />
                        <p className="text-[#4b2c5e]/80">
                            Imate dodatna pitanja? Kontaktirajte nas na{' '}
                            <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`} className="text-[#6B498F] hover:text-[#4b2c5e] transition-colors">
                                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                            </a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FAQSection;