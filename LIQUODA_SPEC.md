# LIQUODA – Produkt- und Technik-Spezifikation (MVP)

> Kompakte Fassung des Businessplans (Version 1.0, September 2026) als Arbeitsgrundlage für die Entwicklung der Website. Alles, was hier steht, ist verbindlich. Was hier nicht steht, ist nicht im MVP.

---

## 1. Was LIQUODA ist

LIQUODA ist eine **Schweizer, non-custodial Vermittlungs- und Technologieplattform** für die Tokenisierung realer Vermögenswerte. Sie bringt zwei Nutzergruppen zusammen:

- **Emittenten**: KMU, Unternehmer, Eigentümer von Immobilien, Energieprojekten oder Sachwerten (Uhren, Kunst, Fahrzeuge), die Kapital freisetzen wollen, ohne das Asset vollständig zu verkaufen.
- **Investoren**: Privatpersonen, die mit CHF 1'000 bis 20'000 nachvollziehbar in reale Werte investieren wollen.

Anteile werden als Token auf **Polygon** abgebildet. Die Plattform funktioniert wie ein Marktplatz (Prinzip Airbnb): zwei Perspektiven, ein gemeinsamer Prozess.

### Was LIQUODA bewusst NICHT ist (gilt für jeden Text und jede Funktion)

- Keine Bank, kein Finanzinstitut, kein Vermögensverwalter, keine Verwahrstelle
- Kein Investor, kein Garant, keine Anlageberatung
- Keine Trading- oder Spekulationsplattform, kein Sekundärmarkt
- **Verwahrt niemals Geld, Token oder Wallet-Schlüssel**
- Gibt **niemals** Gewinn- oder Renditeversprechen ab

### Leitprinzip

> LIQUODA ersetzt kein Risiko. LIQUODA macht Risiko sichtbar, strukturiert und nachvollziehbar.

---

## 2. UX-Leitprinzipien

1. Verständlichkeit vor Innovation
2. Vertrauen vor Geschwindigkeit
3. Transparenz vor Marketing
4. Klarer Prozess statt Funktionsvielfalt
5. Erst erklären, dann handeln lassen

Wenn ein Nutzer eine Funktion nicht sofort versteht, ist die Funktion falsch gestaltet.

### Sprache und Tonalität (UI-Texte)

- Sachlich, klar, ruhig, erklärend, nicht werblich
- Kurze Sätze, keine Fachbegriffe ohne Erklärung, keine Krypto- oder Finanz-Buzzwords
- Statt «revolutionär» → «strukturiert». Statt «hohe Rendite» → keine Aussage. Statt «Investiere jetzt» → «Investition prüfen»
- Keine Verkaufssprache, keine Dringlichkeit, keine Erfolgsversprechen, keine Gamification
- Fehlermeldungen: neutral, ohne Schuldzuweisung, mit Erklärung der Konsequenz und dem nächsten Schritt
- Zweisprachig DE (Standard, Schweizer Schreibweise: «ss» statt «ß») und EN, via `next-intl` (`messages/de.json`, `messages/en.json`)

### Pflichtinhalte auf relevanten Seiten

- Erklärung der Rolle von LIQUODA (Vermittlungs- und Technologieplattform)
- Hinweis auf unternehmerisches Risiko
- Klarstellung: keine Garantie, keine Renditeversprechen
- Transparente Beschreibung des Ablaufs
- Klare Konsequenzen bei Abbruch oder Scheitern

### Design

- Ruhig, seriös, modern, vertrauensbildend, keine Krypto-Hype-Optik
- Farben: Creme `#FAF7F0` (Hintergrund), Navy `#0B2545` (Text, Flächen), Akzentverlauf `#00C9A7 → #0085FF` (nur für Aktionen und Status, sparsam)
- Schriften: serifenlose Schrift für Text; Serifenschrift (Georgia-Stil) nur für den Schriftzug «LIQUODA.-»
- Bilder: reale Motive (Menschen, Assets, Orte), keine Stockfoto-Übertreibung
- Icons: reduziert, einheitlich (lucide-react), Orientierung statt Dekoration
- Bestehendes: `WaveBackground.tsx`, Logo `public/liquoda-logo-v2.svg`, Komponenten `Button`, `Badge`, `LanguageToggle`, `Navbar`, `Footer`

