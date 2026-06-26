'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

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
  const [dotHover, setDotHover] = useState(false);

  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const rafRef = useRef<number>(0);
  const hoveringRef = useRef(false);
  const currentBase = useRef(0.01);
  const currentScale = useRef(2.5);

  useEffect(() => {
    const tick = (ts: number) => {
      const t = ts * 0.001;
      if (turbRef.current && dispRef.current) {
        const targetBase = hoveringRef.current ? 0.04 : 0.01;
        const targetScale = hoveringRef.current ? 12 : 2.5;
        currentBase.current += (targetBase - currentBase.current) * 0.035;
        currentScale.current += (targetScale - currentScale.current) * 0.035;

        const fx = currentBase.current + Math.sin(t * 0.9) * currentBase.current * 0.4;
        const fy = currentBase.current * 1.5 + Math.cos(t * 0.7) * currentBase.current * 0.35;
        turbRef.current.setAttribute('baseFrequency', `${fx.toFixed(5)} ${fy.toFixed(5)}`);
        dispRef.current.setAttribute('scale', currentScale.current.toFixed(2));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#0b1830] py-3 px-4 text-center">
        <p className="text-white text-[11px] font-medium tracking-[0.2em]">
          {c.banner}
        </p>
      </div>

      <main className="flex min-h-screen flex-col items-center justify-start md:justify-center bg-[#F5F5F3] select-none pt-32 md:pt-16">

        {/* SVG filter — applied only to ".-" */}
        <svg aria-hidden="true" focusable="false" className="absolute w-0 h-0 overflow-hidden">
          <defs>
            <filter id="dot-wave" x="-50%" y="-100%" width="200%" height="300%">
              <feTurbulence
                ref={turbRef}
                type="fractalNoise"
                baseFrequency="0.01 0.015"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                ref={dispRef}
                in="SourceGraphic"
                in2="noise"
                scale="2.5"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Logo */}
        <div className="flex items-baseline leading-none px-4">
          <span
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(2rem, 13vw, 6rem)',
              fontWeight: 400,
              letterSpacing: '0.03em',
              color: '#000000',
              lineHeight: 1,
            }}
          >
            Liquoda
          </span>
          <span
            onMouseEnter={() => { hoveringRef.current = true; setDotHover(true); }}
            onMouseLeave={() => { hoveringRef.current = false; setDotHover(false); }}
            className={dotHover ? 'liq-dot-hover' : 'liq-dot'}
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(2rem, 13vw, 6rem)',
              fontWeight: 700,
              lineHeight: 1,
              display: 'inline-block',
              filter: 'url(#dot-wave)',
              cursor: 'default',
            }}
          >
            .-
          </span>
        </div>

        {/* Slogan */}
        <p className="mt-5 text-xs sm:text-sm font-medium tracking-[0.35em] uppercase text-gray-400">
          Real Assets . Digital Security
        </p>

        {/* Pre-Register button */}
        <button
          onClick={() => setModalOpen(true)}
          className="mt-10 px-10 py-3 bg-[#0b1830] text-white text-xs font-medium tracking-[0.2em] uppercase rounded-full hover:opacity-90 transition-opacity"
        >
          {c.preRegister}
        </button>

        {/* DE / EN toggle — centered above the two text columns */}
        <div className="mt-14 flex items-center rounded-full border border-gray-200 p-0.5">
          {(['de', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={[
                'px-5 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors',
                lang === l
                  ? 'bg-[#0b1830] text-white'
                  : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Two-column info section */}
        <div className="mt-8 w-full max-w-4xl px-6 sm:px-10 pb-20 flex flex-col md:flex-row gap-10 md:gap-0">

          {/* For Issuers */}
          <div className="flex-1 md:pr-10 text-justify">
            <p className="mb-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">
              {c.forIssuers}
            </p>
            <p className="text-[13px] leading-[1.85] text-gray-500">{c.issuersP1}</p>
            <p className="mt-4 text-[13px] leading-[1.85] text-gray-500">{c.issuersP2}</p>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block w-px bg-gray-200 self-stretch mx-0" />
          {/* Mobile horizontal divider */}
          <div className="block md:hidden h-px w-full bg-gray-200" />

          {/* For Investors */}
          <div className="flex-1 md:pl-10 text-justify">
            <p className="mb-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">
              {c.forInvestors}
            </p>
            <p className="text-[13px] leading-[1.85] text-gray-500">{c.investorsP1}</p>
            <p className="mt-4 text-[13px] leading-[1.85] text-gray-500">{c.investorsP2}</p>
          </div>
        </div>

        {/* Pre-register modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <button
                onClick={closeModal}
                aria-label="Close"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <p className="text-lg font-semibold text-[#0b1830] tracking-wide">{c.successTitle}</p>
                  <p className="text-sm text-gray-400">{c.successMessage}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-[#0b1830] mb-6">{c.modalTitle}</h2>
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
                                ? 'border-[#0b1830] bg-[#0b1830] text-white'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400',
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
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
                        />
                        {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={c.lastNamePlaceholder}
                          value={form.lastName}
                          onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
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
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <button
                      type="submit"
                      className="mt-2 w-full py-3 bg-[#0b1830] text-white text-sm font-medium tracking-[0.15em] uppercase rounded-lg hover:opacity-90 transition-opacity"
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
      <footer className="bg-[#F5F5F3] border-t border-gray-100 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <button
            onClick={() => setLegalModal('impressum')}
            className="text-[11px] font-medium tracking-[0.2em] uppercase text-gray-400 hover:text-gray-600 transition-colors"
          >
            {c.impressumLink}
          </button>
          <span className="hidden sm:block w-px h-3 bg-gray-300" />
          <button
            onClick={() => setLegalModal('datenschutz')}
            className="text-[11px] font-medium tracking-[0.2em] uppercase text-gray-400 hover:text-gray-600 transition-colors"
          >
            {c.datenschutzLink}
          </button>
          <span className="hidden sm:block w-px h-3 bg-gray-300" />
          <p className="text-[11px] text-gray-300">{c.copyright}</p>
        </div>
      </footer>

      {/* Legal modals */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setLegalModal(null); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => setLegalModal(null)}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {legalModal === 'impressum' ? (
              <>
                <h2 className="text-xl font-semibold text-[#0b1830] mb-6">{c.impressumTitle}</h2>
                <div className="flex flex-col gap-1.5 text-sm text-gray-600">
                  {c.impressumContent.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[#0b1830] mb-6">{c.datenschutzTitle}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{c.datenschutzContent}</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
