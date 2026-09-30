import type { ReactNode } from 'react';
import BackgroundVideo from './BackgroundVideo';
import { heroFontVariables } from './fonts';
import styles from './HazeHero.module.css';

type Props = {
  children: ReactNode;
  className?: string;
  /** CSS height of the hero, e.g. "100svh" (default) or "70svh" for inner pages. */
  height?: string;
};

/**
 * Soft, blurred, dimmed loop behind your own content. A scrim keeps text legible.
 * An h1/h2 placed directly inside gets the Anton display style; everything else gets Space Grotesk.
 */
export default function HazeHero({ children, className, height }: Props) {
  return (
    <section
      className={[styles.hero, heroFontVariables, className].filter(Boolean).join(' ')}
      style={height ? { height } : undefined}
    >
      <BackgroundVideo name="haze" className={styles.scrim} />
      <div className={styles.content}>{children}</div>
    </section>
  );
}
