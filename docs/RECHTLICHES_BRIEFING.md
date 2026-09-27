# Briefing für die Rechtsberatung – LIQUODA

Stand: 27. September 2026. Dieses Dokument fasst zusammen, was eine Anwältin oder ein Anwalt für LIQUODA prüfen und schreiben soll. Es ist keine Rechtsberatung, sondern die Beschreibung der Plattform und die Liste der offenen Fragen.

## 1. Was LIQUODA ist

- Schweizer Vermittlungs- und Technologieplattform (www.liquoda.com), betrieben von Marcel Spahr, Schwarzenburgstrasse 65, 3008 Bern. Rechtsform noch offen (Einzelfirma oder GmbH, siehe Frage 5.1).
- Kapitalnehmer (rechtlich Emittenten: KMU, Eigentümer von Immobilien, Energieprojekten, Sachwerten) stellen ein Projekt mit Zielbetrag ab CHF 10'000 und Laufzeit vor. Investoren (Privatpersonen) beteiligen sich mit CHF 100 bis CHF 20'000 je Beteiligung.
- LIQUODA prüft Vollständigkeit und Plausibilität, gibt Projekte manuell frei, wickelt die Kartenzahlung über Stripe ab und führt die Anteile als Token (ERC-20 mit Allowlist, pausierbar, gedeckelt auf den Zielbetrag; 1 Token = CHF 1) in einem öffentlichen Register auf Polygon.
- LIQUODA verwahrt kein Geld dauerhaft, keine Anteile und keine Schlüssel. Jeder Investor erhält bei der Registrierung automatisch eine eigene Wallet (Anbieter Privy, USA); LIQUODA kann Anteile pausieren, aber nicht entziehen.
- Wird das Ziel nicht erreicht, werden alle Zahlungen automatisch über Stripe zurückerstattet. Wird es erreicht, überweist LIQUODA das Geld manuell an den Kapitalnehmer. Es gibt keinen Sekundärmarkt, keine Ertragsausschüttung über die Plattform, keine Anlageberatung.
- Gebühren: Kapitalnehmer 3 % auf erfolgreich investiertes Volumen, Pakete mit Setup- und Monatsgebühr; Investor 1 % Transaktionsgebühr; KI-Assistent CHF 190 einmalig.

## 2. Texte, die zu prüfen sind

Seit 27. September 2026 liegen alle Texte als vollständige Entwürfe vor (Website, Fusszeile) sowie zwei Vertragsvorlagen in `docs/vertraege/` (Beteiligungsvertrag mit drei Varianten: festverzinsliches Darlehen, partiarisches Darlehen, Erlösbeteiligung an einem Sachwert; Plattformvertrag mit dem Kapitalnehmer). Aufgabe der Rechtsberatung ist die Prüfung und Korrektur dieser Entwürfe, nicht die Neuerstellung.

Alle Texte zweisprachig (Deutsch mit Schweizer Schreibweise, Englisch). Sie werden auf diesen Seiten angezeigt:

| Seite | Pfad | Inhalt heute |
|---|---|---|
| AGB | /agb | Entwurf, 15 Ziffern |
| Datenschutzerklärung | /datenschutz | Entwurf nach DSG mit allen Auftragsbearbeitern |
| Risikohinweise | /risiken | Entwurf |
| Haftungsausschluss | /haftung | Entwurf |
| Impressum | /impressum | Entwurf; UID und Handelsregister fehlen |

Zusätzlich im Investitionsprozess: fünf Zustimmungen, die der Investor aktiv anklickt (Risiken gelesen, Totalverlust möglich, Kapital gebunden, Rolle von LIQUODA verstanden, Rückerstattung bei Scheitern). Wortlaut in `messages/de.json` unter `invest.consent.items`. Und beim Einreichen eines Projekts die Bestätigung des Kapitalnehmers (Angaben wahr und vollständig, berechtigt).

Für die Datenschutzerklärung relevant, welche Dienste Personendaten verarbeiten:

| Dienst | Sitz | Daten |
|---|---|---|
| Supabase | Datenbank in Zürich | Konten, Projekte, Dokumente, Beteiligungen |
| Stripe | USA/Irland | Kartenzahlung, E-Mail, Betrag |
| Resend | USA | E-Mail-Versand |
| Privy | USA | Wallet je Investor, E-Mail als Identifikator |
| Anthropic | USA | KI-Assistent und Support-Bot: Gesprächsinhalte, Projektangaben und hochgeladene Dokumente werden zur Verarbeitung übermittelt (30 Tage Aufbewahrung beim Anbieter) |
| Vercel | USA, Server in den USA | Hosting, Zugriffsprotokolle |
| Polygon | öffentliche Blockchain | Wallet-Adressen und Anteile sind öffentlich einsehbar, Prüfsummen der Dokumente |

