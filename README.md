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

## Release

```
npm run build:apk:win
```
Rezultă în `release/`: APK universal, APK arm64 (mai mic), AAB pentru Google Play, plus
`release/github/` cu numele fixe pentru GitHub Releases:

1. GitHub → Releases → „Draft a new release” → tag `v1.2.0`.
2. Atașează `release/github/CalendarGunoi.apk` și `CalendarGunoi-universal.apk`.
3. Linkurile de pe pagina de descărcare arată mereu spre ultimul release.

Cheia de semnare se află în `credentials/` (nu e în git). **Fă backup** – fără ea nu mai poți
publica actualizări. Google Play: vezi `store/play-store.md`.

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