---

## 3. Seitenstruktur (MVP)

Prinzip: **Öffentlich verstehen → Projekt prüfen → Investieren → Verwalten**

| Route | Seite | Inhalt |
|---|---|---|
| `/[locale]` | Startseite | Was LIQUODA ist und nicht ist, für wen, Einstieg für Investoren und Emittenten, Ablauf in 4–5 Schritten, Beispielprojekte, Trust-Hinweise |
| `/[locale]/so-funktioniert-es` | So funktioniert es | Ablauf Schritt für Schritt für beide Rollen, ohne technische Tiefe |
| `/[locale]/fuer-emittenten` | Für Emittenten | Nutzen, Ablauf der Projektaufnahme, Pakete (Basic / Standard / Premium), Projektanfrage-Formular |
| `/[locale]/projekte` | Marktplatz | Alle aktiven Projekte, Filter nach Asset-Typ, Status (offen / finanziert / geschlossen) |
| `/[locale]/projekte/[slug]` | Projektseite | Beschreibung, Asset, Zielbetrag, Fortschritt, Laufzeit, Dokumente, Abschnitt «Risiken & Hinweise», CTA «Investition prüfen» |
| `/[locale]/registrieren`, `/[locale]/login` | Auth | Kontoerstellung mit Rollenwahl (Investor / Emittent), Login (E-Mail/Passwort oder Magic Link via Supabase Auth) |
| `/[locale]/investieren/[slug]` | Investitionsprozess | Betrag eingeben → Zusammenfassung → aktive Zustimmung zu Risiken → Zahlung in CHF → Bestätigung |
| `/[locale]/portfolio` | Investoren-Bereich | Beteiligungen, Projektstatus, Dokumente, Token-Referenzen |
| `/[locale]/emittent` | Emittenten-Dashboard | Eigene Projekte, Status der Runde, Dokumentenverwaltung, Projekt-Wizard |
| `/admin` | Admin (intern, bereits vorhanden) | Projektprüfung und Freigabe, KYC/KYB-Status, Allowlist, Audit-Log |
| `/[locale]/agb`, `/datenschutz`, `/risiken`, `/haftung` | Rechtliches | AGB, Datenschutz (DSG), Risikoaufklärung, Haftungsausschluss |

---

## 4. User Journeys

### Investor
1. Startseite: versteht in kurzer Zeit, was LIQUODA ist und was nicht
2. Projekte entdecken, filtern
3. Projekt prüfen: Beschreibung, Zweck, Laufzeit, Dokumente, Risiken
4. Registrieren / Login, KYC, Wallet verknüpfen
5. Betrag eingeben, Bedingungen bestätigen, in CHF zahlen
6. Investition wird bestätigt, Token werden zugewiesen
7. Portfolio: Beteiligungen, Dokumente, Projektstatus

### Emittent
1. Seite «Für Emittenten»: Nutzen, Ablauf, Voraussetzungen
2. Projektanfrage mit Eckdaten
3. Registrieren, KYB
4. Projekt-Wizard: Informationen, Dokumente, Zielbetrag, Laufzeit
5. Status «in Prüfung», Rückfragen durch LIQUODA, Anpassungen
6. Freigabe, Projekt geht live
7. Finanzierungsphase verfolgen, Abschluss oder Stornierung

Jeder Schritt zeigt: wo der Nutzer steht, was als Nächstes passiert, welche Konsequenz sein Handeln hat.

---

## 5. Technischer Stack

| Ebene | Lösung |
|---|---|
| Frontend | Next.js (App Router, `app/[locale]`), React, TypeScript, Tailwind, next-intl, lucide-react |
| Hosting | Vercel, automatische Deployments aus GitHub |
| Backend / DB | Supabase: PostgreSQL, Auth, Storage, **Row Level Security** |
| Zahlungen | Stripe (Testmodus im MVP; später ggf. Payrexx für TWINT). Webhooks an Backend. LIQUODA verwahrt kein Geld |
| Blockchain | Polygon; Smart Contracts auf OpenZeppelin-Basis; Wallets via MetaMask / WalletConnect |
| KYC / KYB | Externer Dienst; im MVP zunächst manueller Status im Admin |
| Umgebungen | Trennung Test / Produktion; keine Secrets im Code, alles über `.env.local` bzw. Vercel-Env |

