// 9cups — home.
//
// Two sections sharing one audio transport: the knockout video hero, then the
// landing (play button, links, mixer doorway). On very large screens they sit
// side by side instead of stacking.

import { KnockoutHero } from '@/components/hero-video'
import { PlayerProvider } from '@/components/Landing/PlayerProvider'
import HeroEnter from '@/components/Landing/HeroEnter'
import Landing from '@/components/Landing/Landing'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const LANDING_ID = 'landing'

export default function Home() {
  return (
    <PlayerProvider>
      <a href="#landing-content" className="skip-link">Skip to links</a>

      <div className="home">
        <KnockoutHero
          lines={['IX', 'CUPS']}
          title={
            <>
              9cups
              {/* Decorative separator. The explicit spaces matter: JSX drops the
                  whitespace around a newline-separated element, and with the dot
                  aria-hidden the heading would otherwise be announced as one
                  run-on word, "9cupsBeat maker and DJ". */}
              {' '}
              <span className="hero-title-dot" aria-hidden="true">&bull;</span>
              {' '}
              Beat maker &amp; DJ
            </>
          }
          subtitle="Wellington Aotearoa"
          cta={<HeroEnter targetId={LANDING_ID} />}
        />
        <Landing variant="section" as="section" id={LANDING_ID} />
      </div>

      <GrainOverlay />
    </PlayerProvider>
  )
}
