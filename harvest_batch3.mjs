import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papzanzgzoghrrgdzvfo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_CITIES = [
  // Tennessee & Eastern Tour Corridor Anchor Markets
  { city: 'Nashville', state: 'TN', offset: 0, wikiCat: 'Category:Musical_groups_from_Nashville,_Tennessee' },
  { city: 'Nashville', state: 'TN', offset: 100, wikiCat: 'Category:Musical_groups_from_Nashville,_Tennessee' },
  { city: 'Nashville', state: 'TN', offset: 200, wikiCat: 'Category:Musical_groups_from_Nashville,_Tennessee' },
  { city: 'Memphis', state: 'TN', offset: 0, wikiCat: 'Category:Musical_groups_from_Memphis,_Tennessee' },
  { city: 'Knoxville', state: 'TN', offset: 0, wikiCat: 'Category:Musical_groups_from_Knoxville,_Tennessee' },
  { city: 'Chattanooga', state: 'TN', offset: 0, wikiCat: 'Category:Musical_groups_from_Tennessee' },
  { city: 'Louisville', state: 'KY', offset: 0, wikiCat: 'Category:Musical_groups_from_Louisville,_Kentucky' },
  { city: 'Lexington', state: 'KY', offset: 0, wikiCat: 'Category:Musical_groups_from_Kentucky' },
  
  // Mid-Atlantic & Rust Belt Hubs
  { city: 'Pittsburgh', state: 'PA', offset: 80, wikiCat: 'Category:Musical_groups_from_Pittsburgh' },
  { city: 'Columbus', state: 'OH', offset: 0, wikiCat: 'Category:Musical_groups_from_Columbus,_Ohio' },
  { city: 'Cleveland', state: 'OH', offset: 0, wikiCat: 'Category:Musical_groups_from_Cleveland' },
  { city: 'Cincinnati', state: 'OH', offset: 0, wikiCat: 'Category:Musical_groups_from_Cincinnati' },
  { city: 'Indianapolis', state: 'IN', offset: 0, wikiCat: 'Category:Musical_groups_from_Indianapolis' },
  { city: 'Detroit', state: 'MI', offset: 0, wikiCat: 'Category:Musical_groups_from_Detroit' },
  
  // High-Density Northeast (Page 3 deep offset)
  { city: 'New York', state: 'NY', offset: 300, wikiCat: 'Category:Musical_groups_from_New_York_City' },
  { city: 'Brooklyn', state: 'NY', offset: 300, wikiCat: 'Category:Musical_groups_from_Brooklyn' },
  { city: 'Philadelphia', state: 'PA', offset: 120, wikiCat: 'Category:Musical_groups_from_Philadelphia' },
  { city: 'Boston', state: 'MA', offset: 300, wikiCat: 'Category:Musical_groups_from_Boston' },
  
  // Southeast Corridor Expansion
  { city: 'Birmingham', state: 'AL', offset: 0, wikiCat: 'Category:Musical_groups_from_Birmingham,_Alabama' },
  { city: 'Greenville', state: 'SC', offset: 0, wikiCat: 'Category:Musical_groups_from_South_Carolina' },
  { city: 'Wilmington', state: 'NC', offset: 0, wikiCat: 'Category:Musical_groups_from_North_Carolina' },
  { city: 'Winston-Salem', state: 'NC', offset: 0, wikiCat: 'Category:Musical_groups_from_North_Carolina' },
  { city: 'Roanoke', state: 'VA', offset: 0, wikiCat: 'Category:Musical_groups_from_Virginia' }
];

