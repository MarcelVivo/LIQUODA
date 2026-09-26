# CLAUDE.md – LiquodaWebsite

## Projekt

Website und MVP-Plattform für LIQUODA, eine Schweizer non-custodial Vermittlungsplattform für tokenisierte reale Vermögenswerte. Die vollständige Spezifikation steht in `LIQUODA_SPEC.md`. **Lies sie zuerst, bevor du etwas änderst.** Sie ist verbindlich: Was dort nicht steht, wird nicht gebaut.

## Stack (bereits vorhanden)

- Next.js App Router mit `app/[locale]`, TypeScript, Tailwind
- `next-intl` mit `messages/de.json` (Standard, Schweizer Schreibweise: «ss» statt «ß») und `messages/en.json`
- Supabase: Schema und RLS in `supabase/migrations/`, Beispieldaten in `supabase/seed.sql` (erzeugt aus `lib/projects/example-data.ts`); Clients in `lib/supabase/` (`server.ts` mit Anon-Key und Session-Cookies, `client.ts`, `middleware.ts`); `lib/supabase.ts` (Service-Role) nur für den Admin-Bereich
- Auth: Supabase Auth mit E-Mail-Bestätigung, Rolle in `app_metadata` (per Trigger), Route Handler unter `app/api/konto/`, Rollen-Routing in `middleware.ts`
- Zahlungen: Stripe Checkout im Testmodus (`lib/stripe.ts`, Gebühren in `lib/fees.ts`), Route Handler `app/api/investieren/{checkout,webhook}`, Datenzugriff `lib/investments.ts`; Kapazität, KYC und Statuswechsel zusätzlich per Trigger in `supabase/migrations/…_investments.sql`
- Dokumente: privater Storage-Bucket `project-documents`, Zugriff nur über Route Handler (`lib/documents.ts`, `app/api/dokumente/[id]` mit signierten Links); Emittenten-Dashboard und Wizard in `components/emittent/`, Daten in `lib/emittent.ts`
- Admin-Bereich unter `app/admin` mit eigenem Login (`jose`-JWT), Aktionen über `app/api/admin/*` und Datenbank-Funktionen `admin_set_kyc` / `admin_set_project_status` (Audit-Log mit `actor_label`); täglicher Job `expire_projects` per pg_cron
- Bestehende Komponenten: `components/layout/{Navbar,Footer}`, `components/ui/{Button,Badge,LanguageToggle,WaveBackground}`, `components/sections/{Hero,HowItWorks,ProjectPreview,RegisterForm,ComingSoon}`
- Design: verbindlich nach `../LIQUODA_Praesentation.html` (siehe Spec, Abschnitt 2 «Design»); Tokens in `tailwind.config.ts`, Bausteine in `components/ui/`
- Logo: SVG-Schriftzug in `components/ui/Wordmark.tsx` (das alte `public/liquoda-logo-v2.svg` wird nicht mehr verwendet)
- Hosting: Vercel, Deployment aus GitHub `main`

## Regeln

1. **Etappenweise bauen.** Es gibt sechs Etappen (siehe unten). Arbeite immer nur an der aktuell beauftragten Etappe. Beginne keine spätere Etappe, auch nicht «vorbereitend».
2. **Vor jeder Etappe einen kurzen Plan zeigen** (Dateien, die entstehen oder geändert werden) und auf Freigabe warten. Danach umsetzen.
3. **Nach jeder Etappe:** `npm run build` muss fehlerfrei durchlaufen. Dann eine kurze Zusammenfassung: was gebaut wurde, wie man es testet, was offen ist. Keine Romane.
4. **Design nur aus der Präsentation.** Neue Seiten und Komponenten verwenden ausschliesslich die Tokens und Bausteine aus der Präsentationsgestaltung (Ink, Petrol, Creme-Verlauf, Karten, Pill-Buttons, Kicker). Keine neuen Farben oder Stile erfinden.
5. **Kein Marketing-Sprech.** Alle UI-Texte folgen Abschnitt 2 der Spec (sachlich, keine Renditeversprechen, keine Dringlichkeit). Texte immer in `messages/de.json` und `messages/en.json`, nie hartkodiert.
6. **Bestehendes wiederverwenden.** Vorhandene Komponenten erweitern statt neue Parallelversionen bauen. Den Admin-Bereich nicht umbauen, nur ergänzen.
7. **Keine Secrets im Code.** Alles über `.env.local` / Vercel-Env. Neue Variablen in `.env.example` dokumentieren (ohne Werte).
8. **Geschäftslogik ins Backend** (Route Handlers unter `app/api` oder Supabase-Funktionen), nicht ins Frontend. Supabase mit Row Level Security.
9. **Nichts aus Abschnitt 12 der Spec bauen** (kein Sekundärmarkt, keine Prognosen, keine Auszahlungsautomatik usw.).
10. **Nicht löschen ohne Rückfrage.** Bestehende Dateien, Migrationen oder Daten nur nach Bestätigung entfernen.
11. **Git:** Pro Etappe ein eigener Branch `etappe-N-kurzname`, kleine, sprechende Commits auf Deutsch. Kein Push auf `main` ohne Freigabe.

## Etappen

| Nr. | Etappe | Umfang | Backend nötig |
|---|---|---|---|
| 1 | Öffentliche Seiten | Startseite (ersetzt ComingSoon), «So funktioniert es», «Für Emittenten» (inkl. Pakete und Anfrageformular), rechtliche Seiten als Platzhalter, Navbar/Footer final | nein |
| 2 | Marktplatz mit Beispieldaten | `/projekte` mit Filter und Status, `/projekte/[slug]` mit Dokumenten und Abschnitt «Risiken & Hinweise»; Daten zunächst aus einer lokalen Datei | nein |
| 3 | Auth und Datenmodell | Supabase-Tabellen aus Spec Abschnitt 6 (SQL-Migration), RLS, Registrierung mit Rollenwahl, Login, Rollen-Routing; Marktplatz liest aus Supabase | ja |
| 4 | Investitionsprozess | `/investieren/[slug]`: Betrag, Zusammenfassung, aktive Risikozustimmung, Stripe Checkout (Testmodus), Webhook, Statuswechsel `reserved → paid`, Fehlerfälle | ja |
| 5 | Portfolio und Emittenten-Dashboard | `/portfolio`, `/emittent` mit Projekt-Wizard und Dokument-Upload (Supabase Storage), Admin: Projektprüfung, Freigabe, KYC-Status manuell setzen, Audit-Log | ja |
| 6 | Smart Contracts und Wallet | OpenZeppelin ERC-20-Template mit Cap, Allowlist, Pausable; Deployment auf Polygon-Testnet; Wallet-Verbindung (MetaMask/WalletConnect); Mint nach Backend-Freigabe; Token-Referenz speichern | ja |

Aktuelle Etappe: **5**, umgesetzt auf Branch `etappe-5-portfolio-dashboard-admin`, Abnahme offen. Etappen 1 bis 4 sind abgenommen und auf `main`. Supabase-Projekt `dozdhstxbrlevenqckxc` (Zürich), Vercel deployt automatisch aus GitHub `main`. (Diese Zeile nach Abschluss jeder Etappe aktualisieren.)

## Befehle

```
npm run dev      # lokal starten
npm run build    # muss nach jeder Etappe fehlerfrei sein
npm run lint
```
