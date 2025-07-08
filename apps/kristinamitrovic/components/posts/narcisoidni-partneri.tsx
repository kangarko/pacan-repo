import { Callout, ImageWithCaption, HighlightBox, StatsCard, ImageGallery } from '@repo/ui/components/BlogComponents';
import React from 'react';

export const meta = {
    slug: 'narcisoidni-partneri',
    title: 'Zašto privlačimo narcisoidne partnere?',
    excerpt: 'Dubinska analiza veze između nesigurnih stilova privrženosti i sklonosti ka vezama s narcisoidnim osobama.',
    date: '2025-04-09',
    category: 'Toksični odnosi',
    headerImage: 'https://images.unsplash.com/photo-1636869808515-cb81899c7420?q=80&w=2000&auto=format&fit=crop',
    headerImageAlt: 'Osoba gleda u razbijeno ogledalo',
    headerImageCredit: 'Photo by Alen Kajtezovic on Unsplash'
};

const Post = () => (
    <>
        <p className="lead">Osobe s nesigurnim stilovima privrženosti, posebno anksioznim, često se nalaze u vezama s narcisoidnim partnerima. Ova dinamika, iako destruktivna, nije slučajna - istraživanja pokazuju jasnu povezanost između anksiozne privrženosti i ranjivosti na narcisoidno zlostavljanje.</p>

        <h2>Razumijevanje narcisoidnog poremećaja</h2>

        <p>Prije nego što istražimo zašto se privlačimo narcisoidnim partnerima, važno je razumjeti što narcizam zapravo jest. Narcisoidni poremećaj osobnosti kompleksan je psihološki fenomen koji se manifestira kroz niz prepoznatljivih karakteristika i ponašanja.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-8">
            <StatsCard number="1-6%" label="populacije ima narcisoidni poremećaj" />
            <StatsCard number="50-75%" label="su muškarci" />
            <StatsCard number="Rijetko" label="traže pomoć" />
        </div>

        <p className="text-sm text-gray-600 mb-4">Napomena: Učestalost narcisoidnog poremećaja osobnosti varira između studija, s većinom koja pokazuje 1-2% u općoj populaciji. Osobe s ovim poremećajem rijetko traže pomoć specifično za narcisoidne probleme.</p>

        <h3>Ključne karakteristike narcisoidne osobe</h3>

        <p>Prema dijagnostičkim kriterijima i istraživanjima, narcisoidne osobe karakterizira veličanstvenost - pretjeran osjećaj vlastite važnosti koji često prikriva duboku nesigurnost. Pokazuju nedostatak empatije, nesposobnost prepoznavanja ili razumijevanja tuđih potreba i osjećaja. Imaju konstantnu potrebu za divljenjem i pažnjom, kao da njihov osjećaj vrijednosti ovisi o vanjskoj validaciji. Skloni su iskorištavanju drugih za vlastite ciljeve, često bez osjećaja krivnje. Nose osjećaj prava, duboko uvjerenje da zaslužuju poseban tretman bez obzira na svoj doprinos. Arogancija i omalovažavanje drugih služe im kao načini održavanja iluzije superiornosti. Često osjećaju zavid prema drugima ili vjeruju da im drugi zavide, što dodatno pojačava njihovu potrebu za dokazivanjem.</p>

        <h2>Privlačnost i opasnost: Znanstveno objašnjenje</h2>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1508252592163-5d3c3c559f36?q=80&w=2000&auto=format&fit=crop"
            alt="Crvena ruža s trnjem"
            caption="Početna privlačnost često skriva opasne trnove"
            credit="Photo by Tirza van Dijk on Unsplash"
        />

        <p>Istraživanja Day, Townsend i Grenyer (2020-2022) dokumentiraju obrazac &quot;uzajamne idealizacije s naknadnom devalvacijom&quot; u narcisoidnim vezama. Narcisoidne osobe na početku veze često djeluju šarmantno, samouvjereno i pažljivo, što je izuzetno privlačno anksioznim osobama koje žude za potvrdom. Međutim, ta početna faza brzo prelazi u ciklus idealizacije, devalvacije i odbacivanja koji može ostaviti duboke emocionalne ožiljke.</p>

        <h3>Faza 1: Bombardiranje ljubavlju</h3>

        <p>U početnoj fazi, narcisoidni partner vas zasipa pretjeranom pažnjom i komplimentima koji se čine gotovo predobri da bi bili istiniti. Ovaj fenomen naziva se &quot;love bombing&quot; (doslovno: bombardiranje ljubavlju), što savršeno opisuje intenzitet i prekomjernost takve pažnje. Strutzenberg i suradnici (2017) prvi su akademski istražili ovaj fenomen, a novija istraživanja pokazuju da 78% korisnika aplikacija za upoznavanje izvještava o iskustvu takvog bombardiranja ljubavlju. Karakteristike uključuju: brza obećanja o budućnosti, govore o braku i djeci nakon samo nekoliko tjedana, intenzivnu ljubav opojnog intenziteta, te stalno ponavljanje kako ste &quot;savršeni&quot; i &quot;drugačiji od svih drugih&quot;. Ovo aktivira dopaminske receptore u mozgu i stvara gotovo ovisničku vezu.</p>

        <Callout type="warning">
            Bombardiranje ljubavlju nije romantično - to je manipulacijska tehnika osmišljena da vas učini ovisnim o njihovoj pažnji i odobrenju. Istraživanja pokazuju povezanost s kasnijim psihološkim zlostavljanjem.
        </Callout>

        <h3>Faza 2: Devalvacija</h3>

        <p>Nakon što vas &quot;uhvate&quot;, počinje suptilno (a kasnije i otvoreno) omalovažavanje. Kritiziraju stvari koje su prije hvalili - vaš izgled, osobnost, način na koji radite stvari. Uspoređuju vas s drugima na način koji vas čini nesigurnima. Povlače pažnju i ljubav kao kaznu za percipirana &quot;nedjela&quot;. Započinju s manipulacijom percepcije - negiraju vašu percepciju stvarnosti, uvjeravaju vas da ste previše osjetljivi ili da krivo pamtite događaje.</p>

        <h3>Faza 3: Odbacivanje</h3>

        <p>Ciklus se završava prijetnjom ili stvarnim odbacivanjem koje može biti emocionalno devastirajuće. Prijete prekidom zbog najmanjih razloga. Traže &quot;pauze&quot; koje vas ostavljaju u neizvjesnosti. Mogu vas emocionalno ili fizički napustiti bez objašnjenja. Često se vraćaju s ponovnim love bombingom kada osjete da ih gubite, što ponovno pokreće cijeli ciklus.</p>

        <h2>Zašto anksiozni stil privlači narcise? Znanstvena perspektiva</h2>

        <ImageGallery
            images={[
                {
                    src: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?q=80&w=2000&auto=format&fit=crop",
                    alt: "Magnet privlači"
                },
                {
                    src: "https://images.unsplash.com/photo-1612611741189-a9b9eb01d515?q=80&w=2000&auto=format&fit=crop",
                    alt: "Puzzle koji se uklapa"
                }
            ]}
        />

        <p>Prema istraživanjima, postoji značajna povezanost između anksiozne privrženosti i ranjivog narcizma.</p>

        <h3>1. Komplementarni obrasci</h3>

        <p>Anksiozni i narcisoidni stil stvaraju savršenu, iako toksičnu, simfoniju. Anksiozno privržena osoba treba stalnu potvrdu da je voljena (zbog negativnog modela sebe), dok narcis treba stalno divljenje i pažnju. Ova dinamika stvara uzajamnu ovisnost gdje svaki partner ispunjava nezdravu potrebu onog drugog. Istraživanja pokazuju da anksiozno privržene osobe koriste pojačane strategije traženja pažnje koje se savršeno uklapaju s narcisoidnom potrebom za pažnjom.</p>

        <h3>2. Poznata dinamika</h3>

        <p>Teorija privrženosti objašnjava kako rani odnosi oblikuju naše kasnije veze. Za osobu koja je odrasla s nedosljednim ili manipulativnim roditeljima, narcisoidno ponašanje može se činiti poznato. Prepoznaju &quot;ljubav&quot; kroz dramu i nesigurnost jer su to naučili u djetinjstvu. Osjećaju se ugodno u kaosu jer mir i stabilnost djeluju nepoznato i nezasluženo. Vjeruju da moraju &quot;zaraditi&quot; ljubav kroz stalno dokazivanje svoje vrijednosti.</p>

        <h3>3. Nisko samopouzdanje</h3>

        <p>Anksiozne osobe često nose duboko uvjerenje da nisu dovoljno dobre, što ih čini idealnim metama za narcise. Imaju strah da neće naći nikoga boljeg, što narcis pojačava svojim omalovažavanjem. Pokazuju tendenciju preuzimanja krivnje za probleme u vezi, što narcisu omogućava izbjegavanje odgovornosti za svoje ponašanje.</p>

        <Callout type="info">
            Narcisi intuitivno prepoznaju ove ranjivosti i koriste ih. Oni traže partnere koji će tolerirati njihovo ponašanje i stalno im davati ono što žele - divljenje i kontrolu.
        </Callout>

        <h2>Vezivanje kroz traumu: Neurobiološka osnova</h2>

        <p>Jedan od najjačih razloga zašto je teško izaći iz veze s narcisom je traumatsko vezivanje (engl. trauma bonding) - psihološka veza koja se stvara između žrtve i zlostavljača kroz cikluse zlostavljanja i povremenih nagrada. Dutton i Painter (1981) prvi su opisali ovaj fenomen, a novija neurobiološka istraživanja potvrđuju da ovaj ciklus stvara ovisnost sličnu ovisnosti o drogama.</p>

        <h3>Kako funkcionira - znanstvena perspektiva</h3>

        <p><strong>Povremeno nagrađivanje:</strong> Nepredvidive nagrade (ljubav, pažnja) najjači su oblik uvjetovanja poznat u psihologiji. Sustav nagrađivanja u mozgu reagira jače na nepredvidive nagrade nego na stalne.</p>

        <p><strong>Kognitivna disonanca:</strong> Nastaje kada um pokušava pomiriti ljubav koju osjećate s lošim tretmanom koji primate. Ova unutarnja borba često rezultira racionaliziranjem zlostavljanja.</p>

        <p><strong>Biokemijska ovisnost:</strong> Istraživanja pokazuju da ciklusi stresa i olakšanja aktiviraju iste moždane putove kao droge. Sustav reakcije na stres u tijelu (koji uključuje mozak i nadbubrežne žlijezde) postaje poremećen, a razine hormona stresa dramatično variraju. Hormon vezivanja može pojačati traumatske uspomene povezane sa strahom (Northwestern Medicine, 2013).</p>

        <h2>Prepoznavanje manipulacijskih tehnika: Što znanost kaže</h2>

        <h3>Manipulacija percepcije (Gaslighting)</h3>

        <p>Gaslighting je sistematsko dovođenje u pitanje vaše percepcije stvarnosti. Riječ potječe od filma &quot;Gaslight&quot; iz 1944. godine, gdje muž namjerno manipulira stvarnošću svoje žene kako bi je uvjerio da gubi razum. U hrvatskom jeziku možemo to nazvati &quot;manipulacijom percepcije&quot; ili &quot;psihološkim izvrtanjem stvarnosti&quot;. Nedavna istraživanja (Tager-Shafrir i sur., 2024) pokazuju povezanost ove manipulacijske tehnike s depresijom, anksioznošću i posttraumatskim stresnim poremećajem. Narcis će reći stvari poput &quot;To se nije dogodilo&quot; čak i kada znate da se dogodilo, uvjeravat će vas da ste &quot;previše osjetljivi&quot;, mogu vas nazvati &quot;ludima&quot;, ili tvrditi da se &quot;svi slažu&quot; da ste vi problem.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1713942590288-1468a2d88ee4?q=80&w=2000&auto=format&fit=crop"
            alt="Mutna slika, nejasna percepcija"
            caption="Gaslighting zamućuje vašu percepciju stvarnosti"
            credit="Photo by Vitaly Gariev on Unsplash"
        />

        <h3>Triangulacija</h3>

        <p>Triangulacija je uvođenje treće osobe u dinamiku odnosa kako bi se stvorila nesigurnost. Iako je više istražena u obiteljskim sustavima (Fosco i sur., 2022), klinička praksa potvrđuje njenu uporabu u narcisoidnim vezama. Narcis će vas uspoređivati s bivšim partnerima, flertovat će s drugima pred vama, koristit će druge ljude da vam prenesu poruke, ili tvrditi da &quot;svi misle&quot; nešto negativno o vama.</p>

        <h3>Projekcija</h3>

        <p>Projekcija je dobro utemeljen obrambeni mehanizam u psihologiji (Freud, 1894; Kampe i sur., 2021). Istraživanja pokazuju da je projekcija centralna za narcisoidne prezentacije. Narcis će vas optužiti za varanje dok sami varaju, nazvat će vas sebičnima dok iskorištavaju vašu velikodušnost, ili tvrditi da ste kontrolirajući dok pokušavaju kontrolirati svaki aspekt vašeg života.</p>

        <h2>Zašto je tako teško otići? Znanstveno objašnjenje</h2>

        <p>Istraživanja pokazuju da 69% partnera narcisoidnih osoba ispunjava kriterije za depresiju, a 82% za anksioznost. Razlozi uključuju:</p>

        <p><strong>Emocionalni razlozi:</strong> Strah od samoće može biti paralizirajući, posebno nakon što je narcis sistematski uništio vaše samopouzdanje. Nada da će se promijeniti održava se sjećanjima na početnu fazu bombardiranja ljubavlju. Ljubav prema &quot;dobrim trenucima&quot; čini da zaboravljamo ili minimiziramo zlostavljanje. Osjećaj odgovornosti za njihovu sreću rezultat je manipulacije.</p>

        <p><strong>Neurobiološki razlozi:</strong> Dio mozga odgovoran za donošenje odluka može biti narušen zbog dugotrajnog stresa. Simptomi slični apstinencijskoj krizi javljaju se pri pokušaju prekida - fizička bol, nesanica, gubitak apetita. Naučena bespomoćnost razvija se kroz nepredvidivo nagrađivanje.</p>

        <p><strong>Praktični razlozi:</strong> Financijska ovisnost, zajednička djeca, izolacija od podrške (koju je narcis pažljivo orkestrirao), te opravdan strah od osvete.</p>

        <h2>Proces ozdravljenja: Znanstveno utemeljeni pristupi</h2>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2000&auto=format&fit=crop"
            alt="Grupa ljudi se drži za ruke"
            caption="Podrška zajednice ključna je za ozdravljenje"
            credit="Photo by Shane Rounce on Unsplash"
        />

        <p className="mt-4">Razumijevanje ove dinamike prvi je korak prema prekidanju ciklusa i privlačenju zdravih partnera. Ozdravljenje je dugotrajan proces koji zahtijeva strpljenje, podršku i predanost sebi.</p>

        <h3>1. Prepoznavanje obrazaca</h3>

        <p>Prvo morate vidjeti vezu kakva jest, bez iluzija i opravdanja. Vodite dnevnik ponašanja partnera - zapišite konkretne incidente, datume i kako ste se osjećali. Primijetite cikluse idealizacije i devalvacije. Prepoznajte manipulacijske tehnike kada se dogode, bez racionaliziranja.</p>

        <h3>2. Razumijevanje vlastitih okidača</h3>

        <p>Istražite što vas privlači kod narcisoidne osobe kroz prizmu teorije privrženosti. Koja uvjerenja o sebi potvrđuje ova veza? Kako se ova dinamika povezuje s vašim djetinjstvom? Terapija usmjerena na privrženost može biti posebno korisna u ovom procesu.</p>

        <h3>3. Izgradnja mreže podrške</h3>

        <p>Narcisi često izoliraju svoje partnere, pa je ponovno povezivanje ključno. Obnovite stara prijateljstva, potražite stručnu pomoć, pridružite se grupi podrške, razgovarajte s vjerodostojnim ljudima koji vas neće osuđivati.</p>

        <h3>4. Postavljanje čvrstih granica</h3>

        <p>S narcisoidnim osobama, granice moraju biti čelične. Ako je moguće, prekinite svaki kontakt. Ako morate održavati kontakt zbog djece, držite ga minimalnim. Ne reagirajte emocionalno na provokacije. Dokumentirajte sve interakcije za slučaj da trebate pravnu zaštitu.</p>

        <Callout type="warning">
            Narcisi će testirati svaku granicu. Očekujte pojačane napore da vas vrate - ponovno bombardiranje ljubavlju, prijetnje, krivnja, čak i lažne krize. Ostanite čvrsti.
        </Callout>

        <h3>5. Rad na sebi kroz dokazane terapijske pristupe</h3>

        <p>Dugoročno ozdravljenje zahtijeva dubinski rad na sebi kroz znanstveno potvrđene metode.</p>

        <h2>Crvene zastavice za budućnost</h2>

        <HighlightBox title="Na što paziti u novim vezama">
            <ul>
                <li><strong>Prebrz razvoj</strong> - Izjave ljubavi nakon nekoliko tjedana</li>
                <li><strong>Pretjerana šarmantnost</strong> - Posebno ako djeluje neautentično</li>
                <li><strong>Nedostatak empatije</strong> - Kako tretiraju konobara, životinje?</li>
                <li><strong>Grandiozne priče</strong> - Uvijek su heroj ili žrtva</li>
                <li><strong>Loši odnosi s bivšima</strong> - Svi bivši su &quot;ludi&quot;</li>
                <li><strong>Kršenje granica</strong> - Ne poštuju vaše &quot;ne&quot;</li>
                <li><strong>Kontrola</strong> - Žele znati gdje ste, s kim ste</li>
            </ul>
        </HighlightBox>

        <h2>Korisni terapijski pristupi - što pokazuju istraživanja</h2>

        <h3>Kognitivno-bihevioralna terapija</h3>
        
        <p>Ova terapija je prva linija tretmana za posttraumatski stresni poremećaj prema međunarodnim smjernicama. Istraživanja pokazuju velike učinke, posebno kod trauma-fokusirane verzije. Tipično je potrebno 12-20 sesija s održanim poboljšanjima nakon 12 mjeseci. Ova terapija pomaže u mijenjanju obrazaca mišljenja koji vas drže u toksičnim vezama.</p>

        <h3>EMDR - terapija pokretima očiju</h3>
        
        <p>EMDR (desenzitizacija i reprocesiranje pokretima očiju) pokazuje izvanredne rezultate: 84-90% žrtava jednostruke traume oslobađa se posttraumatskog stresnog poremećaja nakon 3-6 sesija, 77% ratnih veterana nakon 12 sesija. Svjetska zdravstvena organizacija preporučuje EMDR kao prvu liniju tretmana za traumu.</p>

        <h3>Terapija usmjerena na privrženost</h3>
        
        <p>Pokazuje umjerene do jake dokaze kada je integrirana s drugim pristupima. Zahtijeva dugoročniji tretman (6 mjeseci do 2+ godine). Fokusira se na modificiranje unutarnjih radnih modela vezivanja.</p>

        <h3>Grupe podrške</h3>
        
        <p>Istraživanja pokazuju značajne prednosti grupa podrške za preživjele narcisoidnog zlostavljanja, uključujući smanjenje izolacije, validaciju iskustava i učenje od drugih.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1559677437-62c20d42dd27?q=80&w=2000&auto=format&fit=crop"
            alt="Sunčeva svjetlost kroz šumu"
            caption="Ozdravljenje donosi novu svjetlost u život"
            credit="Photo by Eric Muhr on Unsplash"
        />

        <h2>Kada potražiti profesionalnu pomoć</h2>

        <p>Razmislite o terapiji ako imate povijest veza s narcisoidnim partnerima, ako vam je teško prekinuti vezu unatoč zlostavljanju, ako osjećate dugotrajnu izgubljenost nakon prekida, ako imate simptome posttraumatskog stresa poput nametljivih sjećanja i noćnih mora, ili ako ne možete zamisliti zdravu vezu.</p>

        <h2>Zaključak: Postoji nada</h2>

        <p>Privlačenje narcisoidnih partnera nije vaša sudbina. To je naučeni obrazac koji se može promijeniti. Znanstvena istraživanja jasno pokazuju vezu između anksiozne privrženosti i ranjivosti na narcisoidno zlostavljanje, ali također pokazuju da je ozdravljenje moguće kroz dokazane terapijske pristupe.</p>

        <p>Vi niste odgovorni za narcisoidno ponašanje vašeg partnera. Niste ga uzrokovali, ne možete ga kontrolirati i ne možete ga izliječiti. Ali možete kontrolirati svoju reakciju i svoje izbore. Svaki korak prema razumijevanju zašto se ova dinamika događa, korak je prema slobodi.</p>

        <Callout type="success">
            Zapamtite: Zaslužujete ljubav koja vas ne iscrpljuje, već ispunjava. Ljubav koja vas ne čini anksioznima, već sigurnima. Ljubav koja vas ne umanjuje, već podiže. Istraživanja pokazuju da ljudi mogu razviti sigurniji stil privrženosti kroz terapiju i zdrave odnose.
        </Callout>

        <h2>Što možete učiniti ovaj tjedan</h2>

        <p>Ovaj tjedan, napravite listu svih &quot;crvenih zastavica&quot; koje ste primijetili u svojim prošlim vezama, posebno s narcisoidnim partnerima. Budite konkretni - umjesto &quot;bio je loš prema meni&quot;, napišite &quot;vikao je na mene kada sam izrazila svoje mišljenje&quot;. Pokušajte identificirati barem 10 konkretnih ponašanja. Zatim, pokraj svake crvene zastavice, napišite kako bi izgledalo zdravo ponašanje u toj situaciji. Na primjer, pokraj &quot;vikao je kada sam izrazila mišljenje&quot; napišite &quot;zdrav partner bi saslušao moje mišljenje s poštovanjem, čak i ako se ne slaže&quot;. Ova vježba pomaže vašem mozgu prepoznati razliku između toksičnih i zdravih obrazaca. Čuvajte ovu listu i vraćajte joj se kada upoznate nove ljude - ona će vam služiti kao vodič za prepoznavanje potencijalnih problema prije nego što se emocionalno duboko vežete.</p>

        <hr className="my-12" />

        <h2>Reference</h2>

        <div className="text-sm space-y-2 mt-8">
            <p>American Psychological Association (APA). (2017). <em>Clinical practice guideline for the treatment of posttraumatic stress disorder (PTSD) in adults.</em> Washington, DC: Author.</p>
            
            <p>Bartholomew, K., & Horowitz, L. M. (1991). Attachment styles among young adults: A test of a four-category model. <em>Journal of Personality and Social Psychology</em>, 61(2), 226-244.</p>
            
            <p>Bowlby, J. (1969). <em>Attachment and Loss: Vol. 1. Attachment.</em> New York: Basic Books.</p>
            
            <p>Day, N. J. S., Townsend, M. L., & Grenyer, B. F. S. (2020). Living with pathological narcissism: A qualitative study. <em>Borderline Personality Disorder and Emotion Dysregulation</em>, 7, 19.</p>
            
            <p>Day, N. J. S., Townsend, M. L., & Grenyer, B. F. S. (2022). Pathological narcissism: An analysis of interpersonal dysfunction within intimate relationships. <em>Personality and Mental Health</em>, 16(3), 204-216.</p>
            
            <p>Dhawan, N., Kunik, M. E., Oldham, J., & Coverdale, J. (2010). Prevalence and treatment of narcissistic personality disorder in the community: A systematic review. <em>Comprehensive Psychiatry</em>, 51(4), 333-339.</p>
            
            <p>Dutton, D. G., & Painter, S. L. (1981). Traumatic bonding: The development of emotional attachments in battered women and other relationships of intermittent abuse. <em>Victimology</em>, 6(1-4), 139-155.</p>
            
            <p>Fosco, G. M., Brinberg, M., Ram, N., et al. (2022). Family and individual risk factors for triangulation: Evaluating evidence for emotion coaching buffering effects. <em>Journal of Family Psychology</em>, 36(2), 157-168.</p>
            
            <p>Hazan, C., & Shaver, P. (1987). Romantic love conceptualized as an attachment process. <em>Journal of Personality and Social Psychology</em>, 52(3), 511-524.</p>
            
            <p>International Society for Traumatic Stress Studies (ISTSS). (2018). <em>ISTSS guidelines position paper on complex PTSD in adults.</em> Oakbrook Terrace, IL: Author.</p>
            
            <p>Kampe, L., Bohn, J., Remmers, C., & Hörz-Sagstetter, S. (2021). It&apos;s not that great anymore: The central role of defense mechanisms in grandiose and vulnerable narcissism. <em>Frontiers in Psychiatry</em>, 12, 661948.</p>
            
            <p>Kjærvik, S. L., & Bushman, B. J. (2021). The link between narcissism and aggression: A meta-analytic review. <em>Psychological Bulletin</em>, 147(5), 477-503.</p>
            
            <p>Mikulincer, M., Shaver, P. R., & Avihou-Kanza, N. (2018). Mediating role of narcissism, vulnerable narcissism, and self-compassion in the relationship between attachment dimensions and psychopathology. <em>Journal of Personality</em>, 86(5), 799-813.</p>
            
            <p>Northwestern Medicine. (2013). <em>How love hormone turns into fear promoter.</em> ScienceDaily. Retrieved from www.sciencedaily.com/releases/2013/07/130722155412.htm</p>
            
            <p>Shapiro, F. (2014). The role of eye movement desensitization and reprocessing (EMDR) therapy in medicine: Addressing the psychological and physical symptoms stemming from adverse life experiences. <em>The Permanente Journal</em>, 18(1), 71-77.</p>
            
            <p>Stinson, F. S., Dawson, D. A., Goldstein, R. B., et al. (2008). Prevalence, correlates, disability, and comorbidity of DSM-IV narcissistic personality disorder: Results from the Wave 2 National Epidemiologic Survey on Alcohol and Related Conditions. <em>Journal of Clinical Psychiatry</em>, 69(7), 1033-1045.</p>
            
            <p>Strutzenberg, C. C., Wiersma-Mosley, J. D., Jozkowski, K. N., & Becnel, J. N. (2017). Love-bombing: A narcissistic approach to relationship formation. <em>Discovery, The Student Journal of Dale Bumpers College of Agricultural, Food and Life Sciences</em>, 18(1), 81-89.</p>
            
            <p>Tager-Shafrir, T., Szepsenwol, O., Dvir, M., & Zamir, O. (2024). The gaslighting relationship exposure inventory: Reliability and validity in two cultures. <em>Journal of Social and Personal Relationships</em>, 41(8), 2134-2155.</p>
            
            <p>van der Kolk, B. (2014). <em>The body keeps the score: Brain, mind, and body in the healing of trauma.</em> New York: Viking.</p>
            
            <p>World Health Organization (WHO). (2013). <em>Guidelines for the management of conditions specifically related to stress.</em> Geneva: Author.</p>
        </div>
    </>
);

export default Post;