import localFont from 'next/font/local';

// Self-hosted (see app/font-files) so builds never fetch from Google Fonts.
export const instrumentSans = localFont({
  src: './font-files/instrument-sans.woff2',
  weight: '400 700',
  display: 'swap',
});

export const outfit = localFont({
  src: './font-files/outfit.woff2',
  weight: '400 500',
  display: 'swap',
});
