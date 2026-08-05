/**
 * Convert OSM Overpass raw JSON → data/djerba/places.json
 * Usage: node scripts/convert-osm-djerba.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const rawPath = path.join(ROOT, 'data/djerba/osm-raw.json');
const outPath = path.join(ROOT, 'data/djerba/places.json');

function slugify(name, id) {
  const base = String(name || 'place')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `${base || 'place'}-${id}`.slice(0, 64);
}

function mapCategory(tags) {
  const a = tags.amenity;
  const t = tags.tourism;
  const n = tags.natural;
  const l = tags.leisure;
  const h = tags.highway;
  if (a === 'pharmacy') return 'pharmacies';
  if (a === 'hospital' || a === 'clinic') return 'hospitals';
  if (a === 'restaurant') return 'restaurants';
  if (a === 'cafe') return 'cafes';
  if (a === 'atm' || a === 'bank') return 'banks';
  if (a === 'fuel') return 'shops';
  if (h === 'bus_stop') return 'transport_hubs';
  if (a === 'ferry_terminal') return 'transport_hubs';
  if (t === 'hotel') return 'hotels';
  if (t === 'museum') return 'museums';
  if (t === 'attraction' || t === 'viewpoint') return 'attractions';
  if (n === 'beach' || l === 'beach_resort') return 'beaches';
  if (tags.shop) return 'shops';
  return null;
}

function summaryFor(tags, categoryKey) {
  const name = tags.name || tags['name:en'] || tags['name:fr'] || 'Unnamed';
  const bits = [];
  if (tags.cuisine) bits.push(`Cuisine: ${tags.cuisine}`);
  if (tags.opening_hours) bits.push(`Hours: ${tags.opening_hours}`);
  if (tags.phone) bits.push(`Tel: ${tags.phone}`);
  if (tags.website) bits.push('Has website');
  if (!bits.length) {
    const labels = {
      pharmacies: 'Pharmacy on Djerba (OSM). Confirm night rota locally.',
      hospitals: 'Medical facility on Djerba (OSM). Confirm emergency access.',
      restaurants: 'Restaurant on Djerba (OSM). Confirm hours and prices locally.',
      cafes: 'Café on Djerba (OSM).',
      banks: 'Bank / ATM on Djerba (OSM). Fees may apply for foreign cards.',
      hotels: 'Hotel / lodging on Djerba (OSM).',
      attractions: 'Attraction on Djerba (OSM).',
      beaches: 'Beach area on Djerba (OSM).',
      shops: 'Shop on Djerba (OSM).',
      transport_hubs: 'Transport stop / hub on Djerba (OSM).',
    };
    return labels[categoryKey] || `${name} — imported from OpenStreetMap.`;
  }
  return `${name} — ${bits.join(' · ')} (OSM).`;
}

function priceLevel(tags, categoryKey) {
  if (categoryKey === 'beaches') return 'FREE';
  if (tags.fee === 'no') return 'FREE';
  if (tags.fee === 'yes') return 'MODERATE';
  if (categoryKey === 'restaurants') return 'MODERATE';
  if (categoryKey === 'cafes') return 'BUDGET';
  if (categoryKey === 'hotels') return 'EXPENSIVE';
  return null;
}

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const seen = new Set();
const places = [];

for (const el of raw.elements || []) {
  const tags = el.tags || {};
  const name = tags.name || tags['name:en'] || tags['name:fr'];
  if (!name) continue;
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) continue;
  // Keep island focus (rough Djerba box)
  if (lat < 33.65 || lat > 33.95 || lng < 10.7 || lng > 11.15) continue;
  const categoryKey = mapCategory(tags);
  if (!categoryKey) continue;
  const key = `${name.toLowerCase()}|${categoryKey}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const osmId = `${el.type}/${el.id}`;
  places.push({
    slug: slugify(name, el.id),
    name,
    summary: summaryFor(tags, categoryKey),
    categoryKey,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    addressText: [tags['addr:street'], tags['addr:city'] || 'Djerba']
      .filter(Boolean)
      .join(', '),
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    priceLevel: priceLevel(tags, categoryKey),
    sourceType: 'IMPORTED',
    verificationStatus: 'APPROVED',
    osmId,
    openingHours: tags.opening_hours || null,
  });
}

places.sort((a, b) => a.categoryKey.localeCompare(b.categoryKey) || a.name.localeCompare(b.name));

// Cap noisy bus stops — keep ferry hubs + first 40 bus stops by name
const busStops = places.filter(
  (p) => p.categoryKey === 'transport_hubs' && String(p.osmId || '').includes('node'),
);
const nonBusHubs = places.filter((p) => p.categoryKey !== 'transport_hubs');
const ferryLike = places.filter(
  (p) =>
    p.categoryKey === 'transport_hubs' &&
    /ferry|port|gare|station|louage|taxi/i.test(p.name),
);
const busCapped = busStops
  .filter((p) => !ferryLike.some((f) => f.slug === p.slug))
  .slice(0, 40);
const hubs = [...ferryLike, ...busCapped];
const dedup = new Map();
for (const p of [...nonBusHubs, ...hubs]) dedup.set(p.slug, p);
const finalPlaces = [...dedup.values()].sort(
  (a, b) => a.categoryKey.localeCompare(b.categoryKey) || a.name.localeCompare(b.name),
);

const curatedExtra = [
  {
    slug: 'pharmacie-de-garde-houmt-souk',
    name: 'Pharmacie de garde — Houmt Souk (ask locally)',
    summary:
      'Night pharmacy rota changes — ask hotel or police for tonight’s pharmacie de garde.',
    categoryKey: 'pharmacies',
    latitude: 33.8762,
    longitude: 10.8578,
    addressText: 'Houmt Souk, Djerba',
    phone: null,
    website: null,
    priceLevel: null,
    sourceType: 'GUIDE_VERIFIED',
    verificationStatus: 'APPROVED',
    osmId: null,
    openingHours: null,
  },
  {
    slug: 'pharmacie-midoun-centre-curated',
    name: 'Pharmacie Midoun Centre',
    summary: 'Central Midoun pharmacy near shops; confirm night coverage.',
    categoryKey: 'pharmacies',
    latitude: 33.8085,
    longitude: 10.998,
    addressText: 'Midoun, Djerba',
    phone: null,
    website: null,
    priceLevel: null,
    sourceType: 'GUIDE_VERIFIED',
    verificationStatus: 'APPROVED',
    osmId: null,
    openingHours: null,
  },
  {
    slug: 'synagogue-el-ghriba',
    name: 'El Ghriba Synagogue',
    summary:
      'Historic synagogue in Hara Seghira (Erriadh). Dress modestly; check visiting hours.',
    categoryKey: 'attractions',
    latitude: 33.8139,
    longitude: 10.8556,
    addressText: 'Erriadh / Hara Seghira, Djerba',
    phone: null,
    website: null,
    priceLevel: 'BUDGET',
    sourceType: 'GUIDE_VERIFIED',
    verificationStatus: 'APPROVED',
    osmId: null,
    openingHours: null,
  },
  {
    slug: 'djerba-explore-park',
    name: 'Djerba Explore Park',
    summary: 'Crocodile farm + heritage village near Midoun — popular family stop.',
    categoryKey: 'attractions',
    latitude: 33.8075,
    longitude: 11.0105,
    addressText: 'Midoun, Djerba',
    phone: null,
    website: null,
    priceLevel: 'MODERATE',
    sourceType: 'GUIDE_VERIFIED',
    verificationStatus: 'APPROVED',
    osmId: null,
    openingHours: null,
  },
];
for (const c of curatedExtra) {
  if (!dedup.has(c.slug)) {
    dedup.set(c.slug, c);
    finalPlaces.push(c);
  }
}

fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      pack: 'djerba-real-v1',
      generatedAt: new Date().toISOString(),
      count: finalPlaces.length,
      places: finalPlaces.sort(
        (a, b) =>
          a.categoryKey.localeCompare(b.categoryKey) || a.name.localeCompare(b.name),
      ),
    },
    null,
    2,
  ),
);
console.log(`Wrote ${finalPlaces.length} places → ${outPath}`);
const byCat = {};
for (const p of finalPlaces) byCat[p.categoryKey] = (byCat[p.categoryKey] || 0) + 1;
console.log(byCat);
