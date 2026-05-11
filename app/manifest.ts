import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sparkle Suite',
    short_name: 'Sparkle Suite',
    description:
      'A prelaunch hub for reps who want a smoother customer experience and a cleaner online setup.',
    start_url: '/prelaunch',
    scope: '/',
    display: 'browser',
    background_color: '#fff9fc',
    theme_color: '#5a345c',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
