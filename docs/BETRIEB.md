# Betriebshandbuch LIQUODA

Stand: 27. September 2026. Was im laufenden Betrieb manuell zu tun ist, in der Reihenfolge, wie es anfällt. Alle Schritte laufen über den Admin-Bereich (www.liquoda.com/admin, Login info@liquoda.com), ausser wo anders vermerkt.

## Täglich (5 Minuten)

1. Posteingang info@liquoda.com lesen: Projektanfragen, Antworten auf System-Mails, Supportfragen.
2. Admin → Registrierungen: neue Konten sehen. Investoren und Kapitalnehmer ohne bestätigte Identität können nichts tun; die Prüfung stösst LIQUODA an (siehe unten).
3. Admin → Projekte: Projekte «In Prüfung» bearbeiten (Freigeben oder Rückfrage). Die KI-Vorprüfung auf der Projektseite zeigt Urteil, Befunde und eine Empfehlung an LIQUODA.

## Identitätsprüfung (KYC für Investoren, KYB für Kapitalnehmer)

Ablauf, bis ein externer Dienst angebunden ist:

1. Der Nutzer erhält nach der Registrierung eine E-Mail, dass die Prüfung folgt (Vorlage im System). LIQUODA schreibt ihm von info@liquoda.com, welche Unterlagen nötig sind:
   - Investor: Kopie eines amtlichen Ausweises, Wohnadresse, kurzes Selfie mit Ausweis oder Video-Termin.
   - Kapitalnehmer: Handelsregisterauszug (oder Ausweis bei Privatpersonen), Ausweis der zeichnungsberechtigten Person, Nachweis der Berechtigung am Asset (Grundbuch, Eigentumsnachweis).
2. Unterlagen prüfen: Name und Geburtsdatum stimmen mit dem Konto überein, Ausweis gültig, Person zeichnungsberechtigt.
3. Admin → Nutzer → Status setzen: «Bestätigt» oder «Nicht bestanden» (mit Begründung, geht per E-Mail an den Nutzer).
4. Unterlagen ausserhalb der Plattform ablegen (verschlüsselter Ordner, benannt nach Nutzer-ID), Aufbewahrungsdauer gemäss Rechtsberatung (siehe `RECHTLICHES_BRIEFING.md`).

## Projektfreigabe

1. Vorprüfung der KI lesen. «Nicht freigeben» oder «Nacharbeit» ernst nehmen; sie liest alle Dokumente.
2. Selbst verifizieren, was die KI nicht kann: Handelsregister online (zefix.ch), Grundbuchauszug beim Amt, telefonischer Kontakt mit dem Kapitalnehmer, Offerten plausibel.
3. Dokumente im Admin als «gesichtet» markieren (Sichtvermerk, keine Richtigkeitsprüfung).
4. Vertrag mit dem Kapitalnehmer unterzeichnen lassen (Vorlage nach Rechtsberatung).
5. Freigeben: Projekt ist sofort im Marktplatz sichtbar. Danach «Token-Vertrag anlegen» (ein Klick; Gas zahlt die Backend-Wallet).

## Während der Finanzierung

- Bezahlte Beteiligungen erscheinen auf der Projektseite im Admin. Für jede: «Mint freigeben», sobald Identität bestätigt ist (System prüft Zahlung, Status, Laufzeit, Wallet).
- Fragen der Investoren beantwortet der Kapitalnehmer in seinem Dashboard; LIQUODA kann Fragen und Neuigkeiten ausblenden (Moderation).

## Nach der Finanzierung

- Ziel erreicht («Finanziert»): Geld liegt auf dem Stripe-Konto. Auszahlung an den Kapitalnehmer manuell per Überweisung: investiertes Volumen abzüglich 3 % Gebühr. Beleg ablegen. Investoren-Gebühr (1 %) ist bereits im Zahlungsbetrag enthalten und bleibt bei LIQUODA.
- Ziel nicht erreicht: Das System setzt das Projekt täglich um 00:30 UTC automatisch auf «Nicht erfolgreich» und erstattet alle Zahlungen. Fehlgeschlagene Rückerstattungen stehen rot auf der Projektseite und können mit einem Klick wiederholt werden.
- Laufende Pflichten des Kapitalnehmers (Zins, Rückzahlung, Berichte) laufen ausserhalb der Plattform; er kann Neuigkeiten im Dashboard veröffentlichen.

## Monatlich

- Backend-Wallet: Guthaben (POL) auf polygonscan.com prüfen (Adresse `PRIVY_WALLET_ADDRESS` auf Vercel). Unter etwa 5 POL nachladen.
- Anthropic-Console: Guthaben und Verbrauch prüfen (console.anthropic.com → Billing).
- Admin → KI: Support-Gespräche lesen; falsche oder fehlende Antworten in `lib/ki/wissen.ts` korrigieren.
- Admin → E-Mails: fehlgeschlagene Mails prüfen.
- Stripe-Dashboard: offene Streitfälle (Chargebacks) prüfen.

## Bei Störungen

- Website nicht erreichbar: Vercel-Dashboard → Deployments (letztes Deployment «Ready»?).
- Login funktioniert nicht: Supabase-Dashboard → Projekt pausiert? (Gratis-Plan pausiert nach Inaktivität; Pro-Plan nicht.)
- Zahlungen kommen nicht an: Stripe → Webhooks → Endpunkt `/api/investieren/webhook` zeigt Fehler?
- KI antwortet nicht: Anthropic-Guthaben leer? Admin → KI zeigt, ob der Schlüssel gesetzt ist.
- Admin-Passwort vergessen: /admin/login → «Passwort vergessen», Link kommt an info@liquoda.com.
