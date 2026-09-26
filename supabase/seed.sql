-- LIQUODA – Beispieldaten für den Marktplatz
-- Erzeugt aus lib/projects/example-data.ts (npm run seed:generate). Idempotent: bestehende Einträge werden übersprungen.
-- Ausführen: supabase db push --include-seed   (oder Inhalt im SQL-Editor ausführen)
--
-- Für jedes Projekt wird ein Demo-Emittent in auth.users angelegt (bestätigt, zufälliges
-- Passwort, kein Login möglich). Der Trigger handle_new_user legt das Profil in public.users an.

do $$
declare
  v_auth uuid;
  v_user uuid;
begin

  -- Pizzeria Wander, Bern
  v_auth := 'a0000000-0000-4000-8000-000000000001';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      'demo-emittent-1@liquoda.example', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Wander Gastro GmbH","role":"emittent"}'::jsonb, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = 'pizzeria-wander-bern') then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      'pizzeria-wander-bern', v_user, '{"de":"Pizzeria Wander, Bern","en":"Pizzeria Wander, Bern"}'::jsonb, '{"de":"Familienbetrieb in der Berner Länggasse. Das Kapital dient dem Ausbau der Terrasse und dem Ersatz der Küchenausstattung.","en":"Family-run restaurant in Bern’s Länggasse district. The capital funds the terrace extension and replacement of kitchen equipment."}'::jsonb,
      '{"de":["Die Pizzeria Wander besteht seit 2011 und wird in zweiter Generation geführt. Der Betrieb hat 42 Sitzplätze innen und 24 auf der bestehenden Terrasse. Die Auslastung liegt im Sommer regelmässig an der Kapazitätsgrenze.","Geplant sind eine Erweiterung der Terrasse um 20 Plätze sowie der Ersatz von Pizzaofen und Kühlanlage. Die Investoren erhalten fungible Anteile am Projektvehikel. Die Rückführung des Kapitals ist über eine Laufzeit von fünf Jahren aus dem laufenden Betrieb vorgesehen."],"en":["Pizzeria Wander has existed since 2011 and is run by the second generation. The restaurant has 42 seats inside and 24 on the existing terrace. In summer, occupancy regularly reaches capacity.","The plan is to extend the terrace by 20 seats and replace the pizza oven and refrigeration. Investors receive fungible shares in the project vehicle. Repayment of the capital is planned over a term of five years from ongoing operations."]}'::jsonb,
      '{"de":"Terrassenerweiterung, neuer Pizzaofen, neue Kühlanlage.","en":"Terrace extension, new pizza oven, new refrigeration."}'::jsonb, '{"de":"Bern BE","en":"Bern BE"}'::jsonb,
      '{"de":["Der Betrieb ist von der Saison und vom Wetter abhängig. Ein schlechter Sommer verringert den Umsatz der Terrasse.","Die Rückführung des Kapitals hängt vom laufenden Geschäftsgang ab. Bei einer Betriebsaufgabe kann das Kapital ganz oder teilweise verloren gehen."],"en":["The business depends on the season and the weather. A poor summer reduces terrace revenue.","Repayment depends on ongoing business performance. If the business closes, the capital may be lost in full or in part."]}'::jsonb,
      'company', 30000, 1000, 20100,
      '2026-12-31', 'active', 'erc20',
      'none', null
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
        ('prospectus', '{"de":"Projektbeschrieb","en":"Project description"}'::jsonb, 2, '2026-09-01T12:00:00Z'::timestamptz),
        ('financials', '{"de":"Jahresrechnung 2025","en":"Annual accounts 2025"}'::jsonb, 1, '2026-04-12T12:00:00Z'::timestamptz),
        ('contract', '{"de":"Beteiligungsvertrag (Muster)","en":"Participation agreement (template)"}'::jsonb, 1, '2026-08-20T12:00:00Z'::timestamptz)
      ) as d(type, title, version, created_at)
     where slug = 'pizzeria-wander-bern';
  end if;

  -- Mehrfamilienhaus Vera, Thun
  v_auth := 'a0000000-0000-4000-8000-000000000002';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      'demo-emittent-2@liquoda.example', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Vera Immobilien AG","role":"emittent"}'::jsonb, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = 'mehrfamilienhaus-vera-thun') then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      'mehrfamilienhaus-vera-thun', v_user, '{"de":"Mehrfamilienhaus Vera, Thun","en":"Apartment building Vera, Thun"}'::jsonb, '{"de":"Energetische Sanierung eines Mehrfamilienhauses mit acht Wohnungen: Dach, Fassade und Heizungsersatz.","en":"Energy renovation of an apartment building with eight flats: roof, façade and heating replacement."}'::jsonb,
      '{"de":["Das Gebäude aus dem Jahr 1972 ist vollständig vermietet. Die Eigentümerin plant den Ersatz der Ölheizung durch eine Wärmepumpe, die Dämmung von Dach und Fassade sowie eine Photovoltaikanlage auf dem Dach.","Die Finanzierung ergänzt ein Bankdarlehen. Investoren erhalten fungible Anteile am Sanierungsvehikel mit einer Laufzeit von acht Jahren. Die Rückführung ist aus den Mieterträgen vorgesehen."],"en":["The building dates from 1972 and is fully let. The owner plans to replace the oil heating with a heat pump, insulate the roof and façade and install a photovoltaic system on the roof.","The financing complements a bank loan. Investors receive fungible shares in the renovation vehicle with a term of eight years. Repayment is planned from rental income."]}'::jsonb,
      '{"de":"Wärmepumpe, Dämmung Dach und Fassade, Photovoltaikanlage.","en":"Heat pump, roof and façade insulation, photovoltaic system."}'::jsonb, '{"de":"Thun BE","en":"Thun BE"}'::jsonb,
      '{"de":["Bauprojekte können teurer werden oder länger dauern als geplant.","Leerstände oder sinkende Mieten verringern die Mittel für die Rückführung.","Die Beteiligung ist über acht Jahre gebunden. Es gibt keinen Sekundärmarkt."],"en":["Construction projects can become more expensive or take longer than planned.","Vacancies or falling rents reduce the funds available for repayment.","The participation is locked for eight years. There is no secondary market."]}'::jsonb,
      'real_estate', 600000, 1000, 138000,
      '2027-03-31', 'active', 'erc20',
      'pledge', 'Nachrangiges Grundpfand auf der Liegenschaft zugunsten des Sanierungsvehikels. Rang und Höhe sind im Beteiligungsvertrag geregelt.'
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
        ('prospectus', '{"de":"Sanierungskonzept","en":"Renovation concept"}'::jsonb, 1, '2026-07-15T12:00:00Z'::timestamptz),
        ('valuation', '{"de":"Verkehrswertschätzung","en":"Market value appraisal"}'::jsonb, 1, '2026-06-02T12:00:00Z'::timestamptz),
        ('financials', '{"de":"Mietertragsaufstellung","en":"Rental income statement"}'::jsonb, 1, '2026-07-15T12:00:00Z'::timestamptz),
        ('contract', '{"de":"Beteiligungsvertrag (Muster)","en":"Participation agreement (template)"}'::jsonb, 1, '2026-08-01T12:00:00Z'::timestamptz)
      ) as d(type, title, version, created_at)
     where slug = 'mehrfamilienhaus-vera-thun';
  end if;

  -- Display Solutions AG
  v_auth := 'a0000000-0000-4000-8000-000000000003';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      'demo-emittent-3@liquoda.example', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Display Solutions AG","role":"emittent"}'::jsonb, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = 'display-solutions-ag') then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      'display-solutions-ag', v_user, '{"de":"Display Solutions AG","en":"Display Solutions AG"}'::jsonb, '{"de":"Junges Unternehmen für digitale Beschriftungssysteme im Detailhandel. Das Kapital finanziert die erste Serienproduktion.","en":"Young company for digital signage systems in retail. The capital funds the first series production."}'::jsonb,
      '{"de":["Display Solutions entwickelt elektronische Preisschilder und Regaldisplays für kleine und mittlere Detailhändler. Ein Pilotprojekt mit drei Filialen läuft seit Anfang 2026.","Mit dem Kapital wird eine erste Serie von 2000 Einheiten produziert. Investoren erhalten fungible Anteile mit einer Laufzeit von vier Jahren. Das Unternehmen ist in einer frühen Phase; der Geschäftsverlauf ist noch nicht erprobt."],"en":["Display Solutions develops electronic price tags and shelf displays for small and medium-sized retailers. A pilot with three stores has been running since early 2026.","The capital funds a first series of 2,000 units. Investors receive fungible shares with a term of four years. The company is at an early stage; its business performance is not yet proven."]}'::jsonb,
      '{"de":"Erste Serienproduktion von 2000 Einheiten, Zertifizierung.","en":"First series production of 2,000 units, certification."}'::jsonb, '{"de":"Winterthur ZH","en":"Winterthur ZH"}'::jsonb,
      '{"de":["Frühphasenunternehmen scheitern häufig. Ein Totalverlust ist möglich.","Der Finanzplan beruht auf Annahmen zu Absatz und Preisen, die noch nicht bestätigt sind."],"en":["Early-stage companies frequently fail. A total loss is possible.","The financial plan is based on assumptions about sales and prices that are not yet confirmed."]}'::jsonb,
      'company', 100000, 1000, 45000,
      '2027-01-31', 'active', 'erc20',
      'none', null
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
        ('prospectus', '{"de":"Businessplan (Kurzfassung)","en":"Business plan (summary)"}'::jsonb, 3, '2026-08-28T12:00:00Z'::timestamptz),
        ('financials', '{"de":"Finanzplan 2026 bis 2029","en":"Financial plan 2026 to 2029"}'::jsonb, 2, '2026-08-28T12:00:00Z'::timestamptz),
        ('contract', '{"de":"Beteiligungsvertrag (Muster)","en":"Participation agreement (template)"}'::jsonb, 1, '2026-09-05T12:00:00Z'::timestamptz)
      ) as d(type, title, version, created_at)
     where slug = 'display-solutions-ag';
  end if;

  -- Solaranlage Gewerbedach, Burgdorf
  v_auth := 'a0000000-0000-4000-8000-000000000004';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      'demo-emittent-4@liquoda.example', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Emme Solar GmbH","role":"emittent"}'::jsonb, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = 'solaranlage-gewerbedach-burgdorf') then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      'solaranlage-gewerbedach-burgdorf', v_user, '{"de":"Solaranlage Gewerbedach, Burgdorf","en":"Solar plant on commercial roof, Burgdorf"}'::jsonb, '{"de":"Photovoltaikanlage mit 280 kWp auf dem Dach einer Logistikhalle. Der Strom wird an den Hallenbetreiber und ins Netz verkauft.","en":"Photovoltaic plant with 280 kWp on the roof of a logistics hall. Electricity is sold to the hall operator and to the grid."}'::jsonb,
      '{"de":["Die Anlage wurde im Sommer 2026 in Betrieb genommen. Mit dem Betreiber der Halle besteht ein Abnahmevertrag über 15 Jahre für rund 60 Prozent der Produktion. Der Rest wird ins Netz eingespeist.","Die Finanzierungsrunde ist abgeschlossen. Investoren halten fungible Anteile mit einer Laufzeit von zwölf Jahren. Die Rückführung erfolgt aus den Stromerlösen."],"en":["The plant was commissioned in summer 2026. A 15-year purchase agreement with the hall operator covers around 60 percent of production. The remainder is fed into the grid.","The funding round is complete. Investors hold fungible shares with a term of twelve years. Repayment comes from electricity revenues."]}'::jsonb,
      '{"de":"Bau und Inbetriebnahme der Photovoltaikanlage.","en":"Construction and commissioning of the photovoltaic plant."}'::jsonb, '{"de":"Burgdorf BE","en":"Burgdorf BE"}'::jsonb,
      '{"de":["Die Stromerlöse hängen von Sonneneinstrahlung und Marktpreisen ab. Beides schwankt.","Fällt der Hallenbetreiber als Abnehmer aus, sinken die Erlöse."],"en":["Electricity revenues depend on solar irradiation and market prices. Both fluctuate.","If the hall operator ceases to purchase, revenues fall."]}'::jsonb,
      'energy', 250000, 1000, 250000,
      '2026-06-30', 'funded', 'erc20',
      'guarantee', 'Abnahmevertrag mit dem Hallenbetreiber über 15 Jahre; keine Bankgarantie.'
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
        ('prospectus', '{"de":"Anlagebeschrieb und Ertragsprognose des Installateurs","en":"Plant description and yield estimate by the installer"}'::jsonb, 1, '2026-02-10T12:00:00Z'::timestamptz),
        ('contract', '{"de":"Stromabnahmevertrag (Auszug)","en":"Power purchase agreement (excerpt)"}'::jsonb, 1, '2026-03-01T12:00:00Z'::timestamptz),
        ('contract', '{"de":"Beteiligungsvertrag","en":"Participation agreement"}'::jsonb, 2, '2026-06-30T12:00:00Z'::timestamptz)
      ) as d(type, title, version, created_at)
     where slug = 'solaranlage-gewerbedach-burgdorf';
  end if;

  -- Porsche 356 A Coupé, Jahrgang 1958
  v_auth := 'a0000000-0000-4000-8000-000000000005';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      'demo-emittent-5@liquoda.example', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Classic Garage Aarau AG","role":"emittent"}'::jsonb, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = 'porsche-356-coupe-1958') then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      'porsche-356-coupe-1958', v_user, '{"de":"Porsche 356 A Coupé, Jahrgang 1958","en":"Porsche 356 A Coupé, 1958"}'::jsonb, '{"de":"Einzelnes Sammlerfahrzeug mit dokumentierter Historie. Der Eigentümer setzt einen Teil des Werts frei, ohne das Fahrzeug zu verkaufen.","en":"Single collector car with documented history. The owner releases part of the value without selling the vehicle."}'::jsonb,
      '{"de":["Das Fahrzeug befindet sich seit 2014 im Besitz der Emittentin und wurde 2019 restauriert. Es ist versichert und in einer klimatisierten Halle eingelagert. Ein unabhängiges Gutachten liegt vor.","Die Beteiligung ist als einzelner Token (ERC-721) abgebildet, der die Beteiligung am Fahrzeug als Ganzes repräsentiert. Die Runde ist abgeschlossen. Die Laufzeit beträgt sechs Jahre; danach ist ein Rückkauf durch die Emittentin oder ein Verkauf des Fahrzeugs vorgesehen."],"en":["The vehicle has been owned by the issuer since 2014 and was restored in 2019. It is insured and stored in a climate-controlled hall. An independent appraisal is available.","The participation is represented by a single token (ERC-721) that represents the participation in the vehicle as a whole. The round is complete. The term is six years; after that, a buy-back by the issuer or a sale of the vehicle is planned."]}'::jsonb,
      '{"de":"Freisetzung von Kapital für die Restaurierung weiterer Fahrzeuge.","en":"Releasing capital for the restoration of further vehicles."}'::jsonb, '{"de":"Aarau AG","en":"Aarau AG"}'::jsonb,
      '{"de":["Der Wert von Sammlerfahrzeugen schwankt und kann sinken. Ein Verkauf kann Zeit brauchen.","Schäden oder Diebstahl sind versichert, doch Versicherungsleistungen können unter dem Gutachtenwert liegen."],"en":["The value of collector cars fluctuates and can fall. A sale can take time.","Damage or theft is insured, but insurance payouts can be below the appraised value."]}'::jsonb,
      'collectible', 85000, 5000, 85000,
      '2026-08-15', 'funded', 'erc721',
      'pledge', 'Faustpfand am Fahrzeug, eingelagert bei der Emittentin; Versicherung zugunsten des Vehikels.'
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
        ('valuation', '{"de":"Fahrzeuggutachten","en":"Vehicle appraisal"}'::jsonb, 1, '2026-04-22T12:00:00Z'::timestamptz),
        ('other', '{"de":"Versicherungsnachweis","en":"Proof of insurance"}'::jsonb, 1, '2026-05-03T12:00:00Z'::timestamptz),
        ('contract', '{"de":"Beteiligungsvertrag","en":"Participation agreement"}'::jsonb, 1, '2026-08-15T12:00:00Z'::timestamptz)
      ) as d(type, title, version, created_at)
     where slug = 'porsche-356-coupe-1958';
  end if;

  -- Schreinerei Huber, Maschinenpark
  v_auth := 'a0000000-0000-4000-8000-000000000006';
  if not exists (select 1 from auth.users where id = v_auth) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth, 'authenticated', 'authenticated',
      'demo-emittent-6@liquoda.example', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Schreinerei Huber AG","role":"emittent"}'::jsonb, now(), now(), '', '', '', ''
    );
  end if;
  select id into v_user from public.users where auth_id = v_auth;

  if not exists (select 1 from public.projects where slug = 'schreinerei-huber-maschinenpark') then
    insert into public.projects (
      slug, emittent_id, title, summary, description, purpose, location, risks,
      asset_type, target_amount_chf, min_investment_chf, raised_amount_chf, deadline, status, token_model,
      collateral_type, collateral_note
    ) values (
      'schreinerei-huber-maschinenpark', v_user, '{"de":"Schreinerei Huber, Maschinenpark","en":"Huber joinery, machinery"}'::jsonb, '{"de":"Ersatz von zwei CNC-Maschinen. Das Finanzierungsziel wurde innerhalb der Laufzeit nicht erreicht; die Runde wurde rückabgewickelt.","en":"Replacement of two CNC machines. The funding target was not reached within the term; the round was reversed."}'::jsonb,
      '{"de":["Die Schreinerei Huber beschäftigt 14 Mitarbeitende und plante den Ersatz von zwei CNC-Bearbeitungszentren. Die Finanzierungsrunde lief von Februar bis Mai 2026.","Bis zum Ende der Laufzeit wurden 34 Prozent des Zielbetrags erreicht. Gemäss Ablauf wurden keine Token ausgegeben. Alle Zahlungen wurden an die Investoren zurückerstattet."],"en":["Huber joinery employs 14 people and planned to replace two CNC machining centres. The funding round ran from February to May 2026.","By the end of the term, 34 percent of the target amount was reached. As per the process, no tokens were issued. All payments were refunded to investors."]}'::jsonb,
      '{"de":"Ersatz von zwei CNC-Bearbeitungszentren.","en":"Replacement of two CNC machining centres."}'::jsonb, '{"de":"Sursee LU","en":"Sursee LU"}'::jsonb,
      '{"de":["Investitionen in Produktionsmittel zahlen sich nur aus, wenn die Auftragslage stabil bleibt."],"en":["Investments in production equipment only pay off if the order situation remains stable."]}'::jsonb,
      'company', 120000, 1000, 41000,
      '2026-05-31', 'failed', 'erc20',
      'none', null
    );
    insert into public.documents (project_id, type, title, version, created_at)
    select id, d.type::public.document_type, d.title, d.version, d.created_at
      from public.projects, (values
        ('prospectus', '{"de":"Projektbeschrieb","en":"Project description"}'::jsonb, 1, '2026-01-20T12:00:00Z'::timestamptz),
        ('financials', '{"de":"Jahresrechnung 2025","en":"Annual accounts 2025"}'::jsonb, 1, '2026-03-30T12:00:00Z'::timestamptz)
      ) as d(type, title, version, created_at)
     where slug = 'schreinerei-huber-maschinenpark';
  end if;
end $$;
