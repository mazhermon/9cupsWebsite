'use client'

import './playground.css'
import {
  Fraunces,
  Syne,
  Bricolage_Grotesque,
  Unbounded,
  Anybody,
  Big_Shoulders,
  DM_Serif_Display,
  Caprasimo,
  Instrument_Serif,
} from 'next/font/google'
import { useState } from 'react'

// Nine display fonts loaded from Google Fonts. Variable where available so we can
// animate axes later. Each is rendered with the wordmark "9cups" so you can compare
// like-for-like.
const fraunces = Fraunces({ subsets: ['latin'], display: 'swap', axes: ['SOFT', 'WONK', 'opsz'] })
const syne = Syne({ subsets: ['latin'], display: 'swap' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap', axes: ['opsz'] })
const unbounded = Unbounded({ subsets: ['latin'], display: 'swap' })
const anybody = Anybody({ subsets: ['latin'], display: 'swap' })
const bigShoulders = Big_Shoulders({ subsets: ['latin'], display: 'swap' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], display: 'swap', weight: '400' })
const caprasimo = Caprasimo({ subsets: ['latin'], display: 'swap', weight: '400' })
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], display: 'swap', weight: '400', style: ['normal', 'italic'] })

const FONT_OPTIONS = [
  {
    id: 'fraunces',
    name: 'Fraunces',
    creator: 'Undercase Type',
    note: 'Variable serif. SOFT + WONK + opsz axes — animate softness/wonkiness.',
    fontClass: fraunces.className,
    sample: '9cups',
    style: { fontWeight: 700, fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0' },
  },
  {
    id: 'syne',
    name: 'Syne',
    creator: 'Bonjour Monde',
    note: 'Eccentric grotesque. Reads as design-foundry, not generic.',
    fontClass: syne.className,
    sample: '9cups',
    style: { fontWeight: 800 },
  },
  {
    id: 'bricolage',
    name: 'Bricolage Grotesque',
    creator: 'ATIPO Foundry',
    note: 'Variable grotesque with optical-size axis. Modern editorial feel.',
    fontClass: bricolage.className,
    sample: '9cups',
    style: { fontWeight: 700, fontVariationSettings: '"opsz" 96' },
  },
  {
    id: 'unbounded',
    name: 'Unbounded',
    creator: 'Etmek Type',
    note: 'Geometric display. Futuristic, club-poster energy.',
    fontClass: unbounded.className,
    sample: '9cups',
    style: { fontWeight: 800 },
  },
  {
    id: 'instrument',
    name: 'Instrument Serif',
    creator: 'Instrument',
    note: 'Tall elegant serif. Editorial, music-publication feel.',
    fontClass: instrumentSerif.className,
    sample: '9cups',
    style: { fontWeight: 400, fontStyle: 'italic' },
  },
  {
    id: 'anybody',
    name: 'Anybody',
    creator: 'TightType',
    note: 'Variable fashion font. Dramatic width range, wedding-poster vibes.',
    fontClass: anybody.className,
    sample: '9cups',
    style: { fontWeight: 700 },
  },
  {
    id: 'bigshoulders',
    name: 'Big Shoulders',
    creator: 'Patric King',
    note: 'Condensed industrial sans. Heavy presence, high contrast.',
    fontClass: bigShoulders.className,
    sample: '9cups',
    style: { fontWeight: 800 },
  },
  {
    id: 'dmserif',
    name: 'DM Serif Display',
    creator: 'Colophon Foundry',
    note: 'High-contrast didone-style serif. Editorial fashion-magazine feel.',
    fontClass: dmSerif.className,
    sample: '9cups',
    style: {},
  },
  {
    id: 'caprasimo',
    name: 'Caprasimo',
    creator: 'Stefan Peev',
    note: 'Retro chunky serif. Warm, soulful — for funk/soul records.',
    fontClass: caprasimo.className,
    sample: '9cups',
    style: {},
  },
] as const

const STEM_OPTIONS = [
  { key: 'bass', label: 'Bass', color: '#3B1A6E' },
  { key: 'drums', label: 'Drums', color: '#B03060' },
  { key: 'main', label: 'Main', color: '#8B3AC4' },
  { key: 'vox', label: 'Vox', color: '#CC2E90' },
] as const

const BUTTON_STYLES = [
  {
    id: 'a-glow-pill',
    title: 'A · Glow Pill (current, refined)',
    note: 'Filled when active with stem-color glow. Hollow when muted.',
  },
  {
    id: 'b-frosted',
    title: 'B · Frosted Glass',
    note: 'Backdrop blur + thin stroke. Premium hardware feel.',
  },
  {
    id: 'c-toggle-switch',
    title: 'C · Inline Toggle Switch',
    note: 'Label + iOS-style switch. Reads as "control panel".',
  },
  {
    id: 'd-stamp',
    title: 'D · Brutalist Stamp',
    note: 'Hard-edged ticker tape with corner cut. Editorial.',
  },
  {
    id: 'e-meter',
    title: 'E · Live Meter Pill',
    note: 'Pill with thin progress arc that fills with the stem level.',
  },
  {
    id: 'f-numbered',
    title: 'F · Numbered Tile',
    note: 'Square tile with stem number + label. Very mixer-deck.',
  },
  {
    id: 'g-led-dot',
    title: 'G · LED Dot',
    note: 'Glowing dot on the left, label right. Equipment-rack feel.',
  },
  {
    id: 'h-channel-strip',
    title: 'H · Channel Strip',
    note: 'Vertical mute button + label, like a console channel.',
  },
] as const

export default function Playground() {
  return (
    <div className="pg-page">
      <header className="pg-header">
        <h1>9cups · Design playground</h1>
        <p>Pick a wordmark font and a button style. The chosen pair gets wired into the live home page.</p>
      </header>

      <section className="pg-section">
        <h2>Wordmark fonts</h2>
        <p className="pg-note">Each rendered with the same baseline size for fair comparison.</p>
        <ul className="pg-fonts">
          {FONT_OPTIONS.map((opt) => (
            <li key={opt.id} className="pg-font">
              <div className="pg-font-meta">
                <strong>{opt.name}</strong>
                <span>{opt.creator}</span>
              </div>
              <div className={opt.fontClass + ' pg-font-sample'} style={opt.style as React.CSSProperties}>
                {opt.sample}
              </div>
              <p className="pg-font-note">{opt.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pg-section">
        <h2>Stem toggle buttons</h2>
        <p className="pg-note">Each option shows the four stems with one in the muted state to compare.</p>
        <ul className="pg-buttons">
          {BUTTON_STYLES.map((style) => (
            <li key={style.id} className="pg-button-row">
              <div className="pg-button-meta">
                <strong>{style.title}</strong>
                <span>{style.note}</span>
              </div>
              <ButtonDemo styleId={style.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function ButtonDemo({ styleId }: { styleId: string }) {
  // Each demo manages its own muted state so you can click and feel the interaction.
  const [muted, setMuted] = useState<Record<string, boolean>>({ drums: true })
  const toggle = (k: string) => setMuted((m) => ({ ...m, [k]: !m[k] }))
  return (
    <div className={`pg-buttons-${styleId}`}>
      {STEM_OPTIONS.map((s) => (
        <button
          key={s.key}
          type="button"
          className="pg-btn"
          data-style={styleId}
          data-muted={!!muted[s.key]}
          aria-pressed={!!muted[s.key]}
          onClick={() => toggle(s.key)}
          style={{ '--stem-color': s.color } as React.CSSProperties}
        >
          <ButtonInner styleId={styleId} label={s.label} muted={!!muted[s.key]} />
        </button>
      ))}
    </div>
  )
}

function ButtonInner({ styleId, label, muted }: { styleId: string; label: string; muted: boolean }) {
  // Each style renders slightly different inner content. We keep the outer `pg-btn`
  // class consistent so layout/spacing comes from CSS. Style-specific inner markup
  // lives here. The `data-muted` and `data-style` attributes drive the visuals.
  switch (styleId) {
    case 'a-glow-pill':
    case 'b-frosted':
    case 'g-led-dot':
      return (
        <>
          <span className="pg-dot" />
          <span className="pg-label">{label}</span>
        </>
      )
    case 'c-toggle-switch':
      return (
        <>
          <span className="pg-label">{label}</span>
          <span className="pg-switch" data-on={!muted}>
            <span className="pg-switch-thumb" />
          </span>
        </>
      )
    case 'd-stamp':
      return (
        <>
          <span className="pg-label">{label.toUpperCase()}</span>
          <span className="pg-state">{muted ? 'OFF' : 'ON'}</span>
        </>
      )
    case 'e-meter':
      return (
        <>
          <span className="pg-meter">
            <span className="pg-meter-arc" style={{ ['--level' as string]: muted ? '0.05' : '0.7' }} />
          </span>
          <span className="pg-label">{label}</span>
        </>
      )
    case 'f-numbered': {
      const idx = ({ Bass: '01', Drums: '02', Main: '03', Vox: '04' } as Record<string, string>)[label] || ''
      return (
        <>
          <span className="pg-num">{idx}</span>
          <span className="pg-label">{label}</span>
        </>
      )
    }
    case 'h-channel-strip':
      return (
        <>
          <span className="pg-mute-led" />
          <span className="pg-label">{label}</span>
          <span className="pg-mute-text">{muted ? 'MUTED' : 'LIVE'}</span>
        </>
      )
    default:
      return <span className="pg-label">{label}</span>
  }
}
