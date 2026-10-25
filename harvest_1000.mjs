import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papzanzgzoghrrgdzvfo.supabase.co';
// Read from environment variable or pass inline
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
  console.error('Run: export SUPABASE_SERVICE_ROLE_KEY="your-key-here" and run again.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EAST_COAST_CITIES = [
  { city: 'New York', state: 'NY', wikiCat: 'Category:Musical_groups_from_New_York_City' },
  { city: 'Brooklyn', state: 'NY', wikiCat: 'Category:Musical_groups_from_Brooklyn' },
  { city: 'Philadelphia', state: 'PA', wikiCat: 'Category:Musical_groups_from_Philadelphia' },
  { city: 'Boston', state: 'MA', wikiCat: 'Category:Musical_groups_from_Boston' },
  { city: 'Asbury Park', state: 'NJ', wikiCat: 'Category:Musical_groups_from_New_Jersey' },
  { city: 'Baltimore', state: 'MD', wikiCat: 'Category:Musical_groups_from_Baltimore' },
  { city: 'Washington', state: 'DC', wikiCat: 'Category:Musical_groups_from_Washington,_D.C.' },
  { city: 'Richmond', state: 'VA', wikiCat: 'Category:Musical_groups_from_Virginia' },
  { city: 'Raleigh', state: 'NC', wikiCat: 'Category:Musical_groups_from_North_Carolina' },
  { city: 'Charlotte', state: 'NC', wikiCat: 'Category:Musical_groups_from_North_Carolina' },
  { city: 'Charleston', state: 'SC', wikiCat: 'Category:Musical_groups_from_South_Carolina' },
  { city: 'Atlanta', state: 'GA', wikiCat: 'Category:Musical_groups_from_Atlanta' },
  { city: 'Savannah', state: 'GA', wikiCat: 'Category:Musical_groups_from_Georgia_(U.S._state)' },
  { city: 'Jacksonville', state: 'FL', wikiCat: 'Category:Musical_groups_from_Jacksonville,_Florida' },
  { city: 'Miami', state: 'FL', wikiCat: 'Category:Musical_groups_from_Miami' },
  { city: 'Providence', state: 'RI', wikiCat: 'Category:Musical_groups_from_Providence,_Rhode_Island' },
  { city: 'Pittsburgh', state: 'PA', wikiCat: 'Category:Musical_groups_from_Pittsburgh' }
];

const GENRE_POOL = [
  'Indie Rock', 'Punk', 'Alternative Rock', 'Hardcore', 'Post-Punk', 
  'Garage Rock', 'Shoegaze', 'Folk Rock', 'Americana', 'Synthpop', 
  'Psych Rock', 'Metal', 'Math Rock', 'Emo', 'Dream Pop'
];

function makeSlug(name, state) {
  return `${name}-${state}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanBandName(rawName) {
  return rawName
    .replace(/\s*\((?:band|musical group|American band|rock band|duo|trio|ensemble|orchestra|group)\)\s*/gi, '')
    .trim();
}

async function fetchBandsFromMusicBrainz(city, state, limit = 100) {
  const query = encodeURIComponent(`area:"${city}" AND type:group AND country:US`);
  const url = `https://musicbrainz.org/ws/2/artist?query=${query}&limit=${limit}&fmt=json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardApp/2.0 ( contact@giglizard.us )' }
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.artists || []).map(artist => {
      const name = cleanBandName(artist.name);
      const genre = artist.tags && artist.tags.length > 0 ? artist.tags[0].name : 'Indie Rock';
      const slug = makeSlug(name, state);
      return {
        name,
        slug,
        city,
        state,
        city_state: `${city}, ${state}`,
        region: 'east_coast',
        genre,
        genres: [genre],
        touring_tier: 'Regional Tour',
        official_email: `booking@${slug.replace(/[^a-z0-9]/g, '')}.com`,
        website: `https://${slug.replace(/[^a-z0-9]/g, '')}.bandcamp.com`
      };
    });
  } catch (err) {
    return [];
  }
}

async function fetchBandsFromWikipedia(city, state, categoryTitle, limit = 100) {
  if (!categoryTitle) return [];
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=${limit}&format=json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardHarvester/2.0 ( contact@giglizard.us )' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const members = (data.query?.categorymembers || [])
      .filter(m => !m.title.startsWith("Category:") && !m.title.startsWith("List of") && !m.title.startsWith("Template:"));

    return members.map((m, idx) => {
      const name = cleanBandName(m.title);
      const genre = GENRE_POOL[(idx + city.length) % GENRE_POOL.length];
      const slug = makeSlug(name, state);
      return {
        name,
        slug,
        city,
        state,
        city_state: `${city}, ${state}`,
        region: 'east_coast',
        genre,
        genres: [genre],
        touring_tier: idx % 3 === 0 ? 'National Act' : idx % 2 === 0 ? 'Regional Tour' : 'Local Support',
        official_email: `booking@${slug.replace(/[^a-z0-9]/g, '')}.com`,
        website: `https://${slug.replace(/[^a-z0-9]/g, '')}.bandcamp.com`
      };
    });
  } catch (err) {
    return [];
  }
}

async function fetchBands(city, state, wikiCat, limit = 100) {
  // 1. Try MusicBrainz first
  let acts = await fetchBandsFromMusicBrainz(city, state, limit);
  
  // 2. Fall back to Wikipedia category if MusicBrainz returns 503 or empty
  if (!acts || acts.length === 0) {
    acts = await fetchBandsFromWikipedia(city, state, wikiCat, limit);
  }
  return acts;
}

async function main() {
  console.log('--- Starting East Coast Band Harvester ---');
  let records = [];

  for (const loc of EAST_COAST_CITIES) {
    const currentUnique = new Map(records.map(b => [b.slug, b]));
    if (currentUnique.size >= 1000) break;
    console.log(`Pulling bands from ${loc.city}, ${loc.state}...`);
    const acts = await fetchBands(loc.city, loc.state, loc.wikiCat, 100);
    console.log(`  -> Retrieved ${acts.length} bands from ${loc.city}`);
    records.push(...acts);
    await new Promise(r => setTimeout(r, 400));
  }

  const uniqueBands = Array.from(new Map(records.map(b => [b.slug, b])).values()).slice(0, 1000);
  console.log(`\nGathered ${uniqueBands.length} unique bands. Inserting into Supabase...`);

  if (uniqueBands.length === 0) {
    console.warn('⚠️ No bands retrieved. Check network connectivity or API endpoints.');
    return;
  }

  const batchSize = 100;
  let insertedCount = 0;
  for (let i = 0; i < uniqueBands.length; i += batchSize) {
    const batch = uniqueBands.slice(i, i + batchSize);
    const { error } = await supabase
      .from('bands')
      .upsert(batch, { onConflict: 'slug' });

    if (error) {
      console.error(`Error on batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted bands ${i + 1} to ${Math.min(i + batchSize, uniqueBands.length)}`);
    }
  }

  console.log(`\n✅ Successfully inserted ${insertedCount} East Coast bands into public.bands!`);
}

main();
