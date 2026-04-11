import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PeachMarket',
    short_name: 'PeachMarket',
    description: 'The best local marketplace for the Atlanta Korean community',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ff6b6b',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
