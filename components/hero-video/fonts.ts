import { Anton, Space_Grotesk } from 'next/font/google';

/**
 * The two typefaces used in the hero designs, both free under the SIL Open Font License 1.1.
 * next/font self-hosts them from your own domain at build time: no request to Google at runtime,
 * automatic size-adjusted fallbacks (no layout shift), and they're only preloaded on routes that use them.
 *
 * To use them site-wide, import these in app/layout.tsx and put `heroFontVariables` on <html>.
 */

/** Display: tall condensed grotesque. Headlines and the knockout letters. Single weight (400). */
export const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-anton',
});

/** Body/UI: geometric grotesk with character. Paragraphs, labels, buttons. Variable font, 300–700. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

/** Class names that define --font-anton and --font-space-grotesk on an element. */
export const heroFontVariables = `${anton.variable} ${spaceGrotesk.variable}`;
