import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('../public/manifest.json',import.meta.url),'utf8'));
test('le raccourci installé lance le CRM dans son sous-dossier GitHub Pages',()=>{
 const url='https://sarthe72.github.io/escale-pro/manifest.json';
 assert.equal(new URL(manifest.start_url,url).href,'https://sarthe72.github.io/escale-pro/');
 assert.equal(new URL(manifest.scope,url).pathname,'/escale-pro/');
 for(const icon of manifest.icons)assert.ok(new URL(icon.src,url).pathname.startsWith('/escale-pro/'));
});
test('le service worker est enregistré dans le même dossier que le CRM',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.includes("new URL('./sw.js', document.baseURI)"));
 assert.equal(new URL('./sw.js','https://sarthe72.github.io/escale-pro/#/commandes').pathname,'/escale-pro/sw.js');
});
