// Grouped outbound links for the landing page: a tracked small-caps label per
// group, then a row of pills. Server component — nothing here is interactive
// beyond the anchors themselves.

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
        <nav key={group.label} className="linkgroup" aria-label={group.label}>
          <h2 className="linkgroup-label">{group.label}</h2>
          <ul className="linkgroup-row">
            {group.items.map(item => (
              <li key={item.href}>
                <a
                  className="linkgroup-pill"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span className="linkgroup-name">{item.name}</span>
                  {item.note && (
                    <span className="linkgroup-note">{item.note}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  )
}
