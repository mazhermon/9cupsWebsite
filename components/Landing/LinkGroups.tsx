// Grouped outbound links for the landing page: a display-face heading per
// group, then rule-separated rows. Server component — nothing here is
// interactive beyond the anchors themselves.

import type { LinkGroup } from '@/lib/track-config'

interface LinkGroupsProps {
  groups: LinkGroup[]
}

export default function LinkGroups({ groups }: LinkGroupsProps) {
  return (
    <div className="linkgroups">
      {groups.map(group => (
        // Each group is its own landmark so screen-reader users can jump
        // between "Listen" and "Follow" rather than hearing one long list.
        <nav
          key={group.label}
          className="linkgroup"
          aria-labelledby={`linkgroup-${group.label.toLowerCase()}`}
        >
          <h2
            className="linkgroup-label"
            id={`linkgroup-${group.label.toLowerCase()}`}
          >
            {group.label}
          </h2>
          <ul className="linkgroup-list">
            {group.items.map(item => (
              <li key={item.href}>
                <a
                  className="linkrow"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span className="linkrow-name">{item.name}</span>
                  {item.note && (
                    <span className="linkrow-note">{item.note}</span>
                  )}
                  {/* Decorative: the anchor already announces itself as a
                      link, and "opens in a new tab" is carried by target. */}
                  <span className="linkrow-arrow" aria-hidden="true">&#8599;</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  )
}
