//importScripts('/cache-polyfill.js');

self.addEventListener('fetch', (event) => 
{
    event.respondWith(
        caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
});

self.addEventListener('install', event => 
{
    console.log('[SW]','installing app');

    event.waitUntil(
        caches.open('configurator')
        .then(cache => cache.addAll([
            '/manifest.webmanifest',
            '/sw-init.js',
            '/sw.js',
            '/ConfigurateurOakAddin.js',
            '/index.html',
            '/home.html',
            '/data/fr-FR/choices-fr-FR.json',
            '/data/fr-FR/config-fr-FR.json',
            '/data/fr-FR/possibilities-calculation-gramsPerLiter-fr-FR.json',
            '/data/fr-FR/possibilities-calculation-percentage-fr-FR.json',
            '/data/fr-FR/possibilities-fr-FR.json',
            '/data/fr-FR/responses-table-fr-FR.js',
            '/app-ressources/logo.png',
        ])
    ));
});