# Go-Live-Checkliste LIQUODA

Stand: 26. September 2026. Die Plattform läuft vollständig im Testbetrieb (Stripe-Testmodus, Polygon Amoy). Diese Liste beschreibt, was für den Echtbetrieb zu tun ist. Jeder Punkt ist unabhängig; die Reihenfolge ist eine Empfehlung.

## 1. Rechtliches (Fachperson, keine Programmierarbeit)

- AGB, Datenschutzerklärung (DSG), Risikoaufklärung und Haftungsausschluss durch eine Anwältin oder einen Anwalt erstellen lassen. Die Texte werden in `messages/de.json` und `messages/en.json` unter `legal.*` eingetragen; der Hinweis «Platzhalter» in `components/sections/LegalPage.tsx` wird dann entfernt.
- Klären: Ist LIQUODA mit dem gewählten Modell (Vermittlung, non-custodial, Anteile als Token) in der Schweiz bewilligungsfrei? Stichworte: FINMA-Vermittlerregelung, Prospektpflicht ab bestimmten Volumen, Geldwäschereigesetz bei Zahlungsabwicklung. Dies ist vor dem ersten echten Projekt zu klären.
- Impressum um Rechtsform und Handelsregister ergänzen.

## 2. Stripe auf Echtbetrieb

- Stripe-Konto aktivieren (Firmenangaben, Bankverbindung, Identitätsprüfung im Stripe-Dashboard).
- Live-Schlüssel eintragen: `STRIPE_SECRET_KEY` (sk_live_…) auf Vercel für Production.
- Webhook-Endpunkt im Live-Modus anlegen: `https://www.liquoda.com/api/investieren/webhook`, Ereignisse `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. Das Signing-Secret als `STRIPE_WEBHOOK_SECRET` auf Vercel für Production.
- Testzahlung mit einer echten Karte über einen kleinen Betrag, danach Rückerstattung über den Admin prüfen.
- Hinweis: Das Geld der Investoren liegt auf dem Stripe-Konto von LIQUODA. Die Auszahlung an den Emittenten erfolgt manuell per Überweisung. Für ein echtes non-custodial Modell wäre Stripe Connect mit Auszahlung direkt an den Emittenten nötig (nicht im MVP).

## 3. Polygon auf Echtbetrieb

- POL kaufen (z. B. über eine Schweizer Börse) und an die Backend-Wallet senden: `PRIVY_WALLET_ADDRESS` aus Vercel. Empfohlen: Gegenwert von CHF 50 bis 100, reicht für Tausende Vorgänge.
- Umgebungsvariablen auf Vercel (Production) ändern: `NEXT_PUBLIC_CHAIN_ID=137`, `POLYGON_RPC_URL` auf einen Polygon-Mainnet-Endpunkt (z. B. `https://polygon-bor-rpc.publicnode.com`), `NEXT_PUBLIC_EXPLORER_URL=https://polygonscan.com`.
- In Privy: Die Server-Wallet ist kettenunabhängig, keine Änderung nötig. In der Privy-App die Domain-Freigaben prüfen.
- Bestehende Beispielprojekte behalten ihre Verträge auf Amoy (Testnet); echte Projekte erhalten neue Verträge auf dem Mainnet beim Klick «Token-Vertrag anlegen».
- Optional: Verträge auf polygonscan.com verifizieren (Quellcode veröffentlichen), damit Investoren den Code lesen können.

## 4. Supabase

- Plan prüfen: Der Gratis-Plan pausiert Projekte nach einer Woche ohne Zugriff und hat Limits bei Speicher und Mails. Für den Echtbetrieb den Pro-Plan wählen.
- Tägliche Sicherungen aktivieren (im Pro-Plan enthalten).
- Site URL und Redirect-URLs unter Authentication prüfen (bereits gesetzt: www.liquoda.com, liquoda.com, localhost).

## 5. Vercel und Domain

- Umgebungsvariablen Production vollständig: Supabase (URL, Anon, Service Role), Stripe (Live), Resend, Privy (App ID, Secret, Wallet ID, Wallet Address), Polygon (Chain, RPC, Explorer), `CRON_SECRET`, Admin (E-Mail, Passwort, `JWT_SECRET`).
- Admin-Passwort und `JWT_SECRET` vor dem Start neu setzen.
- Cron-Job `/api/cron/rueckabwicklung` läuft täglich um 00:30 UTC (Vercel Cron, in `vercel.json`).

## 6. Betrieb

- Identitätsprüfung (KYC/KYB): Ablauf ausserhalb der Plattform festlegen (welche Dokumente, wer prüft, wie wird dokumentiert). Später externer KYC-Dienst.
- Auszahlung an Emittenten nach erfolgreicher Finanzierung: manueller Prozess, im Admin nicht abgebildet.
- Support-Adresse info@liquoda.com regelmässig lesen; Antworten auf System-Mails landen dort.
- Backend-Wallet-Guthaben (POL) monatlich prüfen.

## 7. Testdaten entfernen

- Beispielprojekte aus `supabase/seed.sql` sind als «Beispiel» markiert. Vor dem Start löschen oder beibehalten, je nach Wunsch. Löschen: im Admin «Entwurf beenden» ist nicht möglich für aktive Projekte; direkt in der Datenbank entfernen (Projekte, Dokumente, Investitionen).
- Testkonten `test-emittent@liquoda.example` und `test-investor@liquoda.example` löschen (Supabase → Authentication → Users).
- Restguthaben der alten Backend-Wallet (0.005 ETH auf Ethereum Mainnet) zurückführen; der Schlüssel liegt in `.env.local` als `LEGACY_DEPLOYER_PRIVATE_KEY` und kann danach gelöscht werden.

## KI-Assistent und Support-Bot (Etappe 20)

- `ANTHROPIC_API_KEY` auf Vercel gesetzt (workspace-gebundener Schlüssel; sonst zusätzlich `ANTHROPIC_WORKSPACE_ID`). Guthaben in der Anthropic-Console prüfen; Kosten: Support-Antwort Rappenbeträge, Businessplan ca. CHF 0.50 bis 1.00, Vorprüfung mit vielen PDFs bis ca. CHF 2.
- Preis CHF 190 läuft über denselben Stripe-Webhook wie Investitionen (`metadata.kind = ai_assistant`); nach dem Live-Schalten von Stripe einmal testen.
- Wissensbasis `lib/ki/wissen.ts` nach jeder Preis- oder Ablaufänderung nachführen (z. B. «Testbetrieb» entfernen).
- Admin → «KI»: Support-Gespräche regelmässig lesen, um falsche Antworten oder häufige Fragen zu erkennen.
