import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(projectRoot, 'dist');

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(absolutePath) : [absolutePath];
  }));
  return nested.flat();
}

const files = (await collectFiles(distDirectory)).filter((file) => !file.endsWith('sw.js') && !file.endsWith('.map'));
const assets = files.map((file) => `/${path.relative(distDirectory, file).replaceAll('\\', '/')}`).sort();
const fingerprint = createHash('sha256');

for (const file of files.sort()) {
  fingerprint.update(await readFile(file));
}

const cacheName = `our-budget-${fingerprint.digest('hex').slice(0, 12)}`;
const serviceWorker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_ASSETS = ${JSON.stringify(assets, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith('our-budget-') && name !== CACHE_NAME).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
`;

await writeFile(path.join(distDirectory, 'sw.js'), serviceWorker, 'utf8');
console.log(`Generated offline service worker with ${assets.length} precached files.`);