### Architekturprinzip: Off-Chain entscheidet, On-Chain führt aus

**Supabase (off-chain, führende Datenquelle):** Nutzer, Rollen, Projekte, Investitionsbeträge, Dokumente (versioniert), KYC/KYB-Status, Zahlungsreferenzen, Projektstatus, Audit-Log.

**Polygon (on-chain):** Token als digitale Anteile, Besitznachweise (Wallet-Adressen), Allowlist-Prüfung, Dokument-Hashes, Projekt-Referenz. **Niemals** personenbezogene Daten, Verträge oder CHF on-chain.

Die Geschäftslogik liegt im Backend (Supabase-Funktionen / Route Handlers), nicht im Frontend. Das Frontend ist Bedien- und Anzeigeinstrument.

---

## 6. Datenmodell (Core Entities)

```
users            id, auth_id, role (investor|emittent|admin), name, email, kyc_status (pending|approved|rejected), wallet_address, created_at
projects         id, slug, emittent_id, title, asset_type, description, target_amount_chf, min_investment_chf, deadline, status (draft|in_review|approved|active|funded|failed|cancelled|closed), token_model (erc20|erc721|erc1155), created_at
investments      id, project_id, investor_id, amount_chf, status (reserved|paid|confirmed|cancelled|refunded), created_at
documents        id, project_id, investment_id (nullable), type, title, storage_path, version, sha256_hash, created_at
token_references id, investment_id, contract_address, token_id, token_amount, tx_hash, created_at
payment_references id, investment_id, provider, provider_ref, status, amount_chf, created_at
audit_log        id, actor_id, entity, entity_id, action, old_value, new_value, created_at
```

Beziehungen: ein User hat mehrere Projekte oder Investitionen; ein Projekt hat mehrere Investitionen; eine Investition gehört genau zu einem Projekt und einem Investor; Dokumente sind Projekten oder Investitionen zugeordnet; Token- und Zahlungsreferenzen sind an Investitionen gebunden.

**RLS-Regeln:** Investoren sehen nur eigene Investitionen; Emittenten nur eigene Projekte; Admin-Zugriffe explizit; kein «Superuser». Jede Statusänderung erzeugt einen Audit-Log-Eintrag.

**Bewusst nicht im Modell:** Derivate, Sekundärhandel, Rendite- oder Prognoseobjekte.

---

## 7. Investitionsflow (Sequenz)

1. Investor wählt Projekt, gibt Betrag ein
2. Frontend zeigt Zusammenfassung und Risikohinweise; Investor stimmt **aktiv** zu
3. CHF-Zahlung über Stripe (Checkout); Investition erhält Status `reserved`
4. Stripe-Webhook bestätigt Zahlung → Backend speichert `payment_reference`, Investition → `paid`
5. Backend prüft: Projektstatus aktiv, Laufzeit nicht abgelaufen, KYC des Investors `approved`
6. Nur bei erfüllten Bedingungen: Mint-Freigabe; Investor signiert in seiner Wallet; Smart Contract mintet Token in die Wallet des Investors
7. Backend speichert `token_reference` (tx_hash), Investition → `confirmed`, Portfolio aktualisiert

**Scheitert die Finanzierung** (Ziel nicht erreicht, Laufzeit abgelaufen): Projekt → `failed`, alle Investitionen → `refunded` (Rückabwicklung über Stripe), keine Token, Investoren werden informiert.

**Automatische Statuswechsel:** Zahlung erfolgreich → Investition bestätigt; Zielbetrag erreicht → Projekt `funded`; Laufzeit abgelaufen ohne Ziel → `failed`; Mint abgeschlossen → Token-Referenz aktiv. Alles wird protokolliert.

**Manuell (bewusst):** Projektfreigabe, KYC/KYB-Sonderfälle, Zahlungsausnahmen, Eskalationen.

> Zahlung ist Voraussetzung. Backend prüft. Wallet bestätigt. Blockchain beweist.

---

## 8. Smart Contracts (letzte Etappe)

