/**
 * Wissensbasis über LIQUODA für den Support-Bot und den KI-Assistenten.
 * Quelle: LIQUODA_SPEC.md und docs/WIE_LIQUODA_FUNKTIONIERT.md. Sachlich, ohne
 * Renditeversprechen. Wird als stabiler System-Prompt-Block gecacht.
 */
export const LIQUODA_WISSEN = `
# LIQUODA – Fakten

## Was LIQUODA ist
- Schweizer, non-custodial Vermittlungs- und Technologieplattform für tokenisierte reale Vermögenswerte (www.liquoda.com). Betreiberin ist das Einzelunternehmen Electromantiques Marcel Spahr (Handelsregister Bern CH-036.1.051.760-7, UID CHE-153.310.592), Schwarzenburgstrasse 65, 3008 Bern. Kontakt: info@liquoda.com.
- Zwei Nutzergruppen: Kapitalnehmer (rechtlich «Emittenten»: KMU, Unternehmer, Eigentümer von Immobilien, Energieprojekten oder Sachwerten wie Uhren, Kunst, Fahrzeuge), die Kapital freisetzen wollen, ohne das Asset vollständig zu verkaufen; und Investoren (Privatpersonen), die mit CHF 100 bis CHF 20'000 je Beteiligung in reale Werte investieren.
- Anteile werden als Token im öffentlichen Register auf Polygon geführt. Auf der Website heisst das «Anteile» und «Anteile-Konto»; Investoren brauchen keine Krypto-Kenntnisse, keine Browser-Erweiterung und verlassen die Plattform nur für die Kartenzahlung bei Stripe.
- Leitprinzip: LIQUODA ersetzt kein Risiko. LIQUODA macht Risiko sichtbar, strukturiert und nachvollziehbar.

## Was LIQUODA bewusst nicht ist
- Keine Bank, kein Finanzinstitut, kein Vermögensverwalter, keine Verwahrstelle.
- Kein Investor, kein Garant, keine Anlageberatung, keine Rechts- oder Steuerberatung.
- Keine Trading- oder Spekulationsplattform, kein Sekundärmarkt: Anteile können auf LIQUODA nicht weiterverkauft werden.
- Verwahrt niemals Geld, Anteile oder Wallet-Schlüssel. Gibt niemals Gewinn- oder Renditeversprechen ab.
- Keine eigene Versicherung, keine Garantie durch LIQUODA. Sicherheiten (Pfand, Garantie/Bürgschaft, Auszahlung nach Meilensteinen) stellt der Kapitalnehmer; LIQUODA bewertet sie nicht.

## Ablauf für Investoren
1. Startseite und «So funktioniert es» lesen, Projekte im Marktplatz ansehen (Filter nach Asset-Art; Status offen, finanziert, geschlossen).
2. Projektseite prüfen: Beschreibung, Zweck, Zielbetrag, Laufzeit, Dokumente, Absicherung, Abschnitt «Risiken und Hinweise», Neuigkeiten und Fragen.
3. Konto als Investor erstellen (E-Mail-Bestätigung). Identitätsprüfung (KYC) durch LIQUODA ausserhalb der Plattform, Status wird im Konto gesetzt. Vorher ist keine Beteiligung möglich. Das Anteile-Konto entsteht automatisch, nichts installieren.
4. «Investition prüfen»: Betrag zwischen Mindestbetrag des Projekts und CHF 20'000 eingeben, Zusammenfassung mit Transaktionsgebühr 1 % ansehen, fünf Risikohinweise aktiv bestätigen, Kartenzahlung in CHF bei Stripe.
5. Nach der Zahlung prüft LIQUODA Projektstatus, Laufzeit und Identität und weist die Anteile dem Anteile-Konto zu. E-Mail-Bestätigung.
6. Portfolio: Beteiligungen, Status, Zahlungsreferenz, Dokumente, öffentlicher Nachweis der Anteile.
- Wird das Finanzierungsziel bis zum Laufzeitende nicht erreicht: keine Anteile, alle Zahlungen werden automatisch und vollständig (inklusive Gebühr) zurückerstattet.
- Investoren bleiben anonym; es gibt keine Profile, keine Fotos, kein soziales Netzwerk.

## Ablauf für Kapitalnehmer
1. Seite «Für Kapitalnehmer» lesen; unverbindliche Projektanfrage senden (Art des Assets, Zweck, geschätzter Betrag).
2. Konto als Kapitalnehmer erstellen; Unternehmensprüfung (KYB) durch LIQUODA.
3. Projekt im Wizard erfassen: Eckdaten (Titel, Ort, Art des Assets, Art der Anteile), Texte (Kurzbeschreibung, Beschreibung, Verwendung des Kapitals, projektspezifische Risiken), Titelbild (Pflicht) und Galerie, Zielbetrag (mindestens CHF 10'000), Mindestbetrag je Beteiligung (CHF 100 bis 20'000), Laufzeit, Absicherung, Dokumente.
4. Pflichtdokumente je Asset-Art: Unternehmen: Businessplan, Jahresrechnung/Finanzen, Handelsregisterauszug. Immobilie: Grundbuchauszug, Gutachten/Bewertung, Finanzierungskonzept. Energie: Projektbeschrieb, Ertragsgutachten, Abnahmevertrag. Sachwert: Eigentumsnachweis, Gutachten/Bewertung, Versicherungsnachweis. Zulässig sind PDF, JPG, PNG bis 20 MB; jedes Dokument erhält eine Prüfsumme (SHA-256), die im öffentlichen Register verankert wird. Sichtbarkeit je Dokument: öffentlich oder nur für angemeldete Nutzer.
5. Einreichen: Das Projekt ist «in Prüfung» und eingefroren. LIQUODA prüft manuell, stellt Rückfragen oder gibt frei. Eine Freigabe erfolgt nie automatisch. Nach der Freigabe ist das Projekt sofort im Marktplatz sichtbar.
6. Finanzierungsphase: Dashboard zeigt den Stand. Ziel erreicht: «Finanziert». Nicht erreicht: Rückabwicklung. Auszahlung an den Kapitalnehmer nach erfolgreicher Finanzierung durch LIQUODA (manuell, nicht automatisiert).
- Voraussetzungen: Sitz oder Asset in der Schweiz; konkretes Vorhaben mit Zweck, Zielbetrag und Laufzeit; Bereitschaft, Unterlagen offenzulegen; erfolgreiche KYB-Prüfung.

## Kosten (Planannahmen, können angepasst werden)
- Pakete für Kapitalnehmer: Basic (Setup CHF 1'500, CHF 150 pro Monat: Projektaufschaltung, standardisierte Projektseite, Basis-Prüfung, Standard-Tokenisierung, Dokumentenablage, E-Mail-Support). Standard (Setup CHF 3'500, CHF 250 pro Monat: zusätzlich erweiterte Prüfung, Unterstützung bei der Struktur, Smart-Contract-Parameter, Investoren-Dashboard, priorisierter Support). Premium (Setup CHF 7'500, CHF 400 pro Monat: zusätzlich intensive Begleitung, Dokumentationshilfe, Strukturierungsberatung ohne Anlageberatung, erweitertes Reporting).
- KI-Assistent für Kapitalnehmer: CHF 190 einmalig je Projekt; im Standard- und Premium-Paket inbegriffen. Er hilft beim Erfassen des Projekts, schreibt Businessplan, Finanzierungskonzept oder Projektbeschrieb auf Basis der Angaben des Kapitalnehmers, prüft alles vor und reicht das Projekt nach Bestätigung bei LIQUODA ein. Die Freigabe bleibt bei LIQUODA.
- Transaktionsgebühr Kapitalnehmer: 3 % auf das erfolgreich investierte Volumen, nur bei Erfolg. Transaktionsgebühr Investor: 1 %, im Investitionsprozess ausgewiesen. Keine Erfolgs- und keine Renditegebühren. Für Investoren gibt es kein Abo.

## Sicherheit und Technik (in einfachen Worten)
- Geld: Investoren zahlen per Karte an Stripe; LIQUODA hält kein Kundengeld dauerhaft und verwahrt keine Anteile.
- Anteile liegen im Anteile-Konto des Investors (eine Wallet, die beim Registrieren automatisch entsteht). Übertragungen sind nur an geprüfte Konten möglich; LIQUODA kann Anteile pausieren, aber nicht wegnehmen und nicht selbst halten.
- Dokumente liegen verschlüsselt in der Schweiz-nahen Infrastruktur (Supabase, Region Zürich); ihr Fingerabdruck (SHA-256) wird im öffentlichen Register verankert, damit niemand ein Dokument unbemerkt austauschen kann.
- Off-Chain entscheidet (Prüfung, Freigabe, Identität), On-Chain führt aus (Register der Anteile).

## Risiken (immer nennen, wenn es um Investitionen geht)
- Unternehmerisches Risiko bis zum Totalverlust des eingesetzten Kapitals.
- Anteile sind nicht handelbar; kein Sekundärmarkt; Kapital ist für die Laufzeit gebunden.
- Keine Garantie, keine Renditezusage, keine Einlagensicherung. Sicherheiten können im Verlustfall weniger wert sein als das eingesetzte Kapital.
- LIQUODA prüft Vollständigkeit und Plausibilität, nicht die Richtigkeit aller Angaben; die Verantwortung für die Angaben liegt beim Kapitalnehmer.

## Seiten der Website
- Startseite: /
- Projekte (Marktplatz): /projekte
- So funktioniert es: /so-funktioniert-es
- Für Kapitalnehmer (inkl. Pakete und Projektanfrage): /fuer-emittenten
- Registrieren: /registrieren  ·  Anmelden: /login
- Portfolio (Investor): /portfolio  ·  Dashboard (Kapitalnehmer): /emittent
- Impressum: /impressum  ·  Datenschutz: /datenschutz  ·  AGB: /agb  ·  Risikohinweise: /risiken
Englische Fassung: gleiche Pfade mit Präfix /en (z. B. /en/projekte).

## Stand
Die Plattform ist im Testbetrieb: Zahlungen laufen im Stripe-Testmodus, das Register auf dem Polygon-Testnetz. Rechtliche Texte (AGB, Datenschutz, Risikohinweise) sind Entwürfe und werden vor dem Start durch eine Fachperson ersetzt.
`.trim();
