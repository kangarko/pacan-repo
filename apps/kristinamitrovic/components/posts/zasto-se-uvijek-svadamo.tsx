import { Callout, ImageWithCaption, HighlightBox, StatsCard } from '@repo/ui/components/BlogComponents';
import React from 'react';

export const meta = {
    slug: 'zasto-se-uvijek-svadamo',
    title: 'Zašto se uvijek svađamo oko istih stvari?',
    excerpt: 'Otkrijte zašto se iste svađe ponavljaju u vašoj vezi i kako prekinuti ovaj iscrpljujući ciklus.',
    date: '2025-01-20',
    category: 'Partnerski odnosi',
    headerImage: 'https://images.unsplash.com/photo-1656169242436-52b137ff3fc7?q=80&w=2000&auto=format&fit=crop',
    headerImageAlt: 'Par u svađi',
    headerImageCredit: 'Photo by Afif Ramdhasuma on Unsplash'
};

const Post = () => (
    <>
        <p className="lead">Svaka veza ima svoje izazove, ali kada se iste svađe ponavljaju iznova i iznova, to može biti znak dubljih obrazaca koji upravljaju vašim odnosom. Ako ste umorni od istih rasprava koje nikamo ne vode, niste sami.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
            <StatsCard number="69%" label="parova se svađa oko istih tema" />
            <StatsCard number="5-7" label="glavnih tema svađa" />
            <StatsCard number="3x" label="češće kod dugih veza" />
            <StatsCard number="45 min" label="prosječno trajanje svađe" />
        </div>

        <h2>Poznati scenarij koji se ponavlja</h2>

        <p>Marija i Petar su u vezi već pet godina. Svaki put kada Petar kasni s posla bez javljanja, Marija osjeća val ljutnje koji je preplavi. &quot;Opet isto!&quot;, viče dok on ulazi kroz vrata. &quot;Nikad me ne poštuješ dovoljno da mi se javiš!&quot; Petar, umoran nakon dugog dana, uzvraća: &quot;Uvijek pretjeruješ! Kasnio sam samo pola sata!&quot; I tako, ista svađa koju su imali stotinu puta prije počinje iznova.</p>

        <p>Zvuči li vam poznato? Možda se kod vas svađe vrte oko novca - jedan štedi, drugi troši. Ili oko kućanskih poslova - jedan radi sve, drugi &quot;ne vidi&quot; što treba napraviti. Možda je u pitanju vrijeme provedeno s prijateljima, način odgajanja djece, ili intimnost. Teme mogu biti različite, ali obrazac je isti - iste riječi, iste optužbe, isti završetak bez rješenja.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1636436277970-04a25f83568c?q=80&w=2000&auto=format&fit=crop"
            alt="Žena sjedi frustrirano"
            caption="Ponavljajuće svađe mogu biti emocionalno iscrpljujuće"
            credit="Photo by Anh Nguyen on Unsplash"
        />

        <h2>Zašto se ovo događa?</h2>

        <p>Kada se iste svađe ponavljaju, to obično nije zbog površinske teme svađe. Petar i Marija se zapravo ne svađaju oko kašnjenja - oni se svađaju oko onoga što to kašnjenje predstavlja za svakoga od njih. Za Mariju, kada Petar ne javlja da kasni, to aktivira duboki osjećaj da nije važna, da je zanemaren njen osjećaj sigurnosti i povezanosti. Ovaj osjećaj možda vuče korijene iz djetinjstva kada je njen otac često bio odsutan bez objašnjenja, ostavljajući je i majku u neizvjesnosti.</p>

        <p>Za Petra, Marijine reakcije aktiviraju njegov osjećaj da nikad nije dovoljno dobar, da što god napravi bit će krivo. Možda je odrastao s kritičnom majkom koja je stalno nalazila mane, pa sada svaku Marijinu primjedbu doživljava kao napad na cijelu svoju osobnost.</p>

        <h3>Emocionalni okidači iz prošlosti</h3>

        <p>Naš mozak je fascinantan organ koji pokušava zaštititi nas koristeći iskustva iz prošlosti. Kada se nešto u sadašnjosti podsjeća na bolno iskustvo iz prošlosti, mozak aktivira uzbunu - &quot;Opasnost! Ovo smo već vidjeli!&quot; Problem je što mozak ne razlikuje uvijek sadašnjost od prošlosti. Tako Marija ne reagira samo na Petrovo kašnjenje danas, već na sva vremena kada se osjećala zanemareno ili nevažno kroz život.</p>

        <Callout type="info">
            Ponavljajuće svađe su poput kazališne predstave - isti glumci, isti tekst, ista scena. Dok ne promijenimo priču, predstava se nastavlja.
        </Callout>

        <h2>Različiti stilovi komunikacije</h2>

        <p>Način na koji smo naučili komunicirati u obitelji iz koje dolazimo snažno utječe na naše svađe danas. Neki od nas dolaze iz obitelji gdje se konflikti rješavaju glasno i otvoreno - vikanje je bilo normalno, ali nakon svađe svi su se pomirili. Drugi dolaze iz obitelji gdje se o problemima nije govorilo - sve se gurnulo pod tepih dok jednog dana nije eksplodiralo. Treći su možda odrasli u kaosu gdje su granice između svađe i ljubavi bile nejasne.</p>

        <p>Kada se u vezi nađu ljudi s različitim stilovima, nastaje dodatni problem. On se povlači jer je tako naučio izbjeći konflikt, ona pojačava ton jer je naučila da se tako privlači pažnja. On misli da time pokazuje zrelost, ona misli da ju ignorira. Ona misli da pokazuje da joj je stalo, on misli da ga napada.</p>

        <h3>Uloge koje preuzimamo</h3>

        <p>U ponavljajućim svađama često preuzimamo predvidljive uloge. Jedan partner postaje &quot;progonitelj&quot; - onaj koji pokreće temu, traži promjenu, kritizira. Drugi postaje &quot;povučeni&quot; - šuti, izbjegava, umanjuje problem. Ponekad se uloge mijenjaju ovisno o temi, ali odnos ostaje isti. Progonitelj se osjeća zanemaren i iznerviran, povučeni se osjeća napadnut i prepljavljen.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1591084728795-1149f32d9866?q=80&w=2000&auto=format&fit=crop"
            alt="Ruke koje se dodiruju"
            caption="Razumijevanje je prvi korak prema prekidanju ciklusa"
            credit="Photo by Womanizer Toys on Unsplash"
        />

        <h2>Skrivene potrebe iza svađa</h2>

        <p>Svaka ponavljajuća svađa krije dublju potrebu koja nije zadovoljena. Možda je to potreba za sigurnošću - znati da ste važni i da se na partnera možete osloniti. Možda je potreba za samostalnošću - imati svoj prostor i slobodu bez osjećaja krivnje. Često je u pitanju potreba za poštovanjem - osjećati da vas partner vidi i cijeni takve kakvi jeste.</p>

        <p>Problem nastaje kada pokušavamo zadovoljiti te potrebe na načine koji zapravo rade suprotno. Marija želi sigurnost, ali svojim napadima tjera Petra dalje. Petar želi mir, ali svojim povlačenjem pojačava Marijinu anksioznost. Oboje pokušavaju zaštititi sebe, ali pritom rade upravo ono što pogoršava situaciju.</p>

        <h2>Fizička reakcija tijela</h2>

        <p>Kada uđemo u poznatu svađu, naše tijelo reagira automatski. Puls se ubrzava, mišići se napežu, disanje postaje plitko. Ovo je reakcija &quot;bori se ili bježi&quot; koja nam je pomogla preživjeti kroz povijest, ali u suvremenim vezama često stvara više problema nego što ih rješava. U ovom stanju, dio mozga odgovoran za razumno razmišljanje se doslovno &quot;isključuje&quot;. Zato u žaru svađe kažemo stvari koje ne mislimo i donosimo odluke koje kasnije žalimo.</p>

        <HighlightBox title="Znakovi da ste u emocionalnoj oluji">
            <ul>
                <li>Srce ubrzano kuca</li>
                <li>Osjećate vrućinu u licu ili tijelu</li>
                <li>Teško vam je jasno razmišljati</li>
                <li>Imate potrebu vikati ili pobjeći</li>
                <li>Ponavljate iste rečenice iznova</li>
                <li>Ne slušate što partner govori</li>
            </ul>
        </HighlightBox>

        <h2>Kulturni kontekst</h2>

        <p>Na Balkanu često nosimo dodatni teret kulturnih očekivanja o tome kako bi veze trebale izgledati. &quot;Muž mora biti glava kuće&quot;, &quot;Žena mora sve trpjeti za mir u kući&quot;, &quot;Djeca ne smiju vidjeti da se roditelji svađaju&quot; - ove izreke oblikuju naše ponašanje i često stvaraju dodatne konflikte. Možda se svađate jer pokušavate ispuniti uloge koje vam ne odgovaraju, ili jer imate različita očekivanja o tome što znači te uloge.</p>

        <p>Generacijske razlike također igraju ulogu. Možda ste odrasli gledajući roditelje koji su imali tradicionalnu podjelu uloga, ali vi i partner pokušavate stvoriti ravnopravniji odnos. Ova tranzicija nije laka i često dovodi do sukoba između onoga što mislite da &quot;trebate&quot; raditi i onoga što zaista želite.</p>

        <h2>Prekidanje ciklusa</h2>

        <p>Dobra vijest je da ciklus ponavljajućih svađa može biti prekinut. Prvi korak je prepoznavanje da se nalazite u njemu. Kada osjetite da kreće poznata svađa, zaustavite se. Doslovno. Napravite pauzu. Recite partneru: &quot;Osjećam da krećemo u našu uobičajenu svađu. Možemo li zastati na trenutak?&quot;</p>

        <p>Ova pauza omogućava vašem tijelu da se smiri i mozgu da se ponovno uključi. Tijekom pauze, pitajte se: &quot;Što zapravo trebam u ovom trenutku? Što je moja dublja potreba?&quot; Možda ćete otkriti da iza ljutnje stoji strah, iza kritike stoji bol, iza povlačenja stoji preplavljenost.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1542338347-4fff3276af78?q=80&w=2000&auto=format&fit=crop"
            alt="Par razgovara mirno"
            caption="Mirna komunikacija omogućava razumijevanje"
            credit="Photo by Etienne Boulanger on Unsplash"
        />

        <h3>Nova pravila igre</h3>

        <p>Umjesto da ulazite u istu svađu, pokušajte stvoriti nova pravila. Dogovorite se unaprijed kako ćete postupati kada osjetite da kreće poznati obrazac. Možda ćete imati kodnu riječ koja signalizira &quot;trebamo pauzu&quot;. Možda ćete se dogovoriti da svaki ima 5 minuta da izrazi svoje osjećaje bez prekidanja. Možda ćete pisati svoje osjećaje prije nego što ih izgovorite.</p>

        <p>Važno je da ova pravila stvorite zajedno, u mirnom trenutku, a ne usred svađe. Razgovarajte o tome što svakome od vas pomaže da se smiri. Nekome treba fizički prostor, nekome zagrljaj. Nekome pomaže šetnja, nekome duboko disanje. Nema univerzalnog rješenja - važno je pronaći ono što funkcionira za vas kao par.</p>

        <h2>Gledanje ispod površine</h2>

        <p>Sljedeći put kada krenete u poznatu svađu, pokušajte vidjeti što se krije ispod. Umjesto da se usredotočite na to tko je u pravu, pokušajte razumjeti što svaki od vas osjeća. &quot;Vidim da si ljuta što kasnim. Možeš li mi reći kako se osjećaš kada ne javim?&quot; ili &quot;Čini mi se da se povlačiš kada pokrenem ovu temu. Možeš li mi pomoći razumjeti što se događa s tobom?&quot;</p>

        <p>Ovaj pristup zahtijeva hrabrost - lakše je ostati na površini i svađati se oko konkretnih stvari nego zaroniti u emocionalne dubine. Ali samo kada razumijemo što se zaista događa, možemo početi mijenjati obrazac.</p>

        <Callout type="success">
            Zapamtite: Partner nije neprijatelj. Vi ste tim koji zajedno pokušava riješiti problem, a ne protivnici u ringu.
        </Callout>

        <h2>Prihvaćanje nesavršenosti</h2>

        <p>Nijedna veza nije savršena i svađe su normalan dio svakog odnosa. Cilj nije potpuno ukloniti sukobe, već naučiti kako ih rješavati na način koji jača vezu umjesto da je slabi. Svaka svađa je prilika za bolje upoznavanje - sebe i partnera. Kada naučite vidjeti svađe kao prilike za rast umjesto kao prijetnje vezi, mijenja se cijeli odnos.</p>

        <p>Također je važno prihvatiti da promjena neće doći preko noći. Obrasci koje ste gradili godinama neće nestati nakon jednog razgovora. Bit će trenutaka kada ćete pasti u stare navike. To je normalno i dio procesa. Važno je da ne odustanete i da svaki mali napredak proslavite.</p>

        <h2>Kada potražiti pomoć</h2>

        <p>Ponekad, unatoč najboljim namjerama, ne možemo sami prekinuti ciklus. To ne znači da ste neuspješni ili da je vaša veza osuđena. To samo znači da bi vam koristila pomoć nepristrane osobe koja može vidjeti obrasce koje vi ne vidite. Terapeut za parove može vam pomoći prepoznati skrivene obrasce i naučiti vas novim načinima komunikacije.</p>

        <p>Znak da trebate stručnu pomoć je ako se svađe pretvaraju u vrijeđanje, ako jedan ili oba partnera prijete prekidom veze tijekom svađa, ako svađe postaju fizičke, ili ako osjećate da gubite sebe u pokušajima da izbjegnete konflikte. Također, ako primijetite da svađe utječu na vašu djecu, posao ili zdravlje, vrijeme je da potražite podršku.</p>

        <h2>Što možete učiniti ovaj tjedan</h2>

        <p>Ovaj tjedan, zadajte si zadatak da prepoznate početak vaše tipične svađe prije nego što se pojača. Kada osjetite poznate znakove - možda napetost u ramenima, poznatu rečenicu koju partner izgovara, ili osjećaj &quot;evo opet&quot; - zaustavite se. Duboko udahnite tri puta. Zatim recite partneru: &quot;Mislim da krećemo u našu uobičajenu svađu o [tema]. Možemo li pokušati drugačije ovaj put?&quot; Predložite da svatko za sebe napiše što zapravo osjeća i što mu je potrebno, pa da tek onda razgovarate. Ova mala promjena može biti početak prekidanja ciklusa koji vas iscrpljuje. Zapamtite, nije važno da bude savršeno - važno je da pokušate nešto novo.</p>

        <h2>Reference</h2>

        <ol className="references">
            <li>Gottman, J. M., & Silver, N. (2015). The seven principles for making marriage work. Harmony Books.</li>
            <li>Johnson, S. M. (2019). Attachment theory in practice: Emotionally focused therapy (EFT) with individuals, couples, and families. Guilford Press.</li>
            <li>Tatkin, S. (2016). Wired for love: How understanding your partner&apos;s brain and attachment style can help you defuse conflict and build a secure relationship. New Harbinger Publications.</li>
            <li>Perel, E. (2018). The state of affairs: Rethinking infidelity. Harper Paperbacks.</li>
            <li>Hendrix, H., & Hunt, H. L. (2019). Getting the love you want: A guide for couples. St. Martin&apos;s Griffin.</li>
        </ol>
    </>
);

export default Post;