- Nur standardisierte, geprüfte **OpenZeppelin-Templates**, projektspezifisch parametrisiert, keine individuelle Logik
- **Modell A – ERC-20** (Standard im MVP): fungible Projektanteile, KMU-Finanzierungen, Darlehen
- **Modell B – ERC-721**: einzelne Assets (Uhr, Kunstwerk, Oldtimer)
- **Modell C – ERC-1155**: Serien und Editionen (optional)
- Nicht im MVP: ERC-1400
- Gemeinsame Funktionen: Cap (max. Tokenmenge), Allowlist bei Mint und Transfer, Pausable, Rollen Owner / Minter / Pauser, Event-Logging
- Keine Auszahlungs-, Rendite-, Governance- oder Upgrade-Logik
- Token nicht frei übertragbar; Transfer nur an allowlistete Wallets
- Für jedes relevante Dokument wird ein SHA-256-Hash on-chain referenziert
- LIQUODA hält zu keinem Zeitpunkt Token oder private Schlüssel

---

## 9. Sicherheit und Datenschutz

- Secure by Design: keine sensiblen Logiken oder Secrets im Frontend
- Validierung und Sanitizing aller Eingaben serverseitig
- Supabase Auth, Rollen serverseitig zugewiesen, RLS konsequent
- MFA für Admin-Zugänge; Logging von Logins und kritischen Aktionen (Freigaben, Mint-Freigaben)
- Datenminimierung: nur Name, Kontakt, KYC-Daten, Wallet-Adresse (pseudonymisiert); keine personenbezogenen Daten on-chain; kein Verkauf, kein Profiling
- Datenschutz nach Schweizer DSG: Auskunft, Berichtigung, Löschung
- Nutzerfreundliche Fehlermeldungen ohne interne Details

---

## 10. Preismodell (für die Seite «Für Emittenten»)

| Paket | Setup Fee | Plattformgebühr / Monat | Leistungen |
|---|---|---|---|
| Basic | CHF 1'500 | CHF 150 | Projektaufschaltung, standardisierte Projektseite, Basis-Prüfung, Standard-Tokenisierung, Dokumentenablage, E-Mail-Support |
| Standard | CHF 3'500 | CHF 250 | Basic + erweiterte Prüfung, Unterstützung bei Struktur, Smart-Contract-Parameter, Investoren-Dashboard, priorisierter Support |
| Premium | CHF 7'500 | CHF 400 | Standard + intensive Begleitung, Dokumentationshilfe, Strukturierungsberatung (keine Anlageberatung), erweitertes Reporting |

Transaktionsgebühr Emittent: 3 % auf erfolgreich investiertes Volumen (nur bei Erfolg). Transaktionsgebühr Investor: 1 %, transparent ausgewiesen. Keine Erfolgs- oder Renditegebühren. (Alle Preise sind Planannahmen und können angepasst werden.)

---

## 11. Fehler- und Sonderfälle (UX)

| Fall | Anzeige |
|---|---|
| Finanzierungsziel nicht erreicht | «Finanzierung nicht erfolgreich», Erklärung, Hinweis: keine Token ausgegeben, Info zur Rückabwicklung |
| Zahlung fehlgeschlagen | Neutrale Meldung, mögliche Ursachen, erneute Zahlung möglich |
| KYC nicht bestanden | Sachliche Information, Hinweis auf fehlende Angaben, Nachreichung oder Kontakt |
| Investition abgebrochen | Bestätigung, dass keine Verpflichtung entstanden ist |
| Projekt nicht freigegeben | Status mit sachlicher Begründung und Hinweisen zur Anpassung |
| Projekt vorzeitig beendet | Transparenter Grund, Konsequenzen, nächste Schritte |
| Wartung / Störung | Ruhige Information, Dauer, kein Funktionsversprechen |

---

## 12. Nicht im MVP (nicht bauen)

Eigener Stablecoin · Sekundärmarkt / Trading · automatisierte Projektfreigabe · internationale Expansion · Mobile App · DeFi-Mechaniken · Rendite-Dashboards oder Prognosen · vollautomatisierte Auszahlungen · On-Chain-Governance · ERC-1400 · Custom-Rollen · Abos für Investoren
