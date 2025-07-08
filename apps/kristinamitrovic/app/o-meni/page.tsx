import Navigation from '@repo/ui/components/Navigation';
import { Heart, BookOpen, Users, GraduationCap, Baby, Sparkles, Calendar, MapPin } from 'lucide-react';
import CtaToSalesPageSection from '@/components/CtaSection';
import FooterSection from '@repo/ui/components/FooterSection';
import Image from 'next/image';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#FFF9E9] text-[#4b2c5e]">
            <Navigation />

            {/* Hero Section */}
            <section className="relative py-40 px-4 bg-[#FFF9E9] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/img/story/story-5.webp"
                        alt="Background"
                        fill
                        className="object-cover opacity-90"
                        priority
                    />
                </div>
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#E1CCEB]/50 via-[#FFEAFF]/90 to-[#FFF9E9]"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-6xl font-bold text-[#4b2c5e] mb-6 animate-fade-in">
                        Moja priča
                    </h1>
                    <p className="text-xl text-[#4b2c5e]/80 leading-relaxed">
                        Od gubitka do pronalaženja, od sloma do transformacije
                    </p>
                    <div className="mt-8 flex justify-center">
                        <div className="w-32 h-1 bg-gradient-to-r from-[#6B498F] to-[#F1BBB0] rounded-full"></div>
                    </div>
                </div>
            </section>

            {/* Main Story Content */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Early Years */}
                    <div className="mb-16">
                        <div className="bg-gradient-to-br from-[#E1CCEB]/30 to-[#F1BBB0]/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#D4B5A0]/30">
                            <div className="flex items-center gap-3 mb-6">
                                <Baby className="w-8 h-8 text-[#6B498F]" />
                                <h2 className="text-3xl font-bold text-[#4b2c5e]">Početak priče</h2>
                            </div>
                            <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                Moja priča započinje kada sam imala samo godinu dana. Tog trenutka, moj otac je otišao,
                                ostavljajući majku samu s dvoje djece. Razvodom roditelja, ja sam pripala majci,
                                a moj brat ocu. Taj rani gubitak duboko je oblikovao način na koji sam se kasnije
                                povezivala s drugima, iako toga dugo nisam bila svjesna.
                            </p>
                            <p className="text-lg leading-relaxed text-[#4b2c5e]/80">
                                Odrastajući bez oca, nesvjesno sam razvila vjerovanje da moram zaraditi ljubav.
                                Postala sam ono što danas nazivamo &quot;people pleaser&quot; - osoba koja stalno ugađa drugima,
                                stavljajući njihove potrebe ispred svojih. To je bio moj način preživljavanja,
                                moj način osiguravanja da me ljudi neće napustiti.
                            </p>
                        </div>
                    </div>

                    {/* Education Journey */}
                    <div className="mb-16">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <GraduationCap className="w-8 h-8 text-[#6B498F]" />
                                    <h2 className="text-3xl font-bold text-[#4b2c5e]">Obrazovni put</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-[#FFEAFF]/50 rounded-2xl p-6 border border-[#E1CCEB]/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-5 h-5 text-[#6B498F]" />
                                            <span className="text-[#6B498F] font-semibold">2003-2007</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-[#4b2c5e] mb-2">Medicinska škola Bjelovar</h3>
                                        <p className="text-[#4b2c5e]/80">
                                            Završila sam smjer primalje, što mi je dalo duboko razumijevanje ljudskog tijela,
                                            spolnosti i procesa poroda. Ovdje sam razvila empatiju kroz rad s ranjivim skupinama.
                                        </p>
                                    </div>
                                    <div className="bg-[#FFEAFF]/50 rounded-2xl p-6 border border-[#E1CCEB]/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-5 h-5 text-[#6B498F]" />
                                            <span className="text-[#6B498F] font-semibold">2008-2014</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-[#4b2c5e] mb-2">Učiteljski fakultet Zagreb</h3>
                                        <p className="text-[#4b2c5e]/80">
                                            Studirala sam na odsjeku Čakovec, pripremajući se za rad s djecom.
                                            Tu sam naučila o emocionalnom razvoju, postavljanju granica i važnosti sigurne privrženosti.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#E1CCEB]/20 to-[#F1BBB0]/20 blur-3xl"></div>
                                <Image
                                    src="/img/story/story-1.webp"
                                    alt="Kristina u mladosti"
                                    width={500}
                                    height={600}
                                    className="rounded-2xl relative z-10 w-full h-auto"
                                />
                                <p className="text-center text-sm text-gray-500 mt-4">
                                    &quot;Rad u zdravstvu i obrazovanju naučio me empatiji i razumijevanju ljudskih potreba
                                    na najdubljoj razini. No, još uvijek nisam razumjela svoje vlastite obrasce.&quot;
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Professional Experience */}
                    <div className="mb-16">
                        <div className="bg-gradient-to-br from-[#E1CCEB]/30 to-[#F1BBB0]/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#D4B5A0]/30">
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <MapPin className="w-8 h-8 text-[#6B498F]" />
                                        <h2 className="text-3xl font-bold text-[#4b2c5e]">Profesionalni put</h2>
                                    </div>
                                    <p className="text-lg leading-relaxed text-[#4b2c5e]/80">
                                        Nakon fakulteta, radila sam u različitim obrazovnim ustanovama - OŠ Vladimir Becić,
                                        HOŠIG Budapest i Montessori vrtiću. Svako radno mjesto dalo mi je dragocjeno iskustvo
                                        u radu s djecom različitih uzrasta, učeći me o emocionalnoj regulaciji, razvoju
                                        sigurne privrženosti kod djece i važnosti postavljanja zdravih granica.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Image
                                        src="/img/story/story-2.webp"
                                        alt="Kristina u bolnici"
                                        width={300}
                                        height={225}
                                        className="rounded-xl max-w-[300px] h-auto"
                                    />
                                    <p className="text-center text-sm text-gray-500 italic mt-4">
                                        Maturalna zabava, 2007
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Marriage and Crisis */}
                    <div className="mb-16">
                        <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#6B498F] to-[#F1BBB0] rounded-full"></div>
                            <div className="pl-8">
                                <h2 className="text-3xl font-bold text-[#4b2c5e] mb-6">Brak i slom</h2>
                                <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                    Svi ti nesvjesni obrasci doveli su me do braka koji je, nakon sedam godina, završio razvodom. Bio je to trenutak potpunog sloma.
                                </p>
                                <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                    Sjećam se trenutka očaja kada sam sjedila na podu našeg praznog doma, okružena kartonskim kutijama, i pitala se: &quot;Kako je do ovoga došlo?&quot; Sve što sam mislila da znam o sebi, o odnosima, o ljubavi - jednostavno nije funkcioniralo i srušilo se poput kule od karata. Osjećala sam se bespomoćno kao da mi je netko oderao kožu - sirova, ranjiva, potpuno izgubljena.
                                </p>
                                <p className="text-lg leading-relaxed mb-8 text-[#4b2c5e]/80">
                                    Suočavala sam se sa svojom osobnom i transgeneracijskom traumom, sloj po sloj. Kao kad guliš luk - svaki sloj koji skineš te napravi da plačeš još više, ali znaš da moraš ići do kraja. Svako novo saznanje je bilo otriježnjavajuće, svaki novi uvid je bio kao probadanje noža, u isto vrijeme bolno jer je u meni stvarao razdor: kako to nisam vidjela ili spoznala prije, dok je s druge strane nastupilo olakšanje jer sam počela shvaćati da je to moj novi put prema oslobođenju i povratku sebi.
                                </p>
                                <div className="bg-[#FFEAFF]/50 rounded-2xl p-6 border border-[#E1CCEB]/50 mb-8">
                                    <p className="text-[#4b2c5e]/80 italic text-lg">
                                        &quot;Nekada sam morala stati, duboko udahnuti i pustiti da me nova spoznaja potpuno prožme - kao kada uđeš u hladan bazen i moraš dati tijelu da se navikne na šok. Ali bilo je i onih beskrajnih noći kada me spoznaje nisu donijele olakšanje, već još veće beznađe. Ležala sam budna, vrtjela se u krevetu s glavom punom mučnih pitanja: &apos;Zašto stalno ponavljam iste greške? Zašto me strah od napuštanja paralizira do te mjere da radije ostanem u vezi koja me čini nesretnom nego da budem sama?&apos; U toj tami vlastite duše pitala sam se zašto nikako ne mogu stvoriti tu sigurnu, spokojnu vezu kakvu vidim kod drugih ljudi. Ti trenuci su me doveli do ruba - osjećala sam se kao da sa mnom nešto nije u redu.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transformation */}
                    <div className="mb-16">
                        <div className="bg-gradient-to-br from-[#E1CCEB]/30 to-[#F1BBB0]/20 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#D4B5A0]/30">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="w-8 h-8 text-[#6B498F]" />
                                <h2 className="text-3xl font-bold text-[#4b2c5e]">Prekretnica</h2>
                            </div>
                            <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                U tom najcrnjem trenutku mog života, otkrila sam teoriju privrženosti.
                                Bio je to trenutak prosvjetljenja - odjednom sam shvatila da nisam slomljena.
                                Imam anksiozni stil privrženosti koji je oblikovao sve moje odnose.
                            </p>
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                        Prvi put u životu, moje ponašanje je imalo smisla. Kao da mi je netko upalio svjetlo
                                        u tamnoj sobi u kojoj sam se godinama spoticala o isti namještaj.
                                        Razumjela sam zašto reagiram kako reagiram, koji su moji okidači u određenim situacijama,
                                        zašto stalno tražim potvrdu i zašto me strah od napuštanja drži u konstantnoj anksioznosti.
                                    </p>
                                    <p className="text-lg leading-relaxed text-[#4b2c5e]/80">
                                        Započela sam intenzivan rad na sebi kroz Personal Development School Thais Gibson,
                                        specijalizirajući se za teoriju privrženosti i osobni razvoj. To nije bio lak put -
                                        trebalo je hrabrosti suočiti se sa starim ranama i obrascima. Ali po prvi put u životu,
                                        imala sam mapu koja me je vodila kroz tamu.
                                    </p>
                                </div>
                                <Image
                                    src="/img/story/story-3.webp"
                                    alt="Kristina na sastanku"
                                    width={300}
                                    height={375}
                                    className="rounded-2xl max-w-[300px] h-auto mx-auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Book and Mission */}
                    <div className="mb-16">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="order-2 md:order-1">
                                <Image
                                    src="/img/story/story-4.webp"
                                    alt="Kristina na konferenciji"
                                    width={500}
                                    height={400}
                                    className="rounded-2xl w-full h-auto"
                                />
                                <p className="text-center text-sm text-gray-500 mt-4">
                                    Na konferenciji o mentalnom zdravlju, 2023
                                </p>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="flex items-center gap-3 mb-6">
                                    <BookOpen className="w-8 h-8 text-[#6B498F]" />
                                    <h2 className="text-3xl font-bold text-[#4b2c5e]">Moja misija danas</h2>
                                </div>
                                <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                    Danas, nakon godina transformacije, živim u sigurnoj privrženosti.
                                    Napisala sam knjigu &quot;Stilovi privrženosti&quot; koja je prodana u više od
                                    1000 primjeraka, pomažući ženama širom Balkana da razumiju svoje obrasce.
                                </p>
                                <p className="text-lg leading-relaxed mb-6 text-[#4b2c5e]/80">
                                    Moja misija je jasna - pomoći ženama da prođu istu transformaciju,
                                    samo brže i lakše nego što sam ja prošla. Zato stojim pred vama ne samo
                                    kao stručnjakinja, već kao netko tko je prošao istim putem.
                                </p>
                                <div className="bg-[#E1CCEB]/30 rounded-xl p-6 border border-[#D4B5A0]/30">
                                    <p className="text-[#6B498F] font-semibold italic">
                                        &quot;Ovo nije samo teorija - ovo je praktični put koji vas može osloboditi,
                                        baš kao što je oslobodio mene.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Values and Approach */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-[#4b2c5e] text-center mb-12">Moj pristup</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-gradient-to-br from-[#E1CCEB]/30 to-[#F1BBB0]/20 backdrop-blur-sm rounded-2xl p-8 text-center border border-[#D4B5A0]/30 hover:transform hover:scale-105 transition-transform">
                                <Heart className="w-16 h-16 text-[#6B498F] mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-[#4b2c5e] mb-3">Empatija iz iskustva</h3>
                                <p className="text-[#4b2c5e]/80">
                                    Razumijem svaku suzu, svaki strah i svaku sumnju jer sam ih sve proživjela
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-[#E1CCEB]/30 to-[#F1BBB0]/20 backdrop-blur-sm rounded-2xl p-8 text-center border border-[#D4B5A0]/30 hover:transform hover:scale-105 transition-transform">
                                <BookOpen className="w-16 h-16 text-[#6B498F] mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-[#4b2c5e] mb-3">Znanstvena utemeljenost</h3>
                                <p className="text-[#4b2c5e]/80">
                                    Kombiniram osobno iskustvo s dokazanim psihološkim principima i najnovijim istraživanjima
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-[#E1CCEB]/30 to-[#F1BBB0]/20 backdrop-blur-sm rounded-2xl p-8 text-center border border-[#D4B5A0]/30 hover:transform hover:scale-105 transition-transform">
                                <Users className="w-16 h-16 text-[#6B498F] mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-[#4b2c5e] mb-3">Kulturna osjetljivost</h3>
                                <p className="text-[#4b2c5e]/80">
                                    Moj pristup je prilagođen našoj kulturi i specifičnostima balkanskog mentaliteta
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <CtaToSalesPageSection />

            <FooterSection />
        </div>
    );
} 