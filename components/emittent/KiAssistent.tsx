'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Loader2, RotateCcw, Send, Sparkles, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { KiDisplayMessage, KiEvent, ToolName } from '@/lib/ki/assistent';
import type { PrecheckResult } from '@/lib/ki/vorpruefung';

interface State {
  configured: boolean;
  stripe: boolean;
  unlocked: boolean;
  status: string;
  messages: KiDisplayMessage[];
  precheck: { verdict: PrecheckResult['verdict']; score: number; result: PrecheckResult; createdAt: string } | null;
}

type ChatMessage = KiDisplayMessage & { streaming?: boolean; error?: string };

/**
 * KI-Assistent im Projekt-Wizard (Etappe 20): Freischaltung (CHF 190 oder Paket),
 * Gespräch mit Streaming, Werkzeug-Status und Vorprüfungsbericht.
 */
export default function KiAssistent({ projectId, editable, onChanged }: { projectId: string; editable: boolean; onChanged?: () => void }) {
  const t = useTranslations('ki.assistant');
  const tPay = useTranslations('ki.paywall');
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State | null>(null);
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const kiParam = params.get('ki');

  const load = useCallback(async () => {
    const res = await fetch(`/api/emittent/projekte/${projectId}/assistent`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as State;
    setState(data);
    setMessages(data.messages);
    return data;
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Nach der Zahlung: bis die Freischaltung sichtbar ist, kurz nachfragen
  useEffect(() => {
    if (kiParam === 'bezahlt') setNotice(tPay('paid'));
    if (kiParam === 'abgebrochen') setNotice(tPay('cancelled'));
    if (kiParam !== 'bezahlt') return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const s = await load();
      if (s?.unlocked || tries >= 10) clearInterval(timer);
    }, 2500);
    return () => clearInterval(timer);
  }, [kiParam, load, tPay]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, activeTool]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setNotice(null);
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: message, tools: [] }, { role: 'assistant', text: '', tools: [], streaming: true }]);
    let changed = false;
    try {
      const res = await fetch(`/api/emittent/projekte/${projectId}/assistent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const code = data.error === 'not_unlocked' ? 'not_unlocked' : data.error === 'not_configured' ? 'not_configured' : 'server';
        setMessages((m) => m.slice(0, -1).concat({ role: 'assistant', text: '', tools: [], error: t(`errors.${code}`) }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const apply = (event: KiEvent) => {
        if (event.type === 'text') {
          setMessages((m) => {
            const last = m[m.length - 1];
            return m.slice(0, -1).concat({ ...last, text: last.text + event.text });
          });
        } else if (event.type === 'tool') {
          setActiveTool(event.status === 'start' ? event.name : null);
          setMessages((m) => {
            const last = m[m.length - 1];
            // Textabschnitte vor und nach einer Aktion durch einen Absatz trennen
            const text = event.status === 'start' && last.text && !last.text.endsWith('\n') ? `${last.text}\n\n` : last.text;
            const tools = event.status === 'start' ? last.tools : [...last.tools, { name: event.name, ok: event.status === 'ok' }];
            return m.slice(0, -1).concat({ ...last, text, tools });
          });
        } else if (event.type === 'done') {
          changed = event.changed;
        } else if (event.type === 'error') {
          setMessages((m) => {
            const last = m[m.length - 1];
            return m.slice(0, -1).concat({ ...last, error: t(`errors.${event.code}`) });
          });
        }
      };
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) if (line.trim()) apply(JSON.parse(line) as KiEvent);
      }
      if (buffer.trim()) apply(JSON.parse(buffer) as KiEvent);
    } catch {
      setMessages((m) => {
        const last = m[m.length - 1];
        return m.slice(0, -1).concat({ ...last, error: t('errors.server') });
      });
    } finally {
      setActiveTool(null);
      setBusy(false);
      setMessages((m) => m.map((x) => ({ ...x, streaming: false })));
      if (changed) {
        router.refresh();
        onChanged?.();
        load();
      }
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const reset = async () => {
    if (!window.confirm(t('resetConfirm'))) return;
    await fetch(`/api/emittent/projekte/${projectId}/assistent`, { method: 'DELETE' });
    setMessages([]);
  };

  const unlock = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/emittent/projekte/${projectId}/assistent/freischalten`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(tPay(res.status === 503 ? 'unavailable' : 'error'));
    } finally {
      setBusy(false);
    }
  };

  const suggestions = t.raw('suggestions') as string[];

  return (
    <div className="liq-card overflow-hidden">
      <div className="liq-ink flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-onink">{t('title')}</p>
            <p className="text-xs text-onink-muted">{t('subtitle')}</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded p-1 text-onink-muted hover:text-onink" aria-expanded={open} aria-label={open ? t('close') : t('open')}>
          {open ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col">
          {notice && (
            <p className="border-b border-navy/10 bg-cream px-5 py-3 text-sm text-navy" role="status">{notice}</p>
          )}
          {!state ? (
            <p className="px-5 py-6 text-sm text-muted">{t('loading')}</p>
          ) : !state.configured ? (
            <p className="px-5 py-6 text-sm text-muted">{tPay('unavailable')}</p>
          ) : !state.unlocked ? (
            <Paywall stripe={state.stripe} busy={busy} onUnlock={unlock} />
          ) : (
            <>
              <div ref={listRef} className="max-h-[60vh] min-h-[280px] space-y-4 overflow-y-auto px-5 py-4">
                {messages.length === 0 && (
                  <div>
                    <p className="text-sm leading-relaxed text-body">{t('welcome')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button key={s} type="button" onClick={() => send(s)} className="liq-chip border-navy/15 text-navy transition-colors hover:border-accent hover:text-accent">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <Bubble key={i} message={m} />
                ))}
                {activeTool && (
                  <p className="flex items-center gap-2 text-xs text-accent" role="status">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" /> {t(`toolRunning.${activeTool}`)}
                  </p>
                )}
                {busy && !activeTool && messages[messages.length - 1]?.text === '' && (
                  <p className="flex items-center gap-2 text-xs text-muted" role="status">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" /> {t('thinking')}
                  </p>
                )}
              </div>

              {state.precheck && <PrecheckCard precheck={state.precheck} />}

              <form onSubmit={submit} className="border-t border-navy/10 bg-cream px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={2}
                    placeholder={editable ? t('placeholder') : t('placeholderLocked')}
                    disabled={busy}
                    aria-label={t('placeholder')}
                    className="block w-full resize-none rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <Button type="submit" size="sm" disabled={busy || !input.trim()} aria-label={t('send')}>
                    {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] leading-snug text-muted">{t('disclaimer')}</p>
                  {messages.length > 0 && (
                    <button type="button" onClick={reset} disabled={busy} className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted hover:text-navy">
                      <RotateCcw size={12} aria-hidden="true" /> {t('reset')}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const t = useTranslations('ki.assistant');
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-navy px-4 py-2.5 text-sm leading-relaxed text-onink">{message.text}</p>
      </div>
    );
  }
  return (
    <div className="max-w-[92%]">
      {message.text && <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-cream px-4 py-2.5 text-sm leading-relaxed text-body">{message.text}</div>}
      {message.tools.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {message.tools.map((tool, i) => (
            <li key={i} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] ${tool.ok ? 'border-accent/40 text-accent' : 'border-red-300 text-red-700'}`}>
              {tool.ok ? <CheckCircle size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
              {t(`tools.${tool.name}`)}
            </li>
          ))}
        </ul>
      )}
      {message.error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700" role="alert">
          <AlertCircle size={14} aria-hidden="true" /> {message.error}
        </p>
      )}
    </div>
  );
}

function Paywall({ stripe, busy, onUnlock }: { stripe: boolean; busy: boolean; onUnlock: () => void }) {
  const t = useTranslations('ki.paywall');
  const bullets = t.raw('bullets') as string[];
  return (
    <div className="px-5 py-5">
      <p className="text-sm leading-relaxed text-body">{t('lead')}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-body">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl border border-navy/10 bg-cream p-4">
        <p className="text-lg font-extrabold text-navy">{t('price')}</p>
        <p className="mt-0.5 text-xs text-muted">{t('priceNote')}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t('included')}</p>
        <div className="mt-3">
          <Button type="button" onClick={onUnlock} disabled={busy || !stripe}>
            {busy ? t('redirecting') : t('action')}
          </Button>
          {!stripe && <p className="mt-2 text-xs text-muted">{t('unavailable')}</p>}
        </div>
      </div>
    </div>
  );
}

export function PrecheckCard({ precheck, compact = false }: { precheck: NonNullable<State['precheck']>; compact?: boolean }) {
  const t = useTranslations('ki.precheck');
  const [open, setOpen] = useState(!compact);
  const r = precheck.result;
  const tone = precheck.verdict === 'ready' ? 'text-accent' : precheck.verdict === 'needs_work' ? 'text-amber-700' : 'text-red-700';
  const icon = (s: 'ok' | 'warning' | 'problem') =>
    s === 'ok' ? <CheckCircle size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" /> : s === 'warning' ? <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />;
  return (
    <div className="border-t border-navy/10 px-5 py-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t('title')}</span>
          <span className={`ml-2 text-sm font-semibold ${tone}`}>{t(`verdicts.${precheck.verdict}`)}</span>
          <span className="ml-2 text-xs text-muted">{t('score', { score: precheck.score })} · {new Date(precheck.createdAt).toLocaleDateString('de-CH')}</span>
        </span>
        {open ? <ChevronUp size={16} className="text-muted" aria-hidden="true" /> : <ChevronDown size={16} className="text-muted" aria-hidden="true" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="leading-relaxed text-body">{r.summary}</p>
          {r.openPoints.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-navy">{t('openPoints')}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-body">
                {r.openPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-navy">{t('checks')}</p>
            <ul className="mt-1 space-y-1">
              {r.checks.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-body"><span>{icon(c.status)}</span><span><b>{c.area}:</b> {c.note}</span></li>
              ))}
            </ul>
          </div>
          {r.documents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-navy">{t('documents')}</p>
              <ul className="mt-1 space-y-1">
                {r.documents.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-body"><span>{icon(d.status)}</span><span><b>{d.title}:</b> {d.note}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
