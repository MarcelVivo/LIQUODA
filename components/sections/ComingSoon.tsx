'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

type Role = 'Emittent' | 'Investor' | '';

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

export default function ComingSoon() {
  const [modalOpen, setModalOpen] = useState(false);
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

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.role) e.role = 'Bitte wähle eine Rolle.';
    if (!form.firstName.trim()) e.firstName = 'Pflichtfeld';
    if (!form.lastName.trim()) e.lastName = 'Pflichtfeld';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ungültige E-Mail-Adresse';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitted(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitted(false);
    setForm({ role: '', firstName: '', lastName: '', email: '' });
    setErrors({});
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] select-none">

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

      {/* Logo: Liquoda (static) + .- (animated) */}
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
        Pre-Register
      </button>

      {/* Two-column info section */}
      <div className="mt-16 w-full max-w-4xl px-6 sm:px-10 pb-20 flex flex-col md:flex-row gap-10 md:gap-0">

        {/* Für Emittenten */}
        <div className="flex-1 md:pr-10 text-justify">
          <p className="mb-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">
            Für Emittenten
          </p>
          <p className="text-[13px] leading-[1.85] text-gray-500">
            Du hast ein konkretes Projekt und brauchst Kapital. Kein Bankenmarathon, kein Pitch vor einem Gremium. Auf LIQUODA stellst du dein Vorhaben digital vor und erreichst direkt Investoren, die in reale Projekte investieren wollen.
          </p>
          <p className="mt-4 text-[13px] leading-[1.85] text-gray-500">
            Ob du einen Gastrobetrieb finanzieren, eine Immobilie entwickeln oder ein Startup auf die Beine stellen willst: LIQUODA tokenisiert dein Projekt auf der Blockchain und macht deine Investoren zu verifizierten Teilhabern. Transparent, nachvollziehbar, ohne Umwege.
          </p>
          <p className="mt-4 text-[13px] leading-[1.85] text-gray-500">
            Einmalige Setup-Gebühr. Klare Konditionen. Wir verdienen an der Vermittlung, nicht an deinem Ergebnis.
          </p>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block w-px bg-gray-200 self-stretch mx-0" />
        {/* Mobile horizontal divider */}
        <div className="block md:hidden h-px w-full bg-gray-200" />

        {/* Für Investoren */}
        <div className="flex-1 md:pl-10 text-justify">
          <p className="mb-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">
            Für Investoren
          </p>
          <p className="text-[13px] leading-[1.85] text-gray-500">
            Du willst dein Geld in etwas Echtes stecken. Nicht in abstrakte Finanzprodukte, sondern in Projekte, die du verstehst und die du siehst.
          </p>
          <p className="mt-4 text-[13px] leading-[1.85] text-gray-500">
            LIQUODA gibt dir Zugang zu tokenisierten Realwerten. Ab CHF 100 investierst du direkt in Schweizer Projekte, erhältst einen digitalen Token als Besitznachweis auf der Polygon-Blockchain und weisst jederzeit, wo dein Geld steckt. Keine Plattform, die dein Kapital verwahrt. Keine Anlageempfehlungen. Nur ein direkter, technisch gesicherter Kanal zwischen dir und dem Emittenten.
          </p>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={closeModal}
              aria-label="Schließen"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <p className="text-lg font-semibold text-[#0b1830] tracking-wide">More Details coming soon</p>
                <p className="text-sm text-gray-400">Wir melden uns bei dir.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[#0b1830] mb-6">Pre-Registrierung</h2>
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                  {/* Role */}
                  <div>
                    <div className="flex gap-3">
                      {(['Emittent', 'Investor'] as Role[]).map((r) => (
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
                          {r}
                        </button>
                      ))}
                    </div>
                    {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
                  </div>

                  {/* Name */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Vorname"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
                      />
                      {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Nachname"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0b1830] transition-colors"
                      />
                      {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      placeholder="E-Mail"
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
                    Registrieren
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
