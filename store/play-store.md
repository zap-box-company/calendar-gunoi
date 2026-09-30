# Google Play – fișa aplicației

## Pași pentru publicare

1. Cont de dezvoltator: https://play.google.com/console (25 $, o singură dată).
   Conturile personale noi trebuie să facă un **test închis cu minimum 12 testeri timp de 14 zile**
   înainte de publicarea în producție – vecinii sunt testerii ideali.
2. „Creează aplicația” → nume **Calendar Gunoi**, limba implicită **română**, aplicație, gratuită.
3. Încarcă `release/CalendarGunoi-v<versiune>-<cod>.aab` (NU APK-ul).
   La prima încărcare, acceptă **Play App Signing**; cheia din `credentials/` devine „upload key”.
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

Fără cont, fără reclame, fără colectare de date. Funcționează și fără internet.

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

No account, no ads, no data collection. Works offline.

## Siguranța datelor (Data safety)

- Colectează sau partajează date? **Nu** (niciun tip de date).
- Datele sunt criptate în tranzit? **Da** (HTTPS pentru descărcarea programului).
- Utilizatorii pot cere ștergerea datelor? Nu se aplică – nu există date colectate
  (setările rămân doar pe telefon și se șterg la dezinstalare).

## Declarații de permisiuni

- `SCHEDULE_EXACT_ALARM`: dacă Play Console întreabă, alege „Calendar / mementouri programate de utilizator”:
  aplicația trimite mementouri la ora aleasă de utilizator pentru ridicarea gunoiului.

## Clasificarea conținutului

Chestionarul IARC: categoria „Utilitar/Productivitate”, fără violență, fără conținut sexual,
fără jocuri de noroc, fără interacțiune între utilizatori, fără partajarea locației → PEGI 3 / Everyone.
