'use client';

import { useState } from 'react';
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#FEFCE8] select-none">

      {/* Logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 440 80"
        aria-label="Liquoda"
        className="w-[min(80vw,440px)]"
      >
        <text
          fontFamily="'Georgia', 'Times New Roman', serif"
          fontSize="64"
          fontWeight="400"
          letterSpacing="2"
          dominantBaseline="middle"
          textAnchor="middle"
          y="42"
        >
          <tspan x="220" fill="#000000">Liquoda</tspan>
          <tspan fill="#0b1830" fontWeight="700" letterSpacing="0">.-</tspan>
        </text>
      </svg>

      {/* Slogan */}
      <p className="mt-3 text-xs sm:text-sm font-medium tracking-[0.35em] uppercase text-gray-400">
        Real Assets . Digital Security
      </p>

      {/* Pre-Register button */}
      <button
        onClick={() => setModalOpen(true)}
        className="mt-10 px-10 py-3 bg-[#0b1830] text-white text-xs font-medium tracking-[0.2em] uppercase rounded-full hover:opacity-90 transition-opacity"
      >
        Pre-Register
      </button>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">

            {/* Close */}
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

                  {/* First / Last name */}
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

                  {/* Submit */}
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
