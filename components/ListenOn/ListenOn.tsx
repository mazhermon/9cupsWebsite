import type { PlatformLink } from '@/lib/track-config'

interface ListenOnProps {
  platforms: PlatformLink[]
}

export default function ListenOn({ platforms }: ListenOnProps) {
  return (
    <div className="listen-block">
      <p className="listen-eyebrow">Listen on</p>
      <nav className="listen-row" aria-label="Streaming and purchase platforms">
        {platforms.map(p => (
          <a
            key={p.name}
            href={p.href}
            className="listen-pill"
            target="_blank"
            rel="noreferrer noopener"
          >
            {p.name}
          </a>
        ))}
      </nav>
    </div>
  )
}
