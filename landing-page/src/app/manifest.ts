import type { MetadataRoute } from 'next';

// Installable web app: players add the portal to their home screen and it
// opens straight into the game lobby, without the browser chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Einherjar Blitz',
    short_name: 'Einherjar',
    description: 'RPG de colección en el Valhalla: invoca guerreros, administra tu economía y prepárate para la arena.',
    lang: 'es',
    start_url: '/juego',
    scope: '/',
    display: 'standalone',
    background_color: '#0b0a09',
    theme_color: '#0b0a09',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
