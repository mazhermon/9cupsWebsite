interface WordmarkProps {
  eyebrow?: string
}

export default function Wordmark({ eyebrow }: WordmarkProps) {
  return (
    <h1 className="wordmark">
      {eyebrow && <span className="wordmark-eyebrow">{eyebrow}</span>}
      <span className="wordmark-frame">
        {/* Animated ghost copies — peek out around the edges of the static word.
            Hidden from screen readers since the real word is in `wordmark-main`. */}
        <span className="wordmark-ghost wordmark-ghost-1" aria-hidden="true">9cups</span>
        <span className="wordmark-ghost wordmark-ghost-2" aria-hidden="true">9cups</span>
        <span className="wordmark-ghost wordmark-ghost-3" aria-hidden="true">9cups</span>
        <span className="wordmark-main">9cups</span>
      </span>
    </h1>
  )
}
