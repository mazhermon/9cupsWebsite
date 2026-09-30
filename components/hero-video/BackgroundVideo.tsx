'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BackgroundVideo.module.css';

type Props = {
  /** File stem in /public/videos, e.g. "knockout" → knockout-landscape.v1.av1.mp4 */
  name: string;
  /** Bump when you re-encode, so the immutable CDN cache is busted. */
  version?: string;
  dir?: string;
  className?: string;
  /** Pause control label suffix (WCAG 2.2.2 — looping motion > 5 s must be pausable). */
  pauseLabel?: string;
};

type Orientation = 'landscape' | 'portrait';

// Order matters: the browser plays the first source it can decode.
// AV1: Chrome/Edge/Firefox/Android, Safari on AV1-hardware Apple devices (iPhone 15 Pro+, M3+).
// HEVC: every other Apple device since ~2017 (hardware decode). Tag is hvc1 so Safari accepts it.
// H.264: universal safety net.
const SOURCES = [
  { ext: 'av1.mp4', type: 'video/mp4; codecs="av01.0.04M.08"' },
  { ext: 'hevc.mp4', type: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
  { ext: 'h264.mp4', type: 'video/mp4; codecs="avc1.640020"' },
];

export default function BackgroundVideo({
  name,
  version = 'v1',
  dir = '/videos',
  className,
  pauseLabel = 'motion',
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [orientation, setOrientation] = useState<Orientation | null>(null); // null = poster only
  const [playingFor, setPlayingFor] = useState<Orientation | null>(null); // which file has started playing
  const [userPaused, setUserPaused] = useState(false);

  const stem = (o: Orientation) => `${dir}/${name}-${o}.${version}`;

  // 1. Only load video after the page has loaded and gone idle, so it never competes with LCP.
  //    Skip entirely for reduced motion / Save-Data / 2G: the poster is the whole experience.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const portrait = window.matchMedia('(orientation: portrait)');
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (reduce.matches || conn?.saveData || /2g/.test(conn?.effectiveType ?? '')) return;

    let idleId: number | undefined;
    const current = (): Orientation => (portrait.matches ? 'portrait' : 'landscape');
    const arm = () => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      idleId = idle(() => setOrientation(current())) as number;
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });

    const onRotate = () => setOrientation((o) => (o ? current() : o));
    const onReduce = () => reduce.matches && setOrientation(null);
    portrait.addEventListener('change', onRotate);
    reduce.addEventListener('change', onReduce);
    return () => {
      window.removeEventListener('load', arm);
      if (idleId !== undefined) (window.cancelIdleCallback ?? window.clearTimeout)(idleId);
      portrait.removeEventListener('change', onRotate);
      reduce.removeEventListener('change', onReduce);
    };
  }, []);

  // 2. Play only while on screen and the tab is visible.
  useEffect(() => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap || !orientation) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !userPaused) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(wrap);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [orientation, userPaused]);

  return (
    <>
      <div
        ref={wrapRef}
        className={[styles.bgv, playingFor !== null && playingFor === orientation && styles.isPlaying, className].filter(Boolean).join(' ')}
        aria-hidden="true"
      >
        {/* Poster = frame 0. Server-rendered, art-directed, high priority: it is the LCP element. */}
        <picture>
          <source media="(orientation: portrait)" srcSet={`${stem('portrait')}.poster.webp`} type="image/webp" />
          <source srcSet={`${stem('landscape')}.poster.webp`} type="image/webp" />
          {/* Plain <img> on purpose: posters are pre-optimised and art-directed via <picture>. */}
          <img src={`${stem('landscape')}.poster.jpg`} alt="" className={styles.media} fetchPriority="high" />
        </picture>

        {orientation && (
          <video
            key={orientation}
            ref={videoRef}
            className={`${styles.media} ${styles.video}`}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            onPlaying={() => setPlayingFor(orientation)}
          >
            {SOURCES.map((s) => (
              <source key={s.ext} src={`${stem(orientation)}.${s.ext}`} type={s.type} />
            ))}
          </video>
        )}
      </div>

      {orientation && (
        <button
          type="button"
          className={styles.pause}
          aria-pressed={userPaused}
          onClick={() => setUserPaused((p) => !p)}
        >
          {userPaused ? `Play ${pauseLabel}` : `Pause ${pauseLabel}`}
        </button>
      )}
    </>
  );
}