## 3. Vertrag zwischen Investor und Kapitalnehmer

Vorlage in `docs/vertraege/BETEILIGUNGSVERTRAG.md`. Zu prüfen:

- Rechtsnatur der Beteiligung je Asset-Art (Darlehen, partiarisches Darlehen, Genussschein, Miteigentum, Beteiligung an einer Gesellschaft). Der KI-Assistent und die Projektseite beschreiben heute nur, was der Kapitalnehmer angibt (z. B. «feste Rückzahlung über 5 Jahre mit 5 % Zins»).
- Ob die Token als Registerwertrechte nach Art. 973d ff. OR ausgestaltet werden (Registrierungsvereinbarung nötig) oder nur als Nachweis ohne eigene Rechtswirkung.
- Sicherheiten (Pfand, Garantie/Bürgschaft, Auszahlung nach Meilensteinen): wie sie vereinbart, verwahrt und im Verlustfall verwertet werden. LIQUODA bewertet sie nicht.
- Standardvertrag, den der Kapitalnehmer vor der Freigabe unterzeichnet (Pflichten, Wahrheit der Angaben, Informationspflichten während der Laufzeit, Gebühren).

## 4. Fragen zur Bewilligungspflicht

1. Ist LIQUODA mit diesem Modell bewilligungsfrei? Stichworte: Finanzmarktinfrastrukturgesetz (kein Handelssystem, da kein Sekundärmarkt), FINIG (keine Vermögensverwaltung), Bankengesetz (keine gewerbsmässige Entgegennahme von Publikumseinlagen; Geld liegt kurzzeitig auf dem Stripe-Konto von LIQUODA, bevor es an den Kapitalnehmer geht).
2. Geldwäschereigesetz: Löst die Zahlungsabwicklung über das eigene Stripe-Konto eine Unterstellung als Finanzintermediär aus? Falls ja: Anschluss an eine SRO oder Umstellung auf Stripe Connect (Auszahlung direkt an den Kapitalnehmer).
3. FIDLEG: Prospektpflicht bei öffentlichen Angeboten und die Ausnahmen (Gesamtwert unter CHF 8 Mio. über 12 Monate; Angebote unter CHF 100'000). Muss je Projekt oder je Kapitalnehmer eine Ausnahme dokumentiert werden? Braucht es ein Basisinformationsblatt?
4. Konsumkreditgesetz: Trifft es bei Darlehen an Privatpersonen (z. B. Oldtimer-Eigentümer) zu?
5. Identitätsprüfung: Welche Anforderungen an KYC (Investoren) und KYB (Kapitalnehmer) gelten? Heute: manuelle Prüfung durch LIQUODA ausserhalb der Plattform, Status wird im Admin gesetzt. Welche Unterlagen sind aufzubewahren und wie lange?
6. Werbung und Aussagen: Die Website vermeidet Renditeversprechen. Gibt es weitere Pflichthinweise (z. B. Warnhinweise nach FIDLEG)?

## 5. Weitere Fragen

1. Rechtsform und Haftung: Einzelfirma oder GmbH; Handelsregistereintrag; Angaben im Impressum.
2. Haftung für die Vorprüfung durch die KI und für Businesspläne, die der KI-Assistent aus den Angaben des Kapitalnehmers schreibt. Heute: Hinweis im Dokument und in der Oberfläche, dass der Kapitalnehmer den Inhalt verantwortet.
3. Aufbewahrung: Welche Daten wie lange (Zahlungsbelege, Identitätsnachweise, Dokumente der Projekte, Gesprächsverläufe mit der KI)?
4. Steuern: Verrechnungssteuer bei Zinszahlungen, MwSt. auf Gebühren und auf den KI-Assistenten (CHF 190 «inkl. MwSt.» steht heute in der Oberfläche).
5. Versicherung: Braucht LIQUODA eine Berufshaftpflicht?

## 6. Was LIQUODA technisch bereits sicherstellt

- Investitionen nur nach bestätigter Identität, Anteile nur an geprüfte Wallets, Beträge je Beteiligung begrenzt (CHF 100 bis 20'000), Zielbetrag gedeckelt, automatische Rückerstattung bei Scheitern.
- Jedes Dokument erhält eine Prüfsumme (SHA-256), die im öffentlichen Register verankert wird; Änderungen sind nachvollziehbar (Versionen, Audit-Log im Admin).
- Freigabe eines Projekts und Zuweisung der Anteile erfolgen nur manuell durch LIQUODA.
