// Static mocks of the wordmark in 8 display fonts. Each card is a small
// reproduction of the hero (terrain stripe + wordmark + eyebrow) using a
// different font for "9cups". Pure CSS — no audio engine, no WebGL, just
// fonts + a static gradient stand-in for the terrain so layout proportions
// read accurately.

import {
  Bagel_Fat_One,
  Bowlby_One,
  Bungee_Inline,
  Frijole,
  Major_Mono_Display,
  Knewave,
  Ultra,
  DM_Serif_Display,
  Caprasimo,
} from 'next/font/google'

const bagelFatOne = Bagel_Fat_One({ subsets: ['latin'], weight: '400', variable: '--font-bagel' })
const bowlbyOne = Bowlby_One({ subsets: ['latin'], weight: '400', variable: '--font-bowlby' })
const bungeeInline = Bungee_Inline({ subsets: ['latin'], weight: '400', variable: '--font-bungee' })
const frijole = Frijole({ subsets: ['latin'], weight: '400', variable: '--font-frijole' })
const majorMono = Major_Mono_Display({ subsets: ['latin'], weight: '400', variable: '--font-mono' })
const knewave = Knewave({ subsets: ['latin'], weight: '400', variable: '--font-knewave' })
const ultra = Ultra({ subsets: ['latin'], weight: '400', variable: '--font-ultra' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dmserif' })
// Reference (current) — included as a comparison baseline.
const caprasimo = Caprasimo({ subsets: ['latin'], weight: '400', variable: '--font-caprasimo' })

interface FontOption {
  className: string
  variable: string
  name: string
  feel: string
}

const FONT_OPTIONS: FontOption[] = [
  { className: caprasimo.variable,      variable: '--font-caprasimo', name: 'Caprasimo',          feel: 'current · playful display serif' },
  { className: bagelFatOne.variable,    variable: '--font-bagel',     name: 'Bagel Fat One',      feel: 'chunky soft serif' },
  { className: bowlbyOne.variable,      variable: '--font-bowlby',    name: 'Bowlby One',         feel: 'bold display, retro poster' },
  { className: bungeeInline.variable,   variable: '--font-bungee',    name: 'Bungee Inline',      feel: 'punk graphic, outlined' },
  { className: frijole.variable,        variable: '--font-frijole',   name: 'Frijole',            feel: 'woodtype / saloon poster' },
  { className: majorMono.variable,      variable: '--font-mono',      name: 'Major Mono Display', feel: 'futuristic monospace' },
  { className: knewave.variable,        variable: '--font-knewave',   name: 'Knewave',            feel: 'chunky brush, hand-drawn' },
  { className: ultra.variable,          variable: '--font-ultra',     name: 'Ultra',              feel: 'classic slab serif' },
  { className: dmSerif.variable,        variable: '--font-dmserif',   name: 'DM Serif Display',   feel: 'refined editorial serif' },
]

export const metadata = {
  title: '9cups · font picks',
}

export default function FontsPage() {
  // Concat all font variables onto the wrapper so each card can reference
  // its custom property via `font-family: var(--font-X)`.
  const allFontVars = FONT_OPTIONS.map(o => o.className).join(' ')

  return (
    <main className={`fonts-page ${allFontVars}`} aria-label="9cups · font picks">
      <a href="/" className="variant-pill">Fonts · back</a>

      <header className="fonts-head">
        <h1 className="fonts-title">9cups · font picks</h1>
        <p className="fonts-blurb">
          Nine display fonts on the wordmark, each in the live page composition (eyebrow → wordmark → terrain
          stripe). Static — no audio. Tell me which lands.
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
