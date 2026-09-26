# Wie LIQUODA funktioniert – in einfacher Sprache

Stand: 26. September 2026, nach Abschluss des MVP (Etappen 1 bis 6).

## Die Idee in einem Satz

Ein Emittent (z. B. eine Pizzeria) stellt ein Projekt vor, Investoren beteiligen sich mit CHF 1'000 bis 20'000, und jeder Investor erhält seine Anteile als fälschungssicheren digitalen Nachweis. LIQUODA vermittelt und stellt die Technik, verwahrt aber weder Geld noch Anteile.

## Die drei Rollen

| Rolle | Wer | Was er auf liquoda.com tut |
|---|---|---|
| Investor | Privatperson | Projekte ansehen, Konto erstellen, Beteiligung prüfen, bezahlen, Portfolio ansehen |
| Emittent | KMU, Eigentümer | Konto erstellen, Projekt erfassen, Dokumente hochladen, einreichen, Finanzierung verfolgen |
| Admin (Marcel) | LIQUODA | Identitäten bestätigen, Projekte freigeben, Anteile zuweisen, alles nachvollziehen |

## Der Weg eines Emittenten

1. Registriert sich als Emittent, bestätigt seine E-Mail.
2. Marcel prüft das Unternehmen ausserhalb der Plattform (KYB) und setzt im Admin den Status auf «Bestätigt».
3. Der Emittent erfasst sein Projekt im Wizard: Titel, Texte, Zielbetrag, Mindestbetrag, Laufzeit, Absicherung, Dokumente.
4. Er reicht es ein. Das Projekt ist jetzt eingefroren und steht im Admin unter «In Prüfung».
5. Marcel gibt frei (Projekt erscheint sofort im Marktplatz) oder stellt eine Rückfrage (Projekt geht mit Begründung zurück an den Emittenten).
6. Marcel legt im Admin mit einem Klick den Vertrag auf der Blockchain an. Das ist das digitale Register für die Anteile dieses Projekts.
7. Während der Laufzeit sieht der Emittent im Dashboard, wie viel bereits investiert wurde.
8. Ziel erreicht: Projekt wird automatisch «Finanziert». Laufzeit abgelaufen ohne Ziel: automatisch «Nicht erfolgreich», Zahlungen werden zurückerstattet (Rückerstattung selbst ist noch manuell über Stripe).

## Der Weg eines Investors

1. Registriert sich als Investor, bestätigt seine E-Mail.
2. Marcel prüft die Identität ausserhalb der Plattform (KYC) und setzt den Status auf «Bestätigt». Vorher ist keine Beteiligung möglich.
3. Der Investor wählt ein Projekt, gibt einen Betrag ein, sieht die Zusammenfassung mit 1 % Gebühr und bestätigt aktiv fünf Risikohinweise.
4. Er bezahlt per Karte auf der Stripe-Seite und kommt zurück zu LIQUODA. Die Beteiligung steht auf «Bezahlt».
5. Er verknüpft eine Wallet (heute: MetaMask; ab Etappe 7 automatisch beim Registrieren, ohne Zutun).
6. Marcel klickt im Admin auf «Mint freigeben». Das System prüft Zahlung, Projektstatus, Laufzeit, Identität und Wallet und überträgt die Anteile in die Wallet des Investors.
7. Im Portfolio sieht der Investor: Beteiligung «Bestätigt», Zahlungsreferenz, Dokumente des Projekts, seine Anteile mit Link auf das öffentliche Register.

## Wo das Geld ist und wo die Anteile sind

- Geld: Der Investor zahlt an das Stripe-Konto von LIQUODA. Von dort überweist Marcel es nach erfolgreicher Finanzierung manuell an den Emittenten. Eine automatische Auszahlung ist im MVP bewusst nicht gebaut.
- Anteile: Liegen als Token auf der Polygon-Blockchain in der Wallet des Investors. LIQUODA kann sie sehen, pausieren und nur an geprüfte Wallets übertragen lassen, aber nicht wegnehmen und nicht selbst halten.
- Dokumente: Liegen verschlüsselt bei Supabase. Ihr Fingerabdruck (SHA-256) wird beim Anlegen des Vertrags auf der Blockchain verankert, damit später niemand ein Dokument unbemerkt austauschen kann.

## Was ausserhalb von liquoda.com passiert

- Identitätsprüfung (Ausweis anschauen): per E-Mail oder Termin, Ergebnis trägt Marcel im Admin ein.
- Kartenzahlung: kurz auf der Stripe-Seite.
- Rückerstattungen: im Stripe-Dashboard.
- Testguthaben für das Blockchain-Konto: einmalig über einen «Faucet» (nur im Testnetz).

## Was es bewusst nicht gibt

Kein Sekundärmarkt, kein Verkauf von Anteilen zwischen Investoren, keine Auszahlung von Erträgen, keine Prognosen, keine Garantien, keine Versicherung durch LIQUODA.

## Die Dienste dahinter

| Dienst | Aufgabe | Konto nötig | Kosten |
|---|---|---|---|
| Vercel | Hosting der Website | ja | Gratis-Stufe |
| Supabase | Datenbank, Login, Dokumente | ja | Gratis-Stufe |
| Stripe | Kartenzahlung (Testmodus) | ja | pro Zahlung |
| Polygon | Öffentliches Register für Anteile | nein | Rappen pro Aktion, zahlt LIQUODA |
| MetaMask | Geldbörse des Investors | nein (Investor selbst) | gratis |
| Resend (geplant) | E-Mail-Versand | ja | Gratis-Stufe |

## Was vor einem echten Start noch fehlt

1. E-Mail-Versand (Bestätigungen, Statusmeldungen) über Resend.
2. Eingebettete Wallet, damit Investoren nichts installieren müssen (Etappe 7).
3. Rückerstattungen bei nicht erreichtem Ziel automatisch über Stripe.
4. Schutz des Blockchain-Schlüssels in einem Schlüsseldienst statt als Umgebungsvariable.
5. Rechtliche Texte (AGB, Datenschutz, Risiken, Haftung) durch Fachperson ersetzen.
6. Stripe und Polygon von Test- auf Echtbetrieb umstellen.
