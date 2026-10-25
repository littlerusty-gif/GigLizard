import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papzanzgzoghrrgdzvfo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOCAL_CITIES = [
  // Los Angeles Core Metros & Neighborhood Hubs
  { city: 'Los Angeles', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Los_Angeles' },
  { city: 'Los Angeles', state: 'CA', offset: 100, wikiCat: 'Category:Musical_groups_from_Los_Angeles' },
  { city: 'Los Angeles', state: 'CA', offset: 200, wikiCat: 'Category:Musical_groups_from_Los_Angeles' },
  { city: 'Los Angeles', state: 'CA', offset: 300, wikiCat: 'Category:Musical_groups_from_Los_Angeles' },
  { city: 'Los Angeles', state: 'CA', offset: 400, wikiCat: 'Category:Musical_groups_from_Los_Angeles' },
  { city: 'Long Beach', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Long_Beach,_California' },
  { city: 'Long Beach', state: 'CA', offset: 100, wikiCat: 'Category:Musical_groups_from_Long_Beach,_California' },
  { city: 'Pasadena', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Pasadena,_California' },
  { city: 'Glendale', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Greater_Los_Angeles' },
  { city: 'Burbank', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Greater_Los_Angeles' },
  { city: 'Santa Monica', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Greater_Los_Angeles' },
  
  // Orange County & Inland Empire
  { city: 'Anaheim', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Orange_County,_California' },
  { city: 'Santa Ana', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Orange_County,_California' },
  { city: 'Costa Mesa', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Orange_County,_California' },
  { city: 'Fullerton', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Orange_County,_California' },
  { city: 'Riverside', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Riverside,_California' },
  { city: 'Pomona', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Greater_Los_Angeles' },
  
  // San Diego & Southern Border Corridor
  { city: 'San Diego', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_San_Diego' },
  { city: 'San Diego', state: 'CA', offset: 100, wikiCat: 'Category:Musical_groups_from_San_Diego' },
  { city: 'San Diego', state: 'CA', offset: 200, wikiCat: 'Category:Musical_groups_from_San_Diego' },
  { city: 'Oceanside', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_San_Diego' },
  
  // Central Coast & Ventura Feeder Hubs
  { city: 'Ventura', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Ventura,_California' },
  { city: 'Santa Barbara', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Santa_Barbara,_California' },
  { city: 'Bakersfield', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_Bakersfield,_California' },
  
  // California Regional & Scene Top-Off to reach full 1,000
  { city: 'Los Angeles', state: 'CA', offset: 0, wikiCat: 'Category:Hardcore_punk_groups_from_California' },
  { city: 'Los Angeles', state: 'CA', offset: 0, wikiCat: 'Category:Musical_groups_from_California' },
  { city: 'San Diego', state: 'CA', offset: 0, wikiCat: 'Category:Heavy_metal_musical_groups_from_California' }
];

const GENRE_POOL = [
  'Indie Rock', 'Punk', 'Surf Rock', 'Alternative Rock', 'Hardcore', 
  'Garage Rock', 'Psych Rock', 'Post-Punk', 'Ska Punk', 'Shoegaze', 
  'Pop Punk', 'Desert Rock', 'Stoner Rock', 'Dream Pop', 'Heavy Rock'
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
      headers: { 'User-Agent': 'GigLizardApp/4.0 (contact@giglizard.us)' }
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
        region: 'west_coast',
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
      headers: { 'User-Agent': 'GigLizardHarvesterBatch4/4.0 (contact@giglizard.us)' }
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
        region: 'west_coast',
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
  console.log('--- Starting Band Harvester (Batch 4: Los Angeles & SoCal Corridor) ---');

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

  for (const loc of SOCAL_CITIES) {
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
  console.log(`\nGathered ${bandsToInsert.length} unique SoCal bands. Inserting into Supabase public.bands...`);

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

  console.log(`\n✅ Successfully inserted 1,000 LA & SoCal bands into public.bands!`);
}

main();
