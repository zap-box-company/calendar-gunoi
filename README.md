# Calendar Gunoi – Sâncraiu de Mureș & Nazna

Aplicație Expo (React Native) pentru programul de ridicare a gunoiului. Fără cont, funcționează
offline, română + engleză. La prima pornire utilizatorul își alege strada; programul, notificările,
widgetul și fișierul `.ics` se calculează pentru sectorul străzii respective.

- Pagina de descărcare: https://zap-box-company.github.io/calendar-gunoi/
- Politica de confidențialitate: https://zap-box-company.github.io/calendar-gunoi/privacy.html

## Actualizarea programului (fără APK nou)

1. Editează `docs/program.json` (străzi, date, excepții, observații).
2. **Mărește `version`** (ex. 3 → 4) și pune data în `updated`.
3. `git commit` + `git push`. În cel mult 12 ore, aplicațiile descarcă programul nou
   (sau imediat, din Setări → „Verifică actualizări”).

Format pe an: `residualWeekday` (0 = duminică … 6 = sâmbătă) sau `residual`, plus `plastic`,
`paper`, `glass`, `exceptions` ca `{ "luna": [zile] }`. Un fișier greșit este respins de aplicație,
care păstrează programul anterior. Programul pentru 2027 se adaugă ca `"2027": { … }` lângă `"2026"`.

Același fișier este inclus și în APK (programul implicit, fără internet).

## Testare cu Expo Go

```
npx expo start
```
Scanează codul QR cu **Expo Go** (SDK 57). Widgetul funcționează doar în APK.

## Versiune nouă a aplicației

1. Mărește `version` și `android.versionCode` în `app.json`, apoi commit.
2. `npm run build:apk:win` – APK-urile apar în `release/` (AAB doar cu `npm run build:aab:win`).
3. `npm run publish:github` – creează release-ul pe GitHub cu APK-urile și anunță versiunea în
   `docs/program.json`. Aplicațiile instalate (1.3.1+) afișează **„Versiune nouă disponibilă”**
   în cel mult 12 ore; butonul duce la pagina de descărcare, iar APK-ul se instalează peste cel vechi.

Cine are 1.3.0 sau mai veche nu are încă anunțul – trimite-i o dată linkul paginii.
Pentru schimbări de program (date, străzi) **nu** e nevoie de versiune nouă – doar `docs/program.json`.

Cheia de semnare se află în `credentials/` (nu e în git). **Fă backup** – fără ea nu mai poți
publica actualizări (Android refuză un APK semnat cu altă cheie).

## GitHub Pages

Settings → Pages → Source: „Deploy from a branch” → `main` / `/docs`.

## Import în Google Calendar

Butonul **Export Google Calendar** deschide fișierul `.ics` cu o aplicație de calendar.
Dacă Google Calendar de pe telefon nu îl importă, folosește ⋮ → **Salvează fișierul .ics**,
apoi pe calculator: calendar.google.com → Setări → Import și export → Import.

## Structură

| Fișier | Rol |
|---|---|
| `docs/program.json` | **Programul: străzi, sectoare, date** – sursa unică |
| `docs/index.html`, `docs/privacy.html` | Pagina de descărcare și politica de confidențialitate |
| `src/data/sectors.ts` | Validarea și încărcarea programului |
| `src/data/remote.ts` | Descărcarea programului actualizat |
| `src/data/schedule.ts` | Motorul de program (calcule pe date) |
| `src/StreetPicker.tsx` | Onboarding: alegerea străzii (și „Schimbă strada”) |
| `src/HomeScreen.tsx` | Ecranul principal |
| `src/SettingsScreen.tsx` | Setări: stradă, limbă, ore mementouri, baterie, actualizări |
| `src/notifications.ts` | Mementouri locale + butonul „Am scos-o” |
| `src/useReminders.ts` | Ține mementourile și widgetul la zi |
| `src/widget/` | Widgetul „Următoarea ridicare” |
| `src/ics.ts` | Export `.ics` pentru Google Calendar |
| `src/i18n.ts` | Textele în română și engleză |
| `plugins/withAndroidReleaseSigning.js` | Semnarea build-ului de release |
| `scripts/` | Build, iconițe, cod QR |
| `store/play-store.md` | Textele și pașii pentru Google Play |
