import type { Metadata } from 'next'
import Image from 'next/image'
import { CONTACT_EMAIL, PRESS_LINKS } from '@/lib/track-config'
import { PRESS_PACK_URL } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'About · 9cups',
  description: 'DJ 9cups: beat maker and DJ from Wellington, Aotearoa. UK garage, bassline, 140 and house.',
}

// COPY NOTE
// ---------
// Drafted from what the repo can actually evidence: the brand personality in
// PRODUCT.md, the genres and location the artist chose for the hero, the
// Catching A Feeling release, and the Empty Spaces write-up. Nothing here
// asserts a venue, label, year, collaborator or piece of equipment, because
// none of that is verifiable from anything in this project — inventing it
// would put words in the artist's mouth. The marked block below is where real
// biography goes.

export default function AboutPage() {
  return (
    <main className="page-shell about" id="main">
      <header className="page-head">
        <p className="about-eyebrow">Wellington, Aotearoa</p>
        <h1 className="page-title">Beat maker &amp; DJ</h1>
      </header>

      <figure className="about-figure">
        {/* TODO: replace with the supplied press image. Using the existing
            wide portrait until then so the layout is judged against a real
            image rather than a grey box. */}
        <Image
          src="/artist/maz-bw-wide.webp"
          alt="DJ 9cups"
          width={1600}
          height={900}
          className="about-img"
          priority
        />
      </figure>

      <div className="prose">
        <p className="prose-lead">
          9cups makes and plays UK garage, bassline, 140 and house out of Wellington.
          Music for a room rather than a stadium: patient, layered, built to be
          listened to as much as danced to.
        </p>

        <h2>The sound</h2>
        <p>
          Garage swing and bassline weight, taken slowly. The records lean on space
          as much as on drums, and they tend to reward a second listen more than a
          first. Globally influenced, unmistakably made here.
        </p>

        <h2>Taking it apart</h2>
        <p>
          The current release, <em>Catching A Feeling</em>, is published as four
          separate stems as well as a finished record. You can mute and unmute bass,
          drums, main and vocals in the browser and hear what each one is carrying.
          It is the closest thing to standing behind the desk.
        </p>

        {/* ── Real biography goes here ───────────────────────────────────────
            Left deliberately empty rather than filled with plausible-sounding
            invention. Add years active, residencies, labels, notable sets. */}

        <h2>Press</h2>
        <ul className="prose-list">
          {PRESS_LINKS.map(item => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener">
                {item.name}
              </a>
              {item.note && <span className="prose-note"> — {item.note}</span>}
            </li>
          ))}
        </ul>

        <h2>Bookings and press</h2>
        <p>
          For bookings, interviews or promos, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        {PRESS_PACK_URL ? (
          <p>
            <a
              className="about-download"
              href={PRESS_PACK_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              Download the press pack <span aria-hidden="true">&#8599;</span>
            </a>
          </p>
        ) : (
          // Rendering nothing beats rendering a link that goes nowhere.
          // Set PRESS_PACK_URL in lib/site-config.ts to switch this on.
          null
        )}
      </div>
    </main>
  )
}
