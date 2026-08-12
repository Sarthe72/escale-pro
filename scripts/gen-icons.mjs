import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '..', 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2d6a4f"/>
  <g transform="translate(96,56) scale(1.6)">
    <ellipse cx="100" cy="110" rx="85" ry="100" stroke="white" stroke-width="3.5" fill="none"/>
    <ellipse cx="100" cy="110" rx="79" ry="94" stroke="white" stroke-width="1.5" fill="none" opacity="0.5"/>
    <path d="M82 88 L100 68 L118 88" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <rect x="84" y="88" width="32" height="24" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <rect x="93" y="100" width="14" height="12" stroke="white" stroke-width="1.8" fill="none"/>
    <line x1="65" y1="122" x2="135" y2="122" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse cx="100" cy="142" rx="22" ry="14" stroke="white" stroke-width="2.2" fill="white" fill-opacity="0.15"/>
    <circle cx="93" cy="139" r="1.8" fill="white"/>
    <circle cx="100" cy="137" r="1.8" fill="white"/>
    <circle cx="107" cy="139" r="1.8" fill="white"/>
    <circle cx="96" cy="144" r="1.8" fill="white"/>
    <circle cx="104" cy="144" r="1.8" fill="white"/>
    <circle cx="100" cy="148" r="1.8" fill="white"/>
  </g>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
console.log('✓ icon-192.png');
await sharp(buf).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
console.log('✓ icon-512.png');
