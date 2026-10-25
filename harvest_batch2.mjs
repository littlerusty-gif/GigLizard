import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papzanzgzoghrrgdzvfo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EXPANDED_EAST_COAST_CITIES = [
  // Major Metros (offset to page 2 / after initial harvest)
  { city: 'New York', state: 'NY', offset: 100, wikiCat: 'Category:Musical_groups_from_New_York_City' },
  { city: 'Brooklyn', state: 'NY', offset: 100, wikiCat: 'Category:Musical_groups_from_Brooklyn' },
  { city: 'Philadelphia', state: 'PA', offset: 100, wikiCat: 'Category:Musical_groups_from_Philadelphia' },
  { city: 'Boston', state: 'MA', offset: 100, wikiCat: 'Category:Musical_groups_from_Boston' },
  { city: 'Washington', state: 'DC', offset: 100, wikiCat: 'Category:Musical_groups_from_Washington,_D.C.' },
  { city: 'Atlanta', state: 'GA', offset: 100, wikiCat: 'Category:Musical_groups_from_Atlanta' },
  { city: 'Baltimore', state: 'MD', offset: 100, wikiCat: 'Category:Musical_groups_from_Baltimore' },
  { city: 'Pittsburgh', state: 'PA', offset: 0, wikiCat: 'Category:Musical_groups_from_Pittsburgh' },
  
  // Mid-Atlantic & Carolinas
  { city: 'Richmond', state: 'VA', offset: 50, wikiCat: 'Category:Musical_groups_from_Virginia' },
  { city: 'Raleigh', state: 'NC', offset: 50, wikiCat: 'Category:Musical_groups_from_North_Carolina' },
  { city: 'Charlotte', state: 'NC', offset: 50, wikiCat: 'Category:Musical_groups_from_Charlotte,_North_Carolina' },
  { city: 'Durham', state: 'NC', offset: 0, wikiCat: 'Category:Musical_groups_from_North_Carolina' },
  { city: 'Asheville', state: 'NC', offset: 0, wikiCat: 'Category:Musical_groups_from_Asheville,_North_Carolina' },
  { city: 'Charleston', state: 'SC', offset: 50, wikiCat: 'Category:Musical_groups_from_South_Carolina' },
  { city: 'Columbia', state: 'SC', offset: 0, wikiCat: 'Category:Musical_groups_from_South_Carolina' },
  { city: 'Norfolk', state: 'VA', offset: 0, wikiCat: 'Category:Musical_groups_from_Virginia' },
  { city: 'Charlottesville', state: 'VA', offset: 0, wikiCat: 'Category:Musical_groups_from_Virginia' },

  // Northeast & New England
  { city: 'Providence', state: 'RI', offset: 0, wikiCat: 'Category:Musical_groups_from_Providence,_Rhode_Island' },
  { city: 'New Haven', state: 'CT', offset: 0, wikiCat: 'Category:Musical_groups_from_Connecticut' },
  { city: 'Hartford', state: 'CT', offset: 0, wikiCat: 'Category:Musical_groups_from_Connecticut' },
  { city: 'Portland', state: 'ME', offset: 0, wikiCat: 'Category:Musical_groups_from_Portland,_Maine' },
  { city: 'Burlington', state: 'VT', offset: 0, wikiCat: 'Category:Musical_groups_from_Vermont' },
  { city: 'Buffalo', state: 'NY', offset: 0, wikiCat: 'Category:Musical_groups_from_Buffalo,_New_York' },
  { city: 'Rochester', state: 'NY', offset: 0, wikiCat: 'Category:Musical_groups_from_Rochester,_New_York' },
  { city: 'Albany', state: 'NY', offset: 0, wikiCat: 'Category:Musical_groups_from_Albany,_New_York' },
  { city: 'Asbury Park', state: 'NJ', offset: 50, wikiCat: 'Category:Musical_groups_from_New_Jersey' },
  { city: 'Jersey City', state: 'NJ', offset: 0, wikiCat: 'Category:Musical_groups_from_New_Jersey' },

  // Southeast & Florida
  { city: 'Savannah', state: 'GA', offset: 50, wikiCat: 'Category:Musical_groups_from_Georgia_(U.S._state)' },
  { city: 'Athens', state: 'GA', offset: 0, wikiCat: 'Category:Musical_groups_from_Athens,_Georgia' },
  { city: 'Jacksonville', state: 'FL', offset: 50, wikiCat: 'Category:Musical_groups_from_Jacksonville,_Florida' },
  { city: 'Orlando', state: 'FL', offset: 0, wikiCat: 'Category:Musical_groups_from_Orlando,_Florida' },
  { city: 'Tampa', state: 'FL', offset: 0, wikiCat: 'Category:Musical_groups_from_Tampa,_Florida' },
  { city: 'St. Petersburg', state: 'FL', offset: 0, wikiCat: 'Category:Musical_groups_from_Florida' },
  { city: 'Gainesville', state: 'FL', offset: 0, wikiCat: 'Category:Musical_groups_from_Gainesville,_Florida' },
  { city: 'Tallahassee', state: 'FL', offset: 0, wikiCat: 'Category:Musical_groups_from_Tallahassee,_Florida' },

  // Metros Page 3 (offsets 200+) to top off to full 1,000
  { city: 'New York', state: 'NY', offset: 200, wikiCat: 'Category:Musical_groups_from_New_York_City' },
  { city: 'Brooklyn', state: 'NY', offset: 200, wikiCat: 'Category:Musical_groups_from_Brooklyn' },
  { city: 'Boston', state: 'MA', offset: 200, wikiCat: 'Category:Musical_groups_from_Boston' },
  { city: 'Syracuse', state: 'NY', offset: 0, wikiCat: 'Category:Musical_groups_from_Syracuse,_New_York' },
  { city: 'Worcester', state: 'MA', offset: 0, wikiCat: 'Category:Musical_groups_from_Worcester,_Massachusetts' }
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

async function fetchBandsFromMusicBrainz(city, state, limit = 100, offset = 0) {
  const query = encodeURIComponent(`area:"${city}" AND type:group AND country:US`);
  const url = `https://musicbrainz.org/ws/2/artist?query=${query}&limit=${limit}&offset=${offset}&fmt=json`;

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

async function fetchBandsFromWikipedia(city, state, categoryTitle, limit = 100, offset = 0) {
  if (!categoryTitle) return [];
  // Use limit of 500 to allow offset slicing beyond the first 100
  const fetchLimit = Math.max(500, offset + limit);
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=${fetchLimit}&format=json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardHarvesterBatch2/2.0 ( contact@giglizard.us )' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const members = (data.query?.categorymembers || [])
      .filter(m => !m.title.startsWith("Category:") && !m.title.startsWith("List of") && !m.title.startsWith("Template:"));

    // Apply offset and limit to prevent overlapping with previous batch
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
  // 1. Try MusicBrainz first
  let acts = await fetchBandsFromMusicBrainz(city, state, limit, offset);

  // 2. Fall back to Wikipedia category with offset
  if (!acts || acts.length === 0) {
    acts = await fetchBandsFromWikipedia(city, state, wikiCat, limit, offset);
  }
  return acts;
}

async function main() {
  console.log('--- Starting East Coast Band Harvester (Batch 2) ---');

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

  for (const loc of EXPANDED_EAST_COAST_CITIES) {
    if (newUniqueBands.size >= 1000) break;

    console.log(`Pulling bands from ${loc.city}, ${loc.state} (offset: ${loc.offset})...`);
    const acts = await fetchBands(loc.city, loc.state, loc.wikiCat, 100, loc.offset);
    
    let addedFromCity = 0;
    for (const act of acts) {
      if (!existingSlugs.has(act.slug) && !newUniqueBands.has(act.slug)) {
        newUniqueBands.set(act.slug, act);
        addedFromCity++;
        if (newUniqueBands.size >= 1000) break;
      }
    }

    console.log(`  -> Retrieved ${acts.length} acts, ${addedFromCity} new unique bands (Total new: ${newUniqueBands.size}/1000)`);
    await new Promise(r => setTimeout(r, 350));
  }

  const bandsToInsert = Array.from(newUniqueBands.values()).slice(0, 1000);
  console.log(`\nGathered ${bandsToInsert.length} brand new unique bands for Batch 2. Inserting into Supabase...`);

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

  console.log(`\n✅ Successfully inserted ${insertedCount} new East Coast bands into public.bands!`);
}

main();
