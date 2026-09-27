'use client';

import { FormEvent, Fragment, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import Wordmark from '@/components/ui/Wordmark';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

const STORAGE_KEY = 'liq-support';
const MAX_TURNS = 16;

/**
 * Support- und Orientierungs-Bot (Etappe 20): schwebender Knopf unten rechts,
 * Gespräch bleibt für die Browser-Sitzung erhalten. Gestaltung wie die Karten
 * der Präsentation: Ink-Kopf, Creme-Fläche, Petrol-Akzent.
 */
export default function SupportBot() {
  const t = useTranslations('ki.support');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { sessionId: string; turns: Turn[] };
        setSessionId(saved.sessionId);
        setTurns(saved.turns);
        return;
      }
    } catch {
      // Speicher nicht verfügbar
    }
    setSessionId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    try {
      if (sessionId) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, turns: turns.filter((x) => !x.error) }));
    } catch {
      // ignorieren
    }
  }, [sessionId, turns]);

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, turns]);

  const send = async (text: string) => {
    const content = text.trim().slice(0, 2000);
    if (!content || busy) return;
    setInput('');
    setBusy(true);
    const history = [...turns.filter((x) => !x.error), { role: 'user' as const, content }].slice(-MAX_TURNS);
    setTurns([...history, { role: 'assistant', content: '' }]);
    try {
      const res = await fetch('/api/ki/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, locale, sessionId }),
      });
      if (!res.ok || !res.body) {
        setTurns([...history, { role: 'assistant', content: t(res.status === 429 ? 'rate' : 'error'), error: true }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        const failed = answer.indexOf('\u0000');
        if (failed >= 0) {
          answer = answer.slice(0, failed);
          setTurns([...history, { role: 'assistant', content: answer || t('error'), error: !answer }]);
          return;
        }
        setTurns([...history, { role: 'assistant', content: answer }]);
      }
      if (!answer.trim()) setTurns([...history, { role: 'assistant', content: t('error'), error: true }]);
    } catch {
      setTurns([...history, { role: 'assistant', content: t('error'), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const suggestions = t.raw('suggestions') as string[];

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          className="liq-card flex h-[min(72vh,600px)] w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden shadow-ink"
          role="dialog"
          aria-label={t('title')}
        >
          <div className="liq-ink flex items-center justify-between gap-3 px-4 py-3">
            <div className="text-onink">
              <Wordmark size="sm" />
              <p className="mt-0.5 text-[11px] text-onink-muted">{t('subtitle')}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-onink-muted hover:text-onink" aria-label={t('close')}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-body">{t('welcome')}</div>
            {turns.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="liq-chip border-navy/15 text-navy transition-colors hover:border-accent hover:text-accent">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((turn, i) =>
              turn.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-navy px-3.5 py-2.5 text-sm leading-relaxed text-onink">{turn.content}</p>
                </div>
              ) : (
                <div key={i} className={`max-w-[92%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed ${turn.error ? 'bg-red-50 text-red-800' : 'bg-cream text-body'}`}>
                  {turn.content ? <RichText text={turn.content} /> : <Loader2 size={16} className="animate-spin text-accent" aria-label={t('thinking')} />}
                </div>
              )
            )}
          </div>

          <form onSubmit={submit} className="border-t border-navy/10 bg-white px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={t('placeholder')}
                aria-label={t('placeholder')}
                disabled={busy}
                className="block max-h-24 w-full resize-none rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-cta disabled:opacity-50"
                aria-label={t('send')}
              >
                {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted">{t('disclaimer')}</p>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-cta transition-all hover:shadow-cta-hover hover:brightness-105"
          aria-label={t('open')}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {t('open')}
        </button>
      )}
    </div>
  );
}

/** Markdown-Links [Text](/pfad) und **fett** darstellen; nur interne Pfade und Mailadressen werden verlinkt. */
function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => (
        <p key={i} className={/^\s*[-•]\s/.test(line) ? 'pl-3' : ''}>
          {renderInline(line.replace(/^\s*[-•]\s/, '• '))}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{line.slice(last, m.index)}</Fragment>);
    if (m[1] && m[2]) {
      const href = m[2];
      const safe = href.startsWith('/') || href.startsWith('mailto:');
      parts.push(
        safe ? (
          <a key={k++} href={href} className="liq-link font-semibold text-navy">{m[1]}</a>
        ) : (
          <Fragment key={k++}>{m[1]}</Fragment>
        )
      );
    } else if (m[3]) {
      parts.push(<b key={k++}>{m[3]}</b>);
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(<Fragment key={k++}>{line.slice(last)}</Fragment>);
  return parts;
}
