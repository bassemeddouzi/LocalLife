const fs = require('fs');
const ring = JSON.parse(
  fs.readFileSync('apps/api/src/admin/djerba-simplified.json', 'utf8'),
);
const lines = ring.map((p) => `  [${p[0]}, ${p[1]}],`).join('\n');
const ts = `/** Auto-simplified from OSM relation 2682627 (Djerba Island). */
export const DJERBA_RING: [number, number][] = [
${lines}
];
`;
fs.writeFileSync('apps/api/src/admin/djerba-ring.ts', ts);
console.log('wrote', ring.length, 'points');
