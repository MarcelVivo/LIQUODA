'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import WaveBackground from '@/components/ui/WaveBackground';

type Role = 'Emittent' | 'Investor' | '';
type Lang = 'de' | 'en';

interface FormState {
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
}

interface FormErrors {
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const copy = {
  de: {
    banner: 'LIQUODA launches soon. Be among the first to tokenize or invest in real assets.',
    preRegister: 'Pre-Register',
    forIssuers: 'Für Emittenten',
    issuersP1:
      'Du hast ein konkretes Projekt und brauchst Kapital. Kein Bankenmarathon, kein Pitch vor einem Gremium. Auf LIQUODA stellst du dein Vorhaben digital vor und erreichst direkt Investoren, die in reale Projekte investieren wollen.',
    issuersP2:
      'Ob du einen Gastrobetrieb finanzieren, eine Immobilie entwickeln oder ein Startup auf die Beine stellen willst: LIQUODA tokenisiert dein Projekt auf der Blockchain und macht deine Investoren zu verifizierten Teilhabern. Transparent, nachvollziehbar, ohne Umwege.',
    forInvestors: 'Für Investoren',
    investorsP1:
      'Du willst dein Geld in etwas Echtes stecken. Nicht in abstrakte Finanzprodukte, sondern in Projekte, die du verstehst und die du siehst.',
    investorsP2:
      'LIQUODA gibt dir Zugang zu tokenisierten Realwerten. Ab CHF 100 investierst du direkt in Schweizer Projekte, erhältst einen digitalen Token als Besitznachweis auf der Polygon-Blockchain und weisst jederzeit, wo dein Geld steckt. Keine Plattform, die dein Kapital verwahrt. Keine Anlageempfehlungen. Nur ein direkter, technisch gesicherter Kanal zwischen dir und dem Emittenten.',
    modalTitle: 'Pre-Registrierung',
    issuerLabel: 'Emittent',
    investorLabel: 'Investor',
    firstNamePlaceholder: 'Vorname',
    lastNamePlaceholder: 'Nachname',
    emailPlaceholder: 'E-Mail',
    submitButton: 'Registrieren',
    successTitle: 'More Details coming soon',
    successMessage: 'Wir melden uns bei dir.',
    impressumLink: 'Impressum',
    datenschutzLink: 'Datenschutz',
    copyright: '© 2026 LIQUODA',
    errorRole: 'Bitte wähle eine Rolle.',
    errorFirstName: 'Pflichtfeld',
    errorLastName: 'Pflichtfeld',
    errorEmail: 'Ungültige E-Mail-Adresse',
    impressumTitle: 'Impressum',
    impressumContent: [
      'Marcel Spahr',
      'Schwarzenburgstrasse 65',
      '3008 Bern',
      'info@liquoda.com',
      '+41 79 511 09 11',
    ],
    datenschutzTitle: 'Datenschutzerklärung',
    datenschutzContent:
      'LIQUODA, betrieben von Marcel Spahr, Schwarzenburgstrasse 65, 3008 Bern, erhebt bei der Pre-Registrierung folgende Daten: Vorname, Nachname und E-Mail-Adresse. Diese Daten werden ausschliesslich verwendet, um dich über den Launch der Plattform zu informieren und dich bei Bedarf zu kontaktieren. Deine Daten werden nicht an Dritte weitergegeben und nicht für Werbezwecke genutzt. Du hast jederzeit das Recht auf Auskunft, Berichtigung oder Löschung deiner Daten. Kontakt: info@liquoda.com.',
  },
  en: {
    banner: 'LIQUODA launches soon. Be among the first to tokenize or invest in real assets.',
    preRegister: 'Pre-Register',
    forIssuers: 'For Issuers',
    issuersP1:
      'You have a concrete project and need capital. No bank marathon, no pitch to a committee. On LIQUODA, you present your project digitally and reach investors directly who want to invest in real projects.',
    issuersP2:
      'Whether you want to finance a restaurant, develop real estate, or launch a startup: LIQUODA tokenizes your project on the blockchain and turns your investors into verified stakeholders. Transparent, traceable, without detours.',
    forInvestors: 'For Investors',
    investorsP1:
      'You want to put your money into something real. Not abstract financial products, but projects you understand and can see.',
    investorsP2:
      'LIQUODA gives you access to tokenized real assets. Starting at CHF 100, you invest directly in Swiss projects, receive a digital token as proof of ownership on the Polygon blockchain, and always know where your money is. No platform holding your capital. No investment advice. Just a direct, technically secured channel between you and the issuer.',
    modalTitle: 'Pre-Registration',
    issuerLabel: 'Issuer',
    investorLabel: 'Investor',
    firstNamePlaceholder: 'First name',
    lastNamePlaceholder: 'Last name',
    emailPlaceholder: 'E-mail',
    submitButton: 'Register',
    successTitle: 'More Details coming soon',
    successMessage: 'We will be in touch soon.',
    impressumLink: 'Legal Notice',
    datenschutzLink: 'Privacy Policy',
    copyright: '© 2026 LIQUODA',
    errorRole: 'Please select a role.',
    errorFirstName: 'Required',
    errorLastName: 'Required',
    errorEmail: 'Invalid email address',
    impressumTitle: 'Legal Notice',
    impressumContent: [
      'Marcel Spahr',
      'Schwarzenburgstrasse 65',
      '3008 Bern',
      'info@liquoda.com',
      '+41 79 511 09 11',
    ],
    datenschutzTitle: 'Privacy Policy',
    datenschutzContent:
      'LIQUODA, operated by Marcel Spahr, Schwarzenburgstrasse 65, 3008 Bern, collects the following data during pre-registration: first name, last name, and email address. This data is used exclusively to inform you about the platform launch and to contact you if necessary. Your data will not be shared with third parties or used for advertising purposes. You have the right to access, correct, or delete your data at any time. Contact: info@liquoda.com.',
  },
};

export default function ComingSoon() {
  const [lang, setLang] = useState<Lang>('de');
  const [modalOpen, setModalOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({ role: '', firstName: '', lastName: '', email: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const c = copy[lang];

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.role) e.role = c.errorRole;
    if (!form.firstName.trim()) e.firstName = c.errorFirstName;
    if (!form.lastName.trim()) e.lastName = c.errorLastName;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = c.errorEmail;
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: form.role,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        }),
      });
    } catch {
      // show success regardless — don't block UX on network error
    }
    setSubmitted(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitted(false);
    setForm({ role: '', firstName: '', lastName: '', email: '' });
    setErrors({});
  };

  return (
    <>
      {/* Top announcement banner */}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-[#1fc3a6]/20 bg-[#071925]/90 px-4 py-3 backdrop-blur-md">
        <p className="text-center text-[11px] font-medium tracking-[0.2em] text-[#dbe7ea]">
          {c.banner}
        </p>
      </div>

      <main className="relative isolate flex min-h-screen select-none flex-col items-center justify-start overflow-hidden bg-[#071925] pt-32 md:justify-center md:pt-20">
        <WaveBackground />

        {/* Logo */}
        <div className="relative z-10 flex items-baseline px-4 leading-none" aria-label="Liquoda">
          <span
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(2rem, 13vw, 6rem)',
              fontWeight: 400,
              letterSpacing: '0.03em',
              color: '#f2f7f7',
              lineHeight: 1,
            }}
          >
            Liquoda
          </span>
          <span
            className="liq-logo-accent"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(2rem, 13vw, 6rem)',
              fontWeight: 700,
              lineHeight: 1,
              display: 'inline-block',
            }}
          >
            .-
          </span>
        </div>

        {/* Slogan */}
        <p className="relative z-10 mt-5 text-[10px] font-medium uppercase tracking-[0.38em] text-[#7895a3] sm:text-xs">
          Real Assets . Digital Security
        </p>

        {/* Pre-Register button */}
        <button
          onClick={() => setModalOpen(true)}
          className="relative z-10 mt-10 rounded-full border border-[#22c6a9]/75 bg-[#16b99c]/10 px-10 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#65dcc7] shadow-[0_0_28px_rgba(25,196,163,0.08)] transition-all hover:bg-[#16b99c]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fc3a6]"
        >
          {c.preRegister}
        </button>

        {/* DE / EN toggle — centered above the two text columns */}
        <div className="relative z-10 mt-14 flex items-center rounded-full border border-[#5a8995]/25 bg-[#071925]/45 p-0.5 backdrop-blur-sm">
          {(['de', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                'px-5 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors',
                lang === l
                  ? 'bg-[#1ab99d] text-[#061721] shadow-[0_0_18px_rgba(26,185,157,0.2)]'
                  : 'text-[#7895a3] hover:text-[#dbe7ea]',
              ].join(' ')}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Two-column info section */}
        <div className="relative z-10 mt-8 flex w-full max-w-4xl flex-col gap-10 px-6 pb-20 sm:px-10 md:flex-row md:gap-0">

          {/* For Issuers */}
          <div className="flex-1 md:pr-10 text-justify">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1fc3a6]">
              {c.forIssuers}
            </p>
            <p className="text-[13px] leading-[1.85] text-[#9bb0b8]">{c.issuersP1}</p>
            <p className="mt-4 text-[13px] leading-[1.85] text-[#9bb0b8]">{c.issuersP2}</p>
          </div>

          {/* Vertical divider */}
          <div className="mx-0 hidden w-px self-stretch bg-[#5a8995]/25 md:block" />
          {/* Mobile horizontal divider */}
          <div className="block h-px w-full bg-[#5a8995]/25 md:hidden" />

          {/* For Investors */}
          <div className="flex-1 md:pl-10 text-justify">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1fc3a6]">
              {c.forInvestors}
            </p>
            <p className="text-[13px] leading-[1.85] text-[#9bb0b8]">{c.investorsP1}</p>
            <p className="mt-4 text-[13px] leading-[1.85] text-[#9bb0b8]">{c.investorsP2}</p>
          </div>
        </div>

        {/* Pre-register modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b11]/70 px-4 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div className="relative w-full max-w-md rounded-2xl border border-[#2d6670]/35 bg-[#0a202e]/95 p-8 shadow-2xl shadow-black/40">
              <button
                onClick={closeModal}
                aria-label="Close"
                className="absolute right-4 top-4 text-[#7895a3] transition-colors hover:text-white"
              >
                <X size={20} />
              </button>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <p className="text-lg font-semibold tracking-wide text-[#1fc3a6]">{c.successTitle}</p>
                  <p className="text-sm text-[#9bb0b8]">{c.successMessage}</p>
                </div>
              ) : (
                <>
                  <h2 className="mb-6 text-xl font-semibold text-[#f2f7f7]">{c.modalTitle}</h2>
                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                    <div>
                      <div className="flex gap-3">
                        {(['Emittent', 'Investor'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, role: r }))}
                            className={[
                              'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                              form.role === r
                                ? 'border-[#1fc3a6] bg-[#1fc3a6] text-[#061721]'
                                : 'border-[#5a8995]/35 text-[#9bb0b8] hover:border-[#1fc3a6]/70',
                            ].join(' ')}
                          >
                            {r === 'Emittent' ? c.issuerLabel : c.investorLabel}
                          </button>
                        ))}
                      </div>
                      {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={c.firstNamePlaceholder}
                          value={form.firstName}
                          onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                          className="w-full rounded-lg border border-[#5a8995]/35 bg-[#071925]/65 px-3 py-2.5 text-sm text-[#e7eff0] placeholder-[#66828c] transition-colors focus:border-[#1fc3a6] focus:outline-none"
                        />
                        {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={c.lastNamePlaceholder}
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          className="w-full rounded-lg border border-[#5a8995]/35 bg-[#071925]/65 px-3 py-2.5 text-sm text-[#e7eff0] placeholder-[#66828c] transition-colors focus:border-[#1fc3a6] focus:outline-none"
                        />
                        {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder={c.emailPlaceholder}
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-lg border border-[#5a8995]/35 bg-[#071925]/65 px-3 py-2.5 text-sm text-[#e7eff0] placeholder-[#66828c] transition-colors focus:border-[#1fc3a6] focus:outline-none"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <button
                      type="submit"
                      className="mt-2 w-full rounded-lg bg-[#1ab99d] py-3 text-sm font-semibold uppercase tracking-[0.15em] text-[#061721] transition-colors hover:bg-[#38cdb3]"
                    >
                      {c.submitButton}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1fc3a6]/15 bg-[#061620] py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <button
            onClick={() => setLegalModal('impressum')}
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#7895a3] transition-colors hover:text-[#1fc3a6]"
          >
            {c.impressumLink}
          </button>
          <span className="hidden h-3 w-px bg-[#5a8995]/35 sm:block" />
          <button
            onClick={() => setLegalModal('datenschutz')}
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#7895a3] transition-colors hover:text-[#1fc3a6]"
          >
            {c.datenschutzLink}
          </button>
          <span className="hidden h-3 w-px bg-[#5a8995]/35 sm:block" />
          <p className="text-[11px] text-[#506d78]">{c.copyright}</p>
        </div>
      </footer>

      {/* Legal modals */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b11]/70 px-4 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) setLegalModal(null); }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[#2d6670]/35 bg-[#0a202e]/95 p-8 shadow-2xl shadow-black/40">
            <button
              onClick={() => setLegalModal(null)}
              aria-label="Close"
              className="absolute right-4 top-4 text-[#7895a3] transition-colors hover:text-white"
            >
              <X size={20} />
            </button>

            {legalModal === 'impressum' ? (
              <>
                <h2 className="mb-6 text-xl font-semibold text-[#f2f7f7]">{c.impressumTitle}</h2>
                <div className="flex flex-col gap-1.5 text-sm text-[#9bb0b8]">
                  {c.impressumContent.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-6 text-xl font-semibold text-[#f2f7f7]">{c.datenschutzTitle}</h2>
                <p className="text-sm leading-relaxed text-[#9bb0b8]">{c.datenschutzContent}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
