// Static mocks of the wordmark in 10 display fonts.
//
// Curated against the taste-skill rubric:
//   - Serifs ARE allowed because 9cups is creative/editorial (the rule
//     bans serifs only for dashboard/software UIs).
//   - "Inter" and other generic AI-default sans are excluded.
//   - Modern variable fonts preferred for richer character at display
//     sizes; carefully chosen static picks are kept where they bring
//     a sharper personality (Anton, Caprasimo).
//   - No cartoon-display picks (Bagel Fat / Bowlby / Frijole) — the
//     previous list was too uniformly playful; this set spans
//     editorial → poster → industrial → digital.
//
// Caprasimo (current) stays in slot 1 as the reference baseline.

import {
  Caprasimo,
  Fraunces,
  Newsreader,
  Bricolage_Grotesque,
  Honk,
  Workbench,
  Anton,
  Big_Shoulders,
  Climate_Crisis,
  Sixtyfour,
} from 'next/font/google'

// Static fonts — explicit weight required.
const caprasimo = Caprasimo({ subsets: ['latin'], weight: '400', variable: '--font-caprasimo' })
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' })

// Variable fonts — no `weight` (covered by the wght axis); some need explicit axes.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' })
const honk = Honk({ subsets: ['latin'], variable: '--font-honk' })
const workbench = Workbench({ subsets: ['latin'], variable: '--font-workbench' })
const bigShoulders = Big_Shoulders({ subsets: ['latin'], variable: '--font-bigshoulders' })
const climateCrisis = Climate_Crisis({ subsets: ['latin'], axes: ['YEAR'], variable: '--font-climate' })
const sixtyfour = Sixtyfour({ subsets: ['latin'], axes: ['BLED', 'SCAN'], variable: '--font-sixtyfour' })

interface FontOption {
  className: string
  variable: string
  name: string
  feel: string
}

const FONT_OPTIONS: FontOption[] = [
  { className: caprasimo.variable,      variable: '--font-caprasimo',     name: 'Caprasimo',          feel: 'current · playful display serif' },
  { className: fraunces.variable,       variable: '--font-fraunces',      name: 'Fraunces',           feel: 'variable · expressive editorial serif (opsz · SOFT · WONK)' },
  { className: newsreader.variable,     variable: '--font-newsreader',    name: 'Newsreader',         feel: 'variable · refined editorial serif' },
  { className: bricolage.variable,      variable: '--font-bricolage',     name: 'Bricolage Grotesque', feel: 'variable · geometric grotesque, warm' },
  { className: honk.variable,           variable: '--font-honk',          name: 'Honk',               feel: 'variable · 3D chromatic display' },
  { className: workbench.variable,      variable: '--font-workbench',     name: 'Workbench',          feel: 'variable · industrial serif w/ BLED axis' },
  { className: anton.variable,          variable: '--font-anton',         name: 'Anton',              feel: 'static · heavy condensed sans · poster' },
  { className: bigShoulders.variable,   variable: '--font-bigshoulders',  name: 'Big Shoulders',      feel: 'variable · brutalist condensed' },
  { className: climateCrisis.variable,  variable: '--font-climate',       name: 'Climate Crisis',     feel: 'variable · YEAR axis statement' },
  { className: sixtyfour.variable,      variable: '--font-sixtyfour',     name: 'Sixtyfour',          feel: 'variable · pixel grid, retro digital' },
]

export const metadata = {
  title: '9cups · font picks',
}

export default function FontsPage() {
  const allFontVars = FONT_OPTIONS.map(o => o.className).join(' ')

  return (
    <main className={`fonts-page ${allFontVars}`} aria-label="9cups · font picks">
      <a href="/" className="variant-pill">Fonts · back</a>

      <header className="fonts-head">
        <h1 className="fonts-title">9cups · font picks</h1>
        <p className="fonts-blurb">
          Ten display fonts on the wordmark — Caprasimo first as the current baseline, then nine
          alternatives picked for distinct character at large display sizes. Mix of editorial
          serifs, modern grotesques, condensed posters, and digital/variable curiosities.
        </p>
      </header>

      <ul className="fonts-grid">
        {FONT_OPTIONS.map((opt) => (
          <li key={opt.name} className="fonts-card">
            <div className="fonts-mock">
              <span className="fonts-mock-eyebrow">DJ 9cups presents</span>
              <span
                className="fonts-mock-wordmark"
                style={{ fontFamily: `var(${opt.variable})` }}
              >
                9cups
              </span>
              <div className="fonts-mock-terrain" aria-hidden="true" />
            </div>
            <div className="fonts-meta">
              <span className="fonts-name">{opt.name}</span>
              <span className="fonts-feel">{opt.feel}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
