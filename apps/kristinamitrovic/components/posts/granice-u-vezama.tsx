import { Callout, ImageWithCaption, HighlightBox, StatsCard } from '@repo/ui/components/BlogComponents';
import React from 'react';

export const meta = {
    slug: 'granice-u-vezama',
    title: 'Zdrave granice: Ključ uspješnih odnosa',
    excerpt: 'Naučite kako postaviti i održavati zdrave granice bez osjećaja krivnje. Praktični vodič za sve stilove privrženosti.',
    date: '2025-05-06',
    category: 'Partnerski odnosi',
    headerImage: 'https://images.unsplash.com/photo-1528543606781-2f6e6857f318?q=80&w=2000&auto=format&fit=crop',
    headerImageAlt: 'Ruke postavljaju granice',
    headerImageCredit: 'Photo by Kat J on Unsplash'
};

const Post = () => (
    <>
        <p className="lead">Postavljanje zdravih granica ključno je za održavanje osobnosti i poštovanja unutar veze. Granice nisu zidovi koji nas odvajaju, već smjernice koje definiraju tko smo i što nam je potrebno.</p>

        <h2>Što su zapravo granice?</h2>

        <p>Granice su nevidljive linije koje označavaju gdje završavamo mi, a počinju drugi. One definiraju što ćemo trpjeti, a što ne, kako želimo da se drugi odnose prema nama, što je naša odgovornost, a što odgovornost drugih, te naše vrijednosti i prioritete. Zamislite granice kao osobni ustav koji vodi vaše odnose s drugim ljudima. Baš kao što fizičke granice države određuju njen teritorij, osobne granice određuju psihološki i emocionalni prostor koji trebate da biste najbolje funkcionirali.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
            <StatsCard number="56%" label="odraslih ima siguran stil privrženosti" />
            <StatsCard number="37%" label="povezanost između emocionalne inteligencije i kvalitete veze" />
            <StatsCard number="50%" label="smanjenje samoubilačkog ponašanja s terapijom" />
            <StatsCard number="87%" label="poboljšanja u odnosima nakon 6 mjeseci" />
        </div>

        <h2>Zašto su granice važne?</h2>

        <p>Bez granica, lako je izgubiti sebe u vezi, preuzeti tuđe probleme i osjećati se iscrpljeno. Istraživanja pokazuju da osobe s jasnim granicama izvještavaju o značajno nižim razinama stresa, dok kršenja granica su povezana s povišenim stresom i emocionalnim iscrpljenjem. Zdrave granice omogućuju nam da očuvamo samopoštovanje i osobnost, smanjimo ogorčenost i ljutnju koja se nakuplja kada stalno popuštamo, stvorimo prostor za zdravu komunikaciju gdje se obje strane osjećaju sigurno, zaštitimo se od emocionalne iscrpljenosti koja dolazi s preuzimanjem tuđih problema, izgradimo obostrano poštovanje u odnosima, te zanimljivo, povećamo bliskost kroz iskrenost - kada jasno komuniciramo svoje potrebe i granice, drugi nas bolje upoznaju.</p>

        <h2>Tipovi granica</h2>

        <p>Znanstvena literatura prepoznaje pet glavnih tipova granica koji su potvrđeni istraživanjima:</p>

        <h3>1. Fizičke granice</h3>
        
        <p>Fizičke granice odnose se na vaš osobni prostor, tijelo i privatnost. One određuju tko vas smije dodirnuti i kako, koliko fizičke blizine trebate u različitim situacijama, te vašu potrebu za privatnošću i osobnim prostorom. Ove granice mogu varirati ovisno o osobi i situaciji - možda volite zagrljaje od bliskih prijatelja, ali preferirate rukovanje s poznanicima. Važno je da imate pravo postaviti različite fizičke granice s različitim ljudima i da se te granice poštuju bez objašnjavanja.</p>

        <h3>2. Emocionalne granice</h3>
        
        <p>Emocionalne granice štite vaše emocionalno blagostanje. One vam pomažu odvojiti svoje emocije od tuđih, što je ključno za održavanje mentalne ravnoteže. S emocionalnim granicama, vi odlučujete s kime dijelite osobne informacije i koliko duboko želite ići u emocionalnu intimnost. Ove granice također vas štite od emocionalne manipulacije i omogućavaju vam da zadržite svoj identitet u odnosima.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=2000&auto=format&fit=crop"
            alt="Osoba meditira na plaži"
            caption="Emocionalne granice pomažu nam održati unutarnji mir"
            credit="Photo by Simon Rae on Unsplash"
        />

        <h3>3. Mentalne granice</h3>
        
        <p>Mentalne granice odnose se na vaše misli, vrijednosti i mišljenja. One uključuju pravo na vlastito mišljenje čak i kada se razlikuje od većine, slobodu da promijenite mišljenje kada dobijete nove informacije, te zaštitu od nametanja tuđih uvjerenja. Zdrave mentalne granice znače da možete slušati tuđa mišljenja s poštovanjem, ali zadržati svoje pravo na neslaganje.</p>

        <h3>4. Vremenske granice</h3>
        
        <p>Vremenske granice određuju kako raspolažete svojim vremenom - koliko vremena posvećujete drugima, pravo na odmor i opuštanje koje nije sebično već nužno za vaše blagostanje, te stavljanje vlastitih potreba na prvo mjesto što ne znači da ste sebični već da razumijete da ne možete dati iz prazne čaše. Istraživanja pokazuju da jasne granice između rada i osobnog života pomažu u upravljanju stresom.</p>

        <h3>5. Materijalne granice</h3>
        
        <p>Materijalne granice odnose se na novac i posjede. One određuju s kim dijelite svoje resurse, kako i pod kojim uvjetima posuđujete stvari ili novac, te financijske granice u vezi koje štite obje strane od iskorištavanja.</p>

        <Callout type="info">
            Granice nisu statične - mogu se mijenjati ovisno o odnosu, situaciji i vašem trenutnom kapacitetu. Ono što je u redu s jednom osobom, možda nije s drugom.
        </Callout>

        <h2>Znakovi nezdravih granica</h2>

        <h3>Preporozne granice</h3>
        
        <p>Osobe s preporoznim granicama često govore &quot;da&quot; kada zapravo žele reći &quot;ne&quot;, što vodi do nakupljanja ogorčenosti i iscrpljenosti. Preuzimaju odgovornost za tuđe emocije, vjerujući da su oni krivi ako je netko tužan ili ljut. Dijele previše osobnih informacija prerano u odnosima, što može odbiti druge ili ih učiniti ranjivima na manipulaciju. Trpe nepoštovanje ili čak zlostavljanje, često opravdavajući tuđe loše ponašanje. Gube se u tuđim problemima do te mjere da zanemaruju vlastite potrebe i obaveze.</p>

        <h3>Prekrute granice</h3>
        
        <p>Na drugom kraju spektra su prekrute granice. Ljudi s prekrutim granicama drže sve na emocionalnoj udaljenosti, što sprječava stvaranje dubokih, značajnih veza. Odbijaju pomoć čak i kada im je očajnički potrebna, jer to vide kao znak slabosti. Imaju malo bliskih odnosa jer ne dopuštaju nikome da se približi. Izbjegavaju bliskost iz straha od povrede ili razočaranja. Ne dijele svoje osjećaje, što druge ostavlja da nagađaju što misle ili osjećaju.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1534330207526-8e81f10ec6fc?q=80&w=2000&auto=format&fit=crop"
            alt="Zid od cigli"
            caption="Prekrute granice mogu nas izolirati od drugih"
            credit="Photo by Sasha Freemind on Unsplash"
        />

        <h2>Kako različiti stilovi privrženosti utječu na granice</h2>

        <p>Znanstvena literatura pruža snažnu potporu za razumijevanje granica kroz teoriju privrženosti. Istraživanja pokazuju kako rana iskustva privrženosti stvaraju unutarnje obrasce koji značajno utječu na sposobnosti postavljanja granica u odrasloj dobi.</p>

        <h3>Anksiozni stil (19% odraslih)</h3>
        
        <p>Osobe s anksioznim stilom često imaju preporozne granice zbog dubokog straha od napuštanja. Ovaj strah vodi do popuštanja u situacijama gdje bi trebalo postaviti čvrstu granicu. Žrtvuju vlastite potrebe za održavanje veze, vjerujući da će partner ostati ako se dovoljno trude. Teško im je reći &quot;ne&quot; jer se boje da će to dovesti do odbacivanja. Istraživanja pokazuju jasnu negativnu povezanost između anksiozne privrženosti i zadovoljstva vezom.</p>

        <Callout type="tip">
            <strong>Za anksiozni stil:</strong> Počnite s malim granicama. Vježbajte govoriti &quot;ne&quot; u situacijama niskog rizika prije nego što se uhvatite u koštac s velikim izazovima.
        </Callout>

        <h3>Izbjegavajući stil (25% odraslih)</h3>
        
        <p>Osobe s izbjegavajućim stilom često imaju prekrute granice kao zaštitu od bliskosti koje se boje. Njihova pretjerana nezavisnost zapravo je obrana od ranjivosti. Odbijaju emocionalnu blizinu čak i kada je žude, jer su naučili da je sigurnije ne ovisiti ni o kome. Istraživanja pokazuju još jaču negativnu povezanost s zadovoljstvom vezom.</p>

        <Callout type="tip">
            <strong>Za izbjegavajući stil:</strong> Vježbajte postupno otvaranje. Podijelite malu ranjivost i primijetite da svijet nije propao.
        </Callout>

        <h3>Siguran stil (56% odraslih)</h3>
        
        <p>Osobe sa sigurnim stilom imaju fleksibilne granice koje prilagođavaju situaciji. Mogu biti čvrsti kada je to potrebno, ali i popustljivi kada situacija to dopušta. Jasno komuniciraju svoje potrebe bez agresivnosti ili pasivnosti. Poštuju i tuđe i vlastite granice, razumijevajući da su obje jednako važne za zdrav odnos.</p>

        <h2>Kako postaviti zdrave granice: Korak po korak</h2>

        <p>Dijalektička bihevioralna terapija (DBT) je vrsta terapije koja pomaže ljudima u regulaciji emocija i odnosima. DEARMAN tehnika iz ove terapije pruža koristan pristup za postavljanje granica:</p>

        <h3>1. Prepoznajte svoje potrebe</h3>

        <p>Prije nego što možete postaviti granicu, morate znati što trebate. Ovo zahtijeva samopromatranje i iskrenost prema sebi. Pitajte se što vas čini neugodnim u određenoj situaciji, što biste voljeli da se promijeni, koje su vaše osnovne potrebe koje nisu zadovoljene, i gdje osjećate da gubite energiju. Često nam je teško prepoznati vlastite potrebe jer smo naučili da su tuđe važnije, ali bez ovog prvog koraka nemoguće je postaviti zdrave granice.</p>

        <h3>2. Komunicirajte jasno i direktno (DEARMAN tehnika)</h3>

        <p><strong>D</strong>escribe - Opišite situaciju objektivno<br/>
        <strong>E</strong>xpress - Izrazite svoje osjećaje i misli<br/>
        <strong>A</strong>ssert - Jasno zatražite što trebate<br/>
        <strong>R</strong>einforce - Objasnite pozitivne posljedice<br/>
        <strong>M</strong>indful - Ostanite fokusirani na cilj<br/>
        <strong>A</strong>ppear confident - Pokažite samopouzdanje<br/>
        <strong>N</strong>egotiate - Budite spremni na kompromis</p>

        <h3>3. Budite dosljedni</h3>

        <p>Granice su učinkovite samo ako ih dosljedno provodite. Ako kažete da ćete nešto učiniti, učinite to. Ne popuštajte zbog krivnje koja se može pojaviti. Zapamtite da učite ljude kako da se odnose prema vama - svaki put kada dopustite da se granica prijeđe bez posljedica, šaljete poruku da vaše granice nisu ozbiljne.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1542338347-4fff3276af78?q=80&w=2000&auto=format&fit=crop"
            alt="Muškarac stoji čvrsto"
            caption="Dosljednost u granicama uči druge da nas poštuju"
            credit="Photo by Priscilla Du Preez on Unsplash"
        />

        <h3>4. Pripremite se na otpor</h3>

        <p>Ljudi koji su navikli na vaše stare obrasce mogu se opirati novim granicama. Mogu se ljutiti ili povrijediti, pokušati manipulaciju krivnjom govoreći stvari poput &quot;Mislio sam da smo prijatelji&quot; ili &quot;Prije ti to nije smetalo&quot;. Mogu testirati vaše granice da vide hoćete li popustiti. Ovaj otpor ne znači da radite nešto krivo - često je znak da su granice bile potrebne.</p>

        <Callout type="warning">
            Otpor ne znači da radite nešto krivo. Često je znak da su granice bile potrebne.
        </Callout>

        <h2>Praktični primjeri postavljanja granica</h2>

        <p>Razmotrimo konkretne situacije i kako postaviti granice u njima. U romantičnoj vezi, ako partner stalno provjerava vaš telefon, možete reći: &quot;Cijenim našu otvorenost, ali trebam privatnost. Moj telefon je moj privatni prostor. Rado ću razgovarati ako imaš zabrinutosti.&quot; Ova granica jasno definira vaš prostor dok istovremeno ostavlja prostor za komunikaciju.</p>

        <p>S prijateljima koji vas stalno zovu s krizama u ponoć, granica može biti: &quot;Brinem za tebe i želim ti pomoći, ali nakon 22h ne mogu razgovarati. Možemo razgovarati sutra tijekom dana.&quot; Ovdje pokazujete da vam je stalo, ali također štitite svoje vrijeme za odmor.</p>

        <p>Na poslu, ako šef stalno daje zadatke izvan radnog vremena, profesionalna granica bi bila: &quot;Mogu raditi na hitnim stvarima tijekom radnog vremena, ali vikendi su mi rezervirani za obitelj. Vratit ću se tome u ponedjeljak.&quot; Ovo pokazuje predanost poslu uz održavanje ravnoteže.</p>

        <p>S obitelji koja se miješa u vaše odluke, granica može biti: &quot;Cijenim vašu brigu, ali ovo je moja odluka. Javit ću vam što sam odlučio/la.&quot; Time prizanjete njihovu brigu ali zadržavate samostalnost.</p>

        <h2>Česte prepreke u postavljanju granica</h2>

        <h3>1. Osjećaj krivnje</h3>

        <p>Mnogi osjećaju krivnju kada postave granicu, kao da su sebični. Ovaj osjećaj često dolazi iz djetinjstva gdje smo naučili da su tuđe potrebe važnije od naših. Važno je razumjeti da postavljanje granica nije sebično - to je samopoštovanje. Ne možete dati iz prazne čaše. Kada se brinete za sebe, imate više energije i ljubavi za druge.</p>

        <h3>2. Strah od sukoba</h3>

        <p>Strah da će granice dovesti do sukoba često nas sprječava da ih postavimo. Međutim, sukob može biti prilika za rast u odnosu. Zdrav sukob, gdje obje strane poštuju jedna drugu, zapravo jača odnose jer vodi do boljeg razumijevanja. S druge strane, izbjegavanje sukoba vodi do nakupljanja ogorčenosti koja može eksplodirati na neočekivane načine.</p>

        <h3>3. Nedostatak prakse</h3>

        <p>Ako niste odrasli s granicama, teško ih je naučiti kao odrasla osoba. Počnite malo s ljudima s kojima se osjećate sigurno. Vježbajte postavljanje malih granica prije velikih. Budite strpljivi sa sobom - ova vještina zahtijeva vrijeme za razvoj. Istraživanja pokazuju da su granice vještine koje se mogu naučiti s izmjerivim poboljšanjima kroz strukturirane intervencije.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1613493780903-83fca7bb9c17?q=80&w=2000&auto=format&fit=crop"
            alt="Tim ljudi radi zajedno"
            caption="Vježbanje granica s podržavajućim ljudima olakšava proces"
            credit="Photo by Slavcho Malezan on Unsplash"
        />

        <h2>Održavanje granica dugoročno</h2>

        <h3>Redovita provjera</h3>

        <p>Granice trebaju održavanje kao i sve drugo u životu. Mjesečno provjerite jesu li vaše granice još uvijek relevantne za vašu trenutnu životnu situaciju. Prilagodite ih prema potrebi - možda ste postavili prestroge granice u jednom području ili preblage u drugom. Budite fleksibilni kada situacija to zahtijeva, ali ne popustljivi kada je u pitanju vaša dobrobit.</p>

        <h3>Samobriga kao podrška</h3>

        <p>Granice su lakše održavati kada se brinete za sebe. Redovita meditacija ili vježbe svjesnosti pomažu vam ostati povezani sa svojim potrebama. Fizička aktivnost oslobađa napetost i jača osjećaj moći. Dovoljno sna čini vas manje reaktivnima i sposobnijima za jasnu komunikaciju. Vrijeme provedeno sami pomaže vam razjasniti što je zaista važno.</p>

        <h3>Podrška zajednice</h3>

        <p>Okružite se ljudima koji poštuju granice. Potražite prijatelje koji razumiju važnost osobnog prostora i autonomije. Razmislite o terapiji ili grupi podrške gdje možete vježbati postavljanje granica u sigurnom okruženju. Učite od drugih koji imaju zdrave granice - promatrajte kako to rade i što možete primijeniti u svom životu.</p>

        <h2>Kada granice nisu dovoljne</h2>

        <p>Ponekad, unatoč našim najboljim naporima, granice se ne poštuju. Ako netko konstantno prelazi vaše granice unatoč jasnoj komunikaciji, možda je vrijeme za profesionalnu pomoć koja može pružiti dodatne strategije, preispitivanje odnosa i njegove održivosti, ili u ekstremnim slučajevima zlostavljanja ili uznemiravanja, prekid kontakta radi vlastite sigurnosti.</p>

        <Callout type="warning">
            Ako netko konstantno prelazi vaše granice unatoč jasnoj komunikaciji, možda je vrijeme za profesionalnu pomoć, preispitivanje odnosa, ili u ekstremnim slučajevima, prekid kontakta.
        </Callout>

        <h2>Granice i intimnost</h2>

        <p>Zanimljivo je da granice zapravo povećavaju bliskost u odnosima. Znanstvena literatura pokazuje da jasne granice omogućavaju iskrenost - drugi znaju tko ste zaista. Granice stvaraju sigurnost potrebnu za ranjivost - kada znate da će vaše granice biti poštovane, lakše se otvarate. One grade povjerenje pokazujući da možete zaštititi sebe i druge. Konačno, sprječavaju ogorčenost koja se nakuplja kada stalno popuštamo, omogućavajući nam da ostanemo otvorenog srca.</p>

        <HighlightBox title="Formula za bliskost">
            Jasne granice + Poštovanje + Komunikacija = Dublja bliskost
        </HighlightBox>

        <h2>Vježbe za jačanje granica</h2>

        <h3>1. Dnevnik granica</h3>
        
        <p>Svaki dan zapišite jednu situaciju gdje ste trebali postaviti granicu. Opišite kako ste se osjećali u tom trenutku - možda neugodno, ljuto ili iscrpljeno. Zapišite što biste voljeli reći da ste imali hrabrosti. Zatim formulirajte kako biste to mogli reći sljedeći put na način koji je jasan ali ne agresivan. Ovaj proces pomaže vam pripremiti se za buduće situacije.</p>

        <h3>2. Vježba ogledala</h3>
        
        <p>Vježbajte postavljanje granica pred ogledalom. Govorite jasno i direktno, održavajte kontakt očima sa sobom. Stojte ili sjedite uspravno s otvorenim stavom tijela. Koristite miran, čvrst ton - ne agresivan, ali ne ni izvinjavanje. Ova vježba gradi mišićnu memoriju za stvarne situacije.</p>

        <h3>3. Scenariji igranja uloga</h3>
        
        <p>S prijateljem ili terapeutom vježbajte različite načine postavljanja iste granice. Istražite kako različite formulacije utječu na poruku. Vježbajte odgovore na otpor - što ćete reći ako netko pokuša manipulaciju krivnjom. Radite na održavanju granica pod pritiskom. Ova praksa u sigurnom okruženju priprema vas za stvarne situacije.</p>

        <h2>Granice kao čin ljubavi</h2>

        <p>Važno je razumjeti da su granice čin ljubavi - prema sebi i prema drugima. Kada postavite zdrave granice, pokazujete poštovanje prema sebi. Također omogućavate drugima da vas bolje upoznaju i vole autentičnog vas, ne verziju koja stalno popušta i gubi sebe. Granice nisu o odbijanju drugih, već o stvaranju prostora gdje mogu cvjetati zdrave, balansirane veze.</p>

        <p>U odnosima gdje se granice poštuju, obje strane se osjećaju sigurno biti ono što jesu. Nema potrebe za pretvaranjem ili žrtvovanjem vlastitih potreba. Ova autentičnost vodi do dubljih, značajnijih veza gdje ljubav može slobodno teći bez straha od iskorištavanja ili gubitka identiteta.</p>

        <h2>Zaključak</h2>

        <p>Zdrave granice su temelj svakog uspješnog odnosa, uključujući onaj koji imate sami sa sobom. Znanstvena literatura pruža robusne dokaze o važnosti granica u odnosima, s veličinama efekata od r = .20 do .45 što ukazuje da su granice među najjačim prediktorima ishoda odnosa. One nisu znak sebičnosti ili nedostatka ljubavi - naprotiv, omogućuju nam da volimo iz mjesta snage i autentičnosti.</p>

        <Callout type="success">
            Zapamtite: Svaka granica koju postavite je čin ljubavi prema sebi. A kada volite sebe, možete istinski voljeti i druge.
        </Callout>

        <p>Postavljanje granica je vještina koju možete naučiti u bilo kojoj dobi. Dokazane terapije pokazuju da su granice vještine koje se mogu naučiti s mjerljivim poboljšanjima kroz strukturirane intervencije. Svaki mali korak prema jasnijem definiranju svojih potreba i granica je pobjeda. Budite strpljivi sa sobom na ovom putu - transformacija dolazi s praksom i vremenom. Vaše buduće ja će vam biti zahvalno za svaku granicu koju danas postavite.</p>

        <h2>Što možete učiniti ovaj tjedan</h2>

        <p>Ovaj tjedan, identificirajte jednu malu granicu koju trebate postaviti. Možda je to s kolegom koji stalno prekida vaš rad, prijateljem koji uvijek kasni, ili članom obitelji koji daje neželjene savjete. Napišite točno što ćete reći - koristite DEARMAN tehniku iz DBT-a. Vježbajte izgovaranje te granice naglas barem 5 puta. Zatim, odaberite pravi trenutak i postavite tu granicu. Zapamtite - ne morate objasnjavati ili opravdavati svoju granicu. Nakon što je postavite, nagradite se nečim što volite. Ova mala pobjeda je veliki korak prema zdravijim odnosima.</p>

        <h2>Reference</h2>

        <ol>
            <li>Ainsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S. (1978). <em>Patterns of attachment: A psychological study of the strange situation</em>. Lawrence Erlbaum.</li>
            
            <li>Boss, P. (1984). Family boundary ambiguity: A new variable in family stress theory. <em>Family Process</em>, 23(4), 535-546.</li>
            
            <li>Bowen, M. (1978). <em>Family therapy in clinical practice</em>. Jason Aronson.</li>
            
            <li>Bowlby, J. (1969). <em>Attachment and loss: Vol. 1. Attachment</em>. Basic Books.</li>
            
            <li>Brown, B. (2018). <em>Dare to Lead: Brave Work. Tough Conversations. Whole Hearts.</em> Random House.</li>
            
            <li>Butler, A. C., Chapman, J. E., Forman, E. M., & Beck, A. T. (2006). The empirical status of cognitive-behavioral therapy: A review of meta-analyses. <em>Clinical Psychology Review</em>, 26(1), 17-31.</li>
            
            <li>Cloud, H., & Townsend, J. (1992). <em>Boundaries: When to Say Yes, How to Say No to Take Control of Your Life</em>. Zondervan.</li>
            
            <li>Hazan, C., & Shaver, P. (1987). Romantic love conceptualized as an attachment process. <em>Journal of Personality and Social Psychology</em>, 52(3), 511-524.</li>
            
            <li>Linehan, M. M. (2014). <em>DBT Skills Training Manual</em> (2nd ed.). Guilford Press.</li>
            
            <li>Minuchin, S. (1974). <em>Families and family therapy</em>. Harvard University Press.</li>
            
            <li>Pietromonaco, P. R., & Overall, N. C. (2022). Attachment insecurity and relationship satisfaction: A meta-analysis of actor and partner associations. <em>Personality and Individual Differences</em>, 194, 111663.</li>
            
            <li>Speed, B. C., Goldstein, B. L., & Goldfried, M. R. (2018). Assertiveness training: A forgotten evidence-based treatment. <em>Clinical Psychology: Science and Practice</em>, 25(1), e12216.</li>
            
            <li>West, A. L., Naeimi, H., Di Bartolomeo, A. A., Yampolsky, M., & Muise, A. (2024). Growing together through our cultural differences: Self-expansion in intercultural romantic relationships. <em>Personality and Social Psychology Bulletin</em>, 50(1), 45-62.</li>
            
            <li>Zur, O. (Ed.). (2007). <em>Boundaries in psychotherapy: Ethical and clinical explorations</em>. American Psychological Association.</li>
        </ol>
    </>
);

export default Post;