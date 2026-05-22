import './App.css';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { UserTableExample } from './shared/data-table/examples/user-table.example';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// TODO: REMOVE — temporary palette data
const PALETTE_GROUPS = [
  {
    label: 'Text',
    tokens: [
      { name: '--dt-text',        usage: 'Cell text, headers, labels' },
      { name: '--dt-text-muted',  usage: 'Secondary text, hints, row numbers' },
      { name: '--dt-text-invert', usage: 'Text on accent surfaces' },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: '--dt-accent',           usage: 'Active state, sort icons, focus rings, links' },
      { name: '--dt-bg-accent-subtle', usage: 'Groupable badges, pill chip backgrounds' },
      { name: '--dt-bg-selected',      usage: 'Selected rows, resizing header' },
    ],
  },
  {
    label: 'Surfaces',
    tokens: [
      { name: '--dt-bg',         usage: 'Cell background, menus, inputs' },
      { name: '--dt-bg-header',  usage: 'Header row, toolbar, pagination bar' },
      { name: '--dt-bg-hover',   usage: 'Row hover, dropdown item hover' },
      { name: '--dt-bg-group',   usage: 'Grouped row background' },
    ],
  },
  {
    label: 'Borders',
    tokens: [
      { name: '--dt-border',        usage: 'Cell dividers, menu outlines' },
      { name: '--dt-border-strong', usage: 'Input outlines, scrollbar thumb' },
    ],
  },
  {
    label: 'Danger',
    tokens: [
      { name: '--dt-danger',        usage: 'Deny-drop text color' },
      { name: '--dt-danger-bg',     usage: 'Deny-drop background' },
      { name: '--dt-danger-border', usage: 'Deny-drop border' },
    ],
  },
  {
    label: 'Highlight',
    tokens: [
      { name: '--dt-highlight-bg',   usage: 'Search match background' },
      { name: '--dt-highlight-text', usage: 'Search match text color' },
    ],
  },
];

export function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  // TODO: REMOVE — computed hex values for the palette
  const [paletteColors, setPaletteColors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // TODO: REMOVE — re-read computed values whenever the theme switches
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const map: Record<string, string> = {};
    for (const group of PALETTE_GROUPS) {
      for (const token of group.tokens) {
        map[token.name] = style.getPropertyValue(token.name).trim();
      }
    }
    setPaletteColors(map);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return (
    <>
      <header className="app-topbar">
        <span className="app-topbar-brand">Cereda Table</span>
        <button
          className="app-topbar-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="app-shell">
        <section className="app-card" aria-labelledby="baseline-demo-title">
          <h1 id="baseline-demo-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
            Data Table Demo
          </h1>
          <UserTableExample />
        </section>

        {/* TODO: REMOVE — temporary design token palette */}
        <section style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '40px 24px 64px',
          display: 'grid',
          gap: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--dt-text)' }}>
              Color Palette
            </h2>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              background: '#ef4444',
              color: '#fff',
              borderRadius: 4,
              padding: '3px 8px',
            }}>
              Temporary
            </span>
          </div>

          {PALETTE_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em',
                color: 'var(--dt-text-muted)',
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '1px solid var(--dt-border)',
              }}>
                {group.label}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))',
                gap: 12,
              }}>
                {group.tokens.map((token) => (
                  <div key={token.name} style={{
                    border: '1px solid var(--dt-border)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--dt-bg)',
                  }}>
                    <div style={{
                      height: 88,
                      background: `var(${token.name})`,
                      borderBottom: '1px solid var(--dt-border)',
                    }} />
                    <div style={{ padding: '12px 14px', display: 'grid', gap: 5 }}>
                      <code style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--dt-text)',
                        wordBreak: 'break-all',
                        lineHeight: 1.4,
                        fontFamily: 'monospace',
                      }}>
                        {token.name}
                      </code>
                      <code style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--dt-accent)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.02em',
                      }}>
                        {paletteColors[token.name] ?? '—'}
                      </code>
                      <span style={{
                        fontSize: 11,
                        color: 'var(--dt-text-muted)',
                        lineHeight: 1.5,
                        marginTop: 2,
                      }}>
                        {token.usage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        {/* END TODO: REMOVE */}
      </main>
    </>
  );
}
