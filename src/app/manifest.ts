import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saveika - Community Mental Health Screening',
    short_name: 'Saveika',
    description:
      'A mobile decision-support tool for community health workers in Nepal to log early behavioral warning signs and flag households that may need mental health support.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF5', // warm ivory (organic theme)
    theme_color: '#5B7553', // sage green (organic theme)
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
    related_applications: [],
    prefer_related_applications: false,
  };
}
