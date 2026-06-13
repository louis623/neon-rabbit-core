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
    background_color: '#fbf5f2',
    theme_color: '#ee2c9b',
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
