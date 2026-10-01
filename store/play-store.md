# Google Play – fișa aplicației

## Pași pentru publicare

Fișiere pregătite:
- `release/CalendarGunoi-v1.4.0-6.aab` – pachetul pentru Play (semnat cu aceeași cheie ca APK-urile de pe GitHub)
- `store/graphics/icon-512.png` – iconița aplicației (512×512)
- `store/graphics/feature-graphic.png` – grafica prezentată (1024×500)

1. **Creează aplicația** – titlu `Program Gunoi Sâncraiu & Nazna`, package `ro.sancraiu.calendargunoi`,
   limba implicită română, aplicație, gratuită.
2. **Cheia de semnare (o singură dată, înainte de primul upload!)** – Test and release → App integrity →
   App signing → „Use a different key” → „Export and upload a key from Java keystore”.
   Descarcă `pepk.jar` și `encryption_public_key.pem` în folderul `store/`, rulează
   `.scriptsexport-play-key.ps1` și încarcă `store/play-signing-key.zip`.
   ⚠️ NU alege cheia generată de Google – altfel cine are aplicația de pe GitHub nu poate face update din Play.
3. **Fișa magazinului** (Grow users → Store presence → Main store listing): titlul, descrierile de mai jos,
   iconița, grafica prezentată, capturile din `store/graphics/Screenshot_*.jpg` (nu sunt în git – se vede strada).
4. **App content** (Policy → App content): politica de confidențialitate, „App access” (fără login),
   reclame: Nu, clasificarea conținutului, public țintă 18+, Data safety (mai jos), aplicație guvernamentală: **Nu**.
5. **Test închis** (Test and release → Testing → Closed testing): încarcă AAB-ul, adaugă minimum
   **12 testeri** (adrese Gmail), trimite-le linkul de înscriere și lasă testul **14 zile**.
6. **Producție** – după cele 14 zile: Production → Create new release → același AAB (sau unul mai nou)
   → trimite la verificare (de obicei 1–7 zile).

## Detalii

- **Categorie:** Instrumente (Tools) sau Casă (House & Home)
- **Email de contact:** zapboxinternational@gmail.com
- **Politica de confidențialitate:** https://zap-box-company.github.io/calendar-gunoi/privacy.html
- **Reclame:** Nu
- **Public țintă:** 18+ (evită cerințele suplimentare pentru copii)

## Texte – română

**Titlu (max 30):** Calendar Gunoi Sâncraiu

**Descriere scurtă (max 80):**
Programul gunoiului pe strada ta în Sâncraiu de Mureș și Nazna, cu mementouri.

**Descriere completă:**
Nu mai uita să scoți pubela! Calendar Gunoi îți arată când se ridică gunoiul pe strada ta din Sâncraiu de Mureș și Nazna și îți amintește la timp.

• Alegi strada o singură dată – aplicația știe sectorul și programul
• Următoarea ridicare, cu numărătoare inversă
• Toate ridicările: pubela neagră (rezidual) și maro (biodeșeu), sac galben/verde (plastic și metal), sac albastru (hârtie și carton), sac transparent (sticlă)
• Mementouri cu o seară înainte și în dimineața ridicării, la orele alese de tine
• Buton „Am scos-o” – nu mai primești mementoul de dimineață
• Zilele fără ridicare și mutările de sărbători, marcate clar
• Widget pe ecranul principal al telefonului
• Export în Google Calendar
• Programul se actualizează automat
• Română și engleză, temă deschisă și închisă

Fără cont, fără reclame, fără date personale. Funcționează și fără internet.

Aplicație neoficială, realizată de un locuitor al comunei. Nu este afiliată Primăriei Sâncraiu de Mureș sau operatorului de salubritate. Sursa programului: calendarul de colectare a deșeurilor 2026 emis de Primăria Sâncraiu de Mureș.

## Texte – engleză

**Title:** Calendar Gunoi Sâncraiu

**Short description:**
Waste pickup schedule for your street in Sâncraiu de Mureș & Nazna, with reminders.

**Full description:**
Never forget the bins again! Calendar Gunoi shows when waste is collected on your street in Sâncraiu de Mureș and Nazna and reminds you in time.

• Pick your street once – the app knows your sector and schedule
• Next pickup with a countdown
• All pickups: black (residual) and brown (bio-waste) bins, yellow/green bag (plastic & metal), blue bag (paper & cardboard), clear bag (glass)
• Reminders the evening before and on the morning of each pickup, at times you choose
• “It's out” button – skip the morning reminder
• Days without collection and holiday changes clearly marked
• Home-screen widget
• Google Calendar export
• Schedule updates automatically
• Romanian and English, light and dark theme

No account, no ads, no personal data. Works offline.

Unofficial app made by a local resident. Not affiliated with the Sâncraiu de Mureș town hall or the waste collection operator. Schedule source: the 2026 waste collection calendar issued by the Sâncraiu de Mureș town hall.

## Siguranța datelor (Data safety)

- Colectează date? **Da**, doar anonime, prin Aptabase (statisticile se pot opri din Setări):
  - **Activitatea în aplicație → Interacțiuni în aplicație**: colectat, nepartajat, **nu e legat de identitate**,
    opțional (utilizatorul îl poate opri), scop: **Analiză (Analytics)**.
  - **Informații și performanța aplicației → Rapoarte de erori (crash logs)**: colectat, nepartajat,
    nu e legat de identitate, opțional, scop: **Analiză**.
- Partajează date cu terți? **Nu** (Aptabase e procesatorul nostru, nu „partajare” în sensul Play).
- Datele sunt criptate în tranzit? **Da** (HTTPS).
- Utilizatorii pot cere ștergerea datelor? Datele sunt anonime și nu pot fi asociate unei persoane;
  statisticile se pot opri din Setări, iar setările locale se șterg la dezinstalare.

## Declarații de permisiuni

- `SCHEDULE_EXACT_ALARM`: dacă Play Console întreabă, alege „Calendar / mementouri programate de utilizator”:
  aplicația trimite mementouri la ora aleasă de utilizator pentru ridicarea gunoiului.

## Clasificarea conținutului

Chestionarul IARC: categoria „Utilitar/Productivitate”, fără violență, fără conținut sexual,
fără jocuri de noroc, fără interacțiune între utilizatori, fără partajarea locației → PEGI 3 / Everyone.
