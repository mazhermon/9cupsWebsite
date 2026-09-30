import type { ReactNode } from 'react';
import BackgroundVideo from './BackgroundVideo';
import { heroFontVariables } from './fonts';
import styles from './KnockoutHero.module.css';

type Props = {
  /** Words the video shows through, one per line. Decorative (aria-hidden). */
  lines?: string[];
  /** The real page heading, read by screen readers and search engines. */
  title?: ReactNode;
  className?: string;
  /** Optional call to action rendered above the title. 9cups uses this for the
   *  "press play to enter" control. */
  cta?: ReactNode;
};

/**
 * Full-bleed hero where the looping video is only visible through giant type.
 * How: a layer of dark field + white text is multiplied over the video —
 * white × video = video, dark × video ≈ dark.
 */
export default function KnockoutHero({ lines = ['IX', 'CUPS'], title = '9cups · live', className, cta }: Props) {
  return (
    <section className={[styles.hero, heroFontVariables, className].filter(Boolean).join(' ')}>
      <BackgroundVideo name="knockout" />
      <div className={styles.mask} aria-hidden="true">
        <p className={styles.word}>
          {lines.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </p>
      </div>
      {cta && <div className={styles.cta}>{cta}</div>}
      <h1 className={styles.title}>{title}</h1>
    </section>
  );
}
