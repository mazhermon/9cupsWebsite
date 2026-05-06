// Static mocks of the wordmark in 10 display fonts — second pass.
//
// Brief from the previous round: keep going in the same direction, more
// options, Caprasimo stays first. Direction = editorial / character serifs
// and expressive variables, no cartoon-display, no generic AI-default sans.
//
// What changed vs round 1:
// - Dropped the more extreme variables (Workbench, Climate Crisis, Sixtyfour
//   were too off-brand for the wordmark)
// - Dropped the condensed sans (Anton, Big Shoulders) — strong but cold
// - Doubled down on display serifs with character: Playfair Display,
//   Cormorant, Rampart One, Gloock, Rozha One, Limelight, Ribeye
// - Kept one wildcard: Tilt Warp (variable distortion axes)
// - Kept one playful-script with swashes: Sansita Swashed

import {
  Caprasimo,
  Playfair_Display,
  Cormorant,
  Rampart_One,
  Gloock,
  Rozha_One,
  Tilt_Warp,
  Limelight,
  Ribeye,
  Sansita_Swashed,
} from 'next/font/google'

const caprasimo = Caprasimo({ subsets: ['latin'], weight: '400', variable: '--font-caprasimo' })

// Variable display serifs — wght axis is default; opsz where applicable.
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const cormorant = Cormorant({ subsets: ['latin'], variable: '--font-cormorant' })
const sansitaSwashed = Sansita_Swashed({ subsets: ['latin'], variable: '--font-sansitaswashed' })

// Static display serifs — explicit weight required.
const rampart = Rampart_One({ subsets: ['latin'], weight: '400', variable: '--font-rampart' })
const gloock = Gloock({ subsets: ['latin'], weight: '400', variable: '--font-gloock' })
const rozha = Rozha_One({ subsets: ['latin'], weight: '400', variable: '--font-rozha' })
const limelight = Limelight({ subsets: ['latin'], weight: '400', variable: '--font-limelight' })
const ribeye = Ribeye({ subsets: ['latin'], weight: '400', variable: '--font-ribeye' })

// Variable wildcard — tilt warp uses XELA + YELA axes for distortion. Without
// those declared we get the default (untilted) state, which is still a
// distinctive face on its own.
const tiltWarp = Tilt_Warp({ subsets: ['latin'], variable: '--font-tilt' })

interface FontOption {
  className: string
  variable: string
  name: string
  feel: string
}

const FONT_OPTIONS: FontOption[] = [
  { className: caprasimo.variable,       variable: '--font-caprasimo',       name: 'Caprasimo',         feel: 'current · playful display serif' },
  { className: playfair.variable,        variable: '--font-playfair',        name: 'Playfair Display',  feel: 'variable · classic editorial serif (opsz)' },
  { className: cormorant.variable,       variable: '--font-cormorant',       name: 'Cormorant',         feel: 'variable · refined Garamond display' },
  { className: rampart.variable,         variable: '--font-rampart',         name: 'Rampart One',       feel: 'static · heavy chunky display serif' },
  { className: gloock.variable,          variable: '--font-gloock',          name: 'Gloock',            feel: 'static · contemporary display serif' },
  { className: rozha.variable,           variable: '--font-rozha',           name: 'Rozha One',         feel: 'static · chunky bold display serif' },
  { className: tiltWarp.variable,        variable: '--font-tilt',            name: 'Tilt Warp',         feel: 'variable · warpable display (XELA · YELA)' },
  { className: limelight.variable,       variable: '--font-limelight',       name: 'Limelight',         feel: 'static · vintage theatrical display' },
  { className: ribeye.variable,          variable: '--font-ribeye',          name: 'Ribeye',            feel: 'static · vintage display with shadow' },
  { className: sansitaSwashed.variable,  variable: '--font-sansitaswashed',  name: 'Sansita Swashed',   feel: 'variable · playful display with swashes' },
]

export const metadata = {
  title: '9cups · font picks · v2',
}

export default function FontsPage() {
  const allFontVars = FONT_OPTIONS.map(o => o.className).join(' ')

  return (
    <main className={`fonts-page ${allFontVars}`} aria-label="9cups · font picks v2">
      <a href="/" className="variant-pill">Fonts · back</a>

      <header className="fonts-head">
        <h1 className="fonts-title">9cups · font picks · v2</h1>
        <p className="fonts-blurb">
          Round two — same direction (editorial character at display sizes), more
          serif heavy this time. Caprasimo first as the baseline; the rest pull
          from classic display serifs (Playfair, Cormorant, Limelight),
          chunkier modern serifs (Rampart, Rozha, Gloock), one variable wildcard
          (Tilt Warp), and a playful script (Sansita Swashed) for contrast.
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
