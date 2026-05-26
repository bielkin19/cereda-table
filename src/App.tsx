import './App.css';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { type DataTableLocale } from './shared/data-table';
import { UserTableExample } from './shared/data-table/examples/user-table.example';
import { localeDe, localeEn, localeUk } from './shared/data-table/locales';

type Theme = 'light' | 'dark';
type Lang = 'en' | 'uk' | 'de';

const LANG_CYCLE: Lang[] = ['en', 'uk', 'de'];

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialLang(): Lang {
  const stored = localStorage.getItem('lang');
  if (stored === 'en' || stored === 'uk' || stored === 'de') return stored;
  return 'en';
}

const LOCALES: Record<Lang, DataTableLocale> = {
  en: localeEn,
  uk: localeUk,
  de: localeDe,
};

const LANG_LABELS: Record<Lang, string> = {
  en: 'EN',
  uk: 'UA',
  de: 'DE',
};

export function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [lang, setLang] = useState<Lang>(getInitialLang);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  function cycleLang() {
    setLang((l) => {
      const next = LANG_CYCLE[(LANG_CYCLE.indexOf(l) + 1) % LANG_CYCLE.length];
      localStorage.setItem('lang', next);
      return next;
    });
  }

  return (
    <>
      <header className="app-topbar">
        <span className="app-topbar-brand">Cereda Table</span>
        <div className="app-topbar-controls">
          <button
            className="app-topbar-toggle app-topbar-lang"
            onClick={cycleLang}
            aria-label={`Switch language, current: ${LANG_LABELS[lang]}`}
          >
            <span className="app-topbar-lang-badge" aria-hidden="true">
              {LANG_LABELS[lang]}
            </span>
            <span className="app-topbar-lang-next" aria-hidden="true">
              {LANG_LABELS[LANG_CYCLE[(LANG_CYCLE.indexOf(lang) + 1) % LANG_CYCLE.length]]}
            </span>
          </button>
          <button
            className="app-topbar-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="app-shell">
        <section className="app-card" aria-labelledby="baseline-demo-title">
          <h1 id="baseline-demo-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
            Data Table Demo
          </h1>
          <UserTableExample locale={LOCALES[lang]} />
        </section>
      </main>
    </>
  );
}
