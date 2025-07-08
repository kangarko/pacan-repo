import { Callout, ImageWithCaption, HighlightBox, StatsCard } from '@repo/ui/components/BlogComponents';
import React from 'react';

export const meta = {
    slug: 'digitalni-svijet-mijenja-veze',
    title: 'Kako digitalni svijet mijenja naše veze',
    excerpt: 'Razumijevanje kako stilovi privrženosti oblikuju naše digitalno ponašanje u vezama i kako tehnologija mijenja način na koji volimo.',
    date: '2025-06-02',
    category: 'Moderne veze',
    headerImage: 'https://images.unsplash.com/photo-1503444200347-fa86187a2797?q=80&w=2000&auto=format&fit=crop',
    headerImageAlt: 'Dijete koristi telefon',
    headerImageCredit: 'Photo by Ludovic Toinel on Unsplash'
};

const Post = () => (
    <>
        <p className="lead">Naši stilovi privrženosti ne manifestiraju se samo u fizičkim interakcijama - oni duboko oblikuju kako koristimo tehnologiju u vezama. Od stalnog provjeravanja poruka do ghostinga, digitalni svijet pojačava naše najdublje strahove i želje u ljubavi.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
            <StatsCard number="34%" label="provjerava partnerov telefon bez dozvole" />
            <StatsCard number="53%" label="provjerava profile bivših na društvenim mrežama" />
            <StatsCard number="20-25%" label="doživjelo ghosting" />
            <StatsCard number="2.5 sata" label="dnevno na društvenim mrežama" />
        </div>

        <h2>Anksiozna privrženost u digitalnom dobu</h2>

        <p>Marija (32) se budi usred noći i prva stvar koju radi je provjeravanje WhatsAppa. &quot;Zadnje viđen u 2:37.&quot; Srce joj ubrzava. Što je radio tako kasno? S kim je razgovarao? Zašto joj nije odgovorio na poruku od 22h? Sljedećih sat vremena provodi pregledavajući njegov Instagram, tražeći znakove - nove pratitelje, lajkove na tuđim fotografijama, bilo što što bi objasnilo ovu pojavu &quot;2:37&quot;.</p>

        <p>Za osobe s anksioznim stilom privrženosti, digitalni svijet je istovremeno blagoslov i prokletstvo. S jedne strane, omogućava stalni kontakt s partnerom. S druge, stvara beskonačne mogućnosti za praćenje, analizu i zabrinutost. Svaki &quot;viđen&quot; bez odgovora postaje drama. Svaki novi pratitelj je potencijalna prijetnja.</p>

        <h3>Digitalni okidači anksioznosti</h3>

        <p>Tehnologija stvara nove okidače koje prije nismo imali. Plava kvačica koja pokazuje da je poruka pročitana ali ne i odgovorena može pokrenuti spiralu anksioznih misli. Status &quot;aktivan&quot; koji pokazuje da je partner budan ali vam se ne javlja. Priča na Instagramu s mjesta gdje nije rekao da ide. Svaki od ovih trenutaka aktivira stari strah: &quot;Nisam dovoljno važan/važna.&quot;</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=2000&auto=format&fit=crop"
            alt="Osoba anksiozno gleda telefon"
            caption="Digitalne platforme mogu pojačati anksioznost u vezama"
            credit="Photo by Romain V on Unsplash"
        />

        <Callout type="info">
            Istraživanja pokazuju da anksiozno privržene osobe pokazuju značajno više digitalnog nadzora partnera i veću razinu ljubomore povezane s društvenim mrežama u odnosu na sigurno privržene osobe.
        </Callout>

        <h2>Izbjegavajuća privrženost i digitalne barijere</h2>

        <p>Petar (38) voli svoju djevojku Anu, ali način na koji koristi tehnologiju govori drugu priču. Odgovara na poruke nakon nekoliko sati ili dana. Njegov Instagram je prazan od njihovih zajedničkih fotografija. Kada Ana pošalje emotivnu poruku, on odgovori s emotivnom slikicom. Za njega, digitalna komunikacija je savršen način održavanja emocionalne udaljenosti koju treba.</p>

        <p>Osobe s izbjegavajućim stilom često koriste tehnologiju kao štit. E-mail umjesto poziva. Poruka umjesto razgovora licem u lice. Kratki odgovori umjesto elaboriranih. Svaki digitalni alat postaje način održavanja sigurne udaljenosti od intimnosti.</p>

        <h3>Ghosting - kompleksniji nego što mislimo</h3>

        <p>Fenomen ghostinga - potpunog prekida komunikacije bez objašnjenja (kad netko jednostavno &quot;nestane&quot; iz vašeg života bez ikakvog upozorenja) - zapravo je kompleksniji nego što se često prikazuje. Istraživanja pokazuju da anksiozno privržene osobe češće budu žrtve ghostinga, a ne počinitelji. Zanimljivo, nijedan stil privrženosti ne predviđa pouzdano tko će ghostirati drugoga - umjesto toga, vjerovanja o sudbinskoj prirodi veza pokazuju se kao bolji prediktor.</p>

        <HighlightBox title="Kako različiti stilovi koriste tehnologiju">
            <div className="grid gap-3">
                <div><strong>Anksiozni:</strong> Česte poruke, stalno praćenje, brzi odgovori, veća sklonost problematičnoj uporabi</div>
                <div><strong>Izbjegavajući:</strong> Spori odgovori, kratke poruke, malo dijeljenja, niža ukupna uporaba</div>
                <div><strong>Sigurni:</strong> Balansirana komunikacija, jasne granice, koriste tehnologiju za povezivanje</div>
                <div><strong>Dezorganizirani:</strong> Nepredvidljivo, od bombardiranja do tišine</div>
            </div>
        </HighlightBox>

        <h2>Dating aplikacije i paradoks izbora</h2>

        <p>Moderna ljubav često počinje listanjem profila. Tinder, Bumble, Badoo - ove aplikacije su promijenile način na koji upoznajemo partnere. Ali način na koji ih koristimo duboko ovisi o našem stilu privrženosti.</p>

        <p>Anksiozni tipovi često padnu u zamku &quot;jednog pravog&quot;. Čim se spoje s nekim tko im se sviđa, fokusiraju svu pažnju na tu osobu, prestaju listati profile, i počinju graditi fantazije o budućnosti prije prvog sastanka. Kada ta osoba ne odgovori dovoljno brzo ili otkaže dejt, doživljavaju to kao veliko odbacivanje. Istraživanja pokazuju da anksiozno privržene osobe više koriste aplikacije za upoznavanje, ali paradoksalno, manje vjerojatno će se stvarno sastati s osobama s kojima su se spojili.</p>

        <p>Izbjegavajući tipovi pokazuju mješovite obrasce - neki koriste aplikacije jednako ili čak više od drugih, ali obično iz drugih razloga poput putovanja, a ne zabave ili traženja veze. Održavaju površinske razgovore s više osoba istovremeno, nikada ne dopuštajući da bilo što postane ozbiljno.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1643639779508-4c60952c058c?q=80&w=2000&auto=format&fit=crop"
            alt="Dating aplikacija na telefonu"
            caption="Dating aplikacije mijenjaju način kako upoznajemo partnere"
            credit="Photo by Nik on Unsplash"
        />

        <h2>Društvene mreže kao bojno polje</h2>

        <p>Facebook, Instagram, TikTok - ove platforme nisu samo mjesta za dijeljenje fotografija. Za parove, one su često bojno polje gdje se bore bitke oko statusa veze, zajedničkih fotografija, i javnog pokazivanja ljubavi.</p>

        <p>Marina se osjeća povrijeđeno što njen dečko Luka nikad ne objavljuje njihove fotografije. Za nju, to je znak da se stidi njihove veze. Za Luku, koji ima izbjegavajući stil, to je način čuvanja privatnosti. &quot;Zašto svi moraju znati naše?&quot; pita se on. Ovaj sukob nije o fotografijama - to je sukob različitih potreba za blizinom i samostalnošću.</p>

        <h3>Uspoređivanje s &quot;savršenim&quot; parovima</h3>

        <p>Društvene mreže pokazuju samo najbolje trenutke. Vidimo savršene godišnjice, romantična putovanja, sretne obitelji. Za anksiozno privržene osobe, ovo konstantno uspoređivanje može biti bolno. &quot;Zašto mi nemamo takve fotografije? Zašto on ne piše takve statuse o meni?&quot; Zaboravljaju da iza svake savršene objave stoje sati običnog života koji se ne objavljuje.</p>

        <Callout type="warning">
            Sveobuhvatne analize istraživanja pokazuju da pretjerana upotreba društvenih mreža negativno utječe na psihološko blagostanje i životno zadovoljstvo, posebno kod osoba s nesigurnim stilovima privrženosti.
        </Callout>

        <h2>WhatsApp - novo bojište za kontrolu</h2>

        <p>Plava kvačica. Status aktivnosti. Tipka... Ovi mali indikatori postali su glavni izvor anksioznosti u modernim vezama. Ana osvježava razgovor svakih nekoliko minuta čekajući da Marko počne tipkati odgovor. Vidjela je da je pročitao njenu poruku prije 45 minuta. Zašto ne odgovara?</p>

        <p>Za anksiozne tipove, ove funkcije su kao droga. Omogućavaju im da prate svaki partnerov pokret online. Ali ta moć dolazi s cijenom - konstantna anksioznost i opsesivno praćenje. Neki parovi isključuju ove funkcije upravo da bi smanjili pritisak.</p>

        <h2>Digitalna ljubomora</h2>

        <p>Nikada prije nije bilo lakše biti ljubomoran. Možete vidjeti koga partner prati, čije fotografije lajka, s kim se dopisuje. Ova transparentnost može biti zdrava, ali za nesigurno privržene osobe često postaje izvor konstantne patnje.</p>

        <p>Jelena priznaje: &quot;Provodim sate pregledavajući Instagram njegovog bivše. Uspoređujem sebe s njom. Gledam lajka li još njene fotografije. Znam da je to bolesno, ali ne mogu prestati.&quot; Ovo digitalno detektiviranje ne donosi mir - samo pojačava nesigurnost. Istraživanja potvrđuju da anksiozna privrženost značajno predviđa digitalnu ljubomoru i nadzor partnera.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1622162092793-6ac0784c27cd?q=80&w=2000&auto=format&fit=crop"
            alt="Osoba drži telefon u mraku"
            caption="Digitalna ljubomora može postati opsesivna"
            credit="Photo by Madrona Rose on Unsplash"
        />

        <h2>Pozitivna strana: Tehnologija koja zbližava</h2>

        <p>Ali nije sve crno. Za parove koji su naučili koristiti tehnologiju mudro, ona može biti alat za jačanje veze. Video pozivi omogućavaju parovima na distanci da održe intimnost. Aplikacije za parove pomažu u komunikaciji i planiranju. Dijeljenje lokacije može dati sigurnost bez potrebe za stalnim provjeravanjem.</p>

        <p>Stefan i Milica koriste zajedničku Pinterest zbirku gdje spremaju ideje za buduću kuću. Maja i Darko imaju privatni Instagram račun samo za njihove fotografije. Ovi digitalni prostori postaju mjesta povezivanja, a ne razdvajanja.</p>

        <h3>Granice u digitalnom svijetu</h3>

        <p>Ključ je u postavljanju zdravih digitalnih granica. To može značiti dogovoreno vrijeme bez telefona tijekom večere. Ili pravilo da se ozbiljni razgovori vode uživo, ne preko poruka. Možda dogovor o tome što je u redu objavljivati o vezi, a što ostaje privatno.</p>

        <h2>Preporuke za različite stilove</h2>

        <h3>Za anksiozne tipove</h3>

        <p>Ograničite vrijeme praćenja partnera online. Postavite si pravilo - provjeravam WhatsApp 3 puta dnevno, ne više. Isključite notifikacije koje nisu hitne. Kada osjetite potrebu za digitalnom forenzikom, radije nazovite prijateljicu ili idite prošetati. Vježbajte toleriranje neizvjesnosti - ne morate znati što partner radi svake sekunde. Istraživanja pokazuju da smanjenje digitalnog nadzora može značajno poboljšati kvalitetu veze.</p>

        <h3>Za izbjegavajuće tipove</h3>

        <p>Pokušajte biti dostupniji digitalno. Odgovorite na poruke u razumnom roku. Podijelite poneku fotografiju vas dvoje. Koristite video pozive umjesto samo poruka - omogućava veću intimnost. Prepoznajte kada koristite tehnologiju kao barijeru i zapitajte se čega se zapravo bojite.</p>

        <h3>Za sigurne tipove</h3>

        <p>Budite model zdrave digitalne komunikacije. Pokazujte partnerima kako se tehnologija može koristiti za povezivanje, ne kontrolu. Budite strpljivi s partnerima koji imaju drugačije digitalne navike. Pomozite im razumjeti kako njihovo ponašanje utječe na vas.</p>

        <ImageWithCaption
            src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?q=80&w=2000&auto=format&fit=crop"
            alt="Par zajedno gleda telefon"
            caption="Tehnologija može zbližiti kada se koristi mudro"
            credit="Photo by Andres Urena on Unsplash"
        />

        <h2>Digitalni detoks za parove</h2>

        <p>Sve više parova otkriva vrijednost digitalnog detoksa. Vikend bez telefona. Večer bez ekrana. Ovi trenuci omogućavaju pravom povezivanju bez distrakcija. Ana i Marko su ustanovili &quot;nedjelju bez telefona&quot; - dan kada ostavljaju telefone u ladici i fokusiraju se jedno na drugo.</p>

        <p>&quot;Prvo je bilo čudno,&quot; priznaje Ana. &quot;Nisam znala što da radim s rukama. Ali onda smo počeli razgovarati kao prije. Igrali društvene igre. Šetali bez fotografiranja. Ponovno smo se zaljubili.&quot;</p>

        <Callout type="success">
            Istraživanja o ometanju tehnologijom pokazuju da 70% parova izvještava kako tehnologija prekida obiteljsko vrijeme barem povremeno, a dnevnička istraživanja potvrđuju da u danima s više tehnoloških prekida parovi doživljavaju lošije osjećaje u vezi.
        </Callout>

        <h2>Budućnost digitalnih veza</h2>

        <p>Kako tehnologija napreduje, tako će i njezin utjecaj na naše veze. Virtualna stvarnost, umjetni partneri, sve sofisticiraniji algoritmi za uparivanje - sve to dolazi. Važno je da ostanemo svjesni kako naši stilovi privrženosti oblikuju način na koji koristimo ove alate.</p>

        <p>Tehnologija sama po sebi nije dobra ili loša - to je alat. Način na koji ga koristimo reflektira naše najdublje strahove i želje. Kada postanemo svjesni ovih obrazaca, možemo početi koristiti tehnologiju na način koji jača, a ne sabotira naše veze.</p>

        <h2>Što možete učiniti ovaj tjedan</h2>

        <p>Ovaj tjedan provedite pregled digitalnih navika u svojoj vezi. Sjednite s partnerom (ili sami ako niste u vezi) i iskreno razgovarajte o tome kako tehnologija utječe na vašu vezu. Koliko vremena dnevno provodite na telefonu dok ste zajedno? Koje digitalne navike stvaraju napetost? Što bi htjeli promijeniti? Zatim, dogovorite jedno malo pravilo koje ćete provesti ovaj tjedan - možda bez telefona tijekom obroka, ili sat vremena prije spavanja bez ekrana. Primijetite kako se osjećate bez konstantne digitalne stimulacije. Na kraju tjedna, razgovarajte o iskustvu. Ova mala promjena može biti početak zdravijeg odnosa s tehnologijom i, što je još važnije, jedno s drugim. Zapamtite, cilj nije eliminirati tehnologiju, već je koristiti svjesno, na način koji podržava, a ne sabotira vašu vezu.</p>

        <h2>Reference</h2>

        <ol className="references">
            <li>D&apos;Angelo, J. D., Kerr, B., & Moreno, M. A. (2019). Addiction to social media and attachment styles: A systematic literature review. International Journal of Mental Health and Addiction, 17(4), 1094-1118.</li>
            <li>Fox, J., & Warber, K. M. (2014). Social networking sites in romantic relationships: Attachment, uncertainty, and partner surveillance on Facebook. Cyberpsychology, Behavior, and Social Networking, 17(1), 3-7.</li>
            <li>Li, X., Li, Y., Wang, X., & Hu, W. (2024). The relationship between attachment and problematic internet use: A multilevel meta-analysis. Developmental Review, 73, 101130.</li>
            <li>McDaniel, B. T., & Drouin, M. (2019). Daily technology interruptions and emotional and relational well-being. Computers in Human Behavior, 99, 1-8.</li>
            <li>Powell, D. N., Freedman, G., Williams, K. D., Le, B., & Green, H. (2021). A multi-study examination of attachment and implicit theories of relationships in ghosting experiences. Journal of Social and Personal Relationships, 38(7), 2225-2248.</li>
            <li>Worsley, J. D., McIntyre, J. C., Bentall, R. P., & Corcoran, R. (2018). Attachment style moderates the relationship between social media use and user mental health and wellbeing. Heliyon, 6(6), e04056.</li>
            <li>Zaman, M., Rajan, M. A., & Dai, Q. (2024). Adult attachment, social anxiety, and problematic social media use: A meta-analysis and meta-analytic structural equation model. Addictive Behaviors, 157, 108113.</li>
        </ol>
    </>
);

export default Post;