-- LIQUODA – Etappe 19: weitere Dokumentarten, Sichtbarkeit je Dokument, Sichtvermerk durch LIQUODA
alter type public.document_type add value if not exists 'business_plan';
alter type public.document_type add value if not exists 'financing_concept';
alter type public.document_type add value if not exists 'land_register';
alter type public.document_type add value if not exists 'commercial_register';
alter type public.document_type add value if not exists 'ownership_proof';
alter type public.document_type add value if not exists 'insurance';
alter type public.document_type add value if not exists 'yield_report';
alter type public.document_type add value if not exists 'purchase_agreement';
