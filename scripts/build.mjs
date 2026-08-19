import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = join(root, 'dist');
let siteUrl = process.env.SITE_URL || 'http://localhost:4173/';
if (!siteUrl.endsWith('/')) siteUrl += '/';

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, 'src'), join(dist, 'src'), { recursive: true });
await cp(join(root, 'public'), dist, { recursive: true });

const template = await readFile(join(root, 'index.html'), 'utf8');
await writeFile(join(dist, 'index.html'), template.replaceAll('__SITE_URL__', siteUrl));
for (const file of ['robots.txt', 'sitemap.xml']) {
  const path = join(dist, file);
  const text = await readFile(path, 'utf8');
  await writeFile(path, text.replaceAll('__SITE_URL__', siteUrl));
}
console.log(`Built GlobeHop -> ${dist}`);
console.log(`SITE_URL=${siteUrl}`);