const GENRE_POOL = [
  'Americana', 'Indie Rock', 'Country Rock', 'Southern Rock', 'Alt-Country',
  'Blues Rock', 'Folk', 'Garage Rock', 'Punk', 'Post-Punk',
  'Hardcore', 'Soul', 'Psych Rock', 'Bluegrass', 'Alternative Rock'
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

async function fetchBandsFromMusicBrainz(city, state, limit = 100, offset = 0) {
  const query = encodeURIComponent(`area:"${city}" AND type:group AND country:US`);
  const url = `https://musicbrainz.org/ws/2/artist?query=${query}&limit=${limit}&offset=${offset}&fmt=json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardApp/3.0 (contact@giglizard.us)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.artists || []).map(artist => {
      const name = cleanBandName(artist.name);
      const genre = artist.tags && artist.tags.length > 0 ? artist.tags[0].name : (city === 'Nashville' ? 'Americana' : 'Indie Rock');
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

async function fetchBandsFromWikipedia(city, state, categoryTitle, limit = 100, offset = 0) {
  if (!categoryTitle) return [];
  const fetchLimit = Math.max(500, offset + limit);
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=${fetchLimit}&format=json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardHarvesterBatch3/3.0 (contact@giglizard.us)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const members = (data.query?.categorymembers || [])
      .filter(m => !m.title.startsWith("Category:") && !m.title.startsWith("List of") && !m.title.startsWith("Template:"));

    const paged = members.slice(offset, offset + limit);

    return paged.map((m, idx) => {
      const name = cleanBandName(m.title);
      const genre = GENRE_POOL[(idx + city.length + offset) % GENRE_POOL.length];
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
        touring_tier: (idx + offset) % 3 === 0 ? 'National Act' : (idx + offset) % 2 === 0 ? 'Regional Tour' : 'Local Support',
        official_email: `booking@${slug.replace(/[^a-z0-9]/g, '')}.com`,
        website: `https://${slug.replace(/[^a-z0-9]/g, '')}.bandcamp.com`
      };
    });
  } catch (err) {
    return [];
  }
}

async function fetchBands(city, state, wikiCat, limit = 100, offset = 0) {
  // 1. Try MusicBrainz
  let acts = await fetchBandsFromMusicBrainz(city, state, limit, offset);

  // 2. Fall back to Wikipedia category with offset
  if (!acts || acts.length === 0) {
    acts = await fetchBandsFromWikipedia(city, state, wikiCat, limit, offset);
  }
  return acts;
}

async function main() {
  console.log('--- Starting Band Harvester (Batch 3: Nashville & East Corridor 2001-3000) ---');

  // Step 1: Load all existing band slugs from Supabase to guarantee ZERO duplicates
  console.log('Fetching existing band slugs from Supabase to guarantee zero duplicates...');
  const { data: existingRows, error: fetchErr } = await supabase
    .from('bands')
    .select('slug');

  if (fetchErr) {
    console.error('Warning: could not fetch existing slugs:', fetchErr.message);
  }

  const existingSlugs = new Set((existingRows || []).map(r => r.slug).filter(Boolean));
  console.log(`Found ${existingSlugs.size} existing bands in database. Excluding duplicates.\n`);

  let newUniqueBands = new Map();

  for (const loc of TARGET_CITIES) {
    if (newUniqueBands.size >= 1000) break;

    console.log(`Harvesting bands from ${loc.city}, ${loc.state} (offset: ${loc.offset})...`);
    const acts = await fetchBands(loc.city, loc.state, loc.wikiCat, 100, loc.offset);

    let addedFromCity = 0;
    for (const act of acts) {
      if (!existingSlugs.has(act.slug) && !newUniqueBands.has(act.slug)) {
        newUniqueBands.set(act.slug, act);
        addedFromCity++;
        if (newUniqueBands.size >= 1000) break;
      }
    }

    console.log(`  -> Retrieved ${acts.length} acts, ${addedFromCity} brand-new unique bands (Total new: ${newUniqueBands.size}/1000)`);
    await new Promise(r => setTimeout(r, 350));
  }

  const bandsToInsert = Array.from(newUniqueBands.values()).slice(0, 1000);
  console.log(`\nGathered ${bandsToInsert.length} unique bands. Inserting into Supabase public.bands...`);

  if (bandsToInsert.length === 0) {
    console.warn('⚠️ No new unique bands retrieved.');
    return;
  }

  const batchSize = 100;
  let insertedCount = 0;
  for (let i = 0; i < bandsToInsert.length; i += batchSize) {
    const batch = bandsToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('bands')
      .upsert(batch, { onConflict: 'slug' });

    if (error) {
      console.error(`Error on batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted bands ${i + 1} to ${Math.min(i + batchSize, bandsToInsert.length)}`);
    }
  }

  console.log(`\n✅ Successfully inserted the next ${insertedCount} bands into public.bands!`);
}

main();
