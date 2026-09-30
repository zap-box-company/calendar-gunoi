# Google Play – fișa aplicației

## Pași pentru publicare

1. Cont de dezvoltator: https://play.google.com/console (25 $, o singură dată).
   Conturile personale noi trebuie să facă un **test închis cu minimum 12 testeri timp de 14 zile**
   înainte de publicarea în producție – vecinii sunt testerii ideali.
2. „Creează aplicația” → nume **Calendar Gunoi**, limba implicită **română**, aplicație, gratuită.
3. Generează AAB-ul cu `npm run build:aab:win` și încarcă `release/CalendarGunoi-v<versiune>-<cod>.aab` (NU APK-ul).
   **Important – Play App Signing:** la prima încărcare alege să folosești **cheia ta existentă**
   („Use a key from Java keystore / Export and upload a key”, cu `credentials/release.keystore`),
   NU o cheie generată de Google. Altfel, cine a instalat aplicația de pe GitHub nu o va putea
   actualiza din Play Store (Android refuză actualizarea semnată cu altă cheie) și ar trebui s-o
   dezinstaleze întâi.
4. Completează secțiunile de mai jos (texte, siguranța datelor, clasificare).
5. Capturi de ecran: minimum 2, din telefon (ecranul principal, alegerea străzii, setările).
   Grafica prezentată (1024×500) – opțională pentru început.

## Detalii

- **Categorie:** Instrumente (Tools) sau Casă (House & Home)
- **Email de contact:** (adresa ta)
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
