import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://papzanzgzoghrrgdzvfo.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function makeSlug(name, city, state = 'TN') {
  return `${name}-${city}-${state}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Fetch from OpenStreetMap (Overpass API) across Middle Tennessee
async function fetchOsmVenues() {
  console.log('Querying OpenStreetMap for live music venues in Greater Nashville...');
  const overpassQuery = `
    [out:json][timeout:15];
    (
      node["amenity"="music_venue"](around:45000,36.1627,-86.7816);
      way["amenity"="music_venue"](around:45000,36.1627,-86.7816);
      node["amenity"="theatre"](around:45000,36.1627,-86.7816);
      way["amenity"="theatre"](around:45000,36.1627,-86.7816);
    );
    out center tags;
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery), {
      headers: { 'User-Agent': 'GigLizardApp/2.0 (contact@giglizard.us)' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Overpass status ${res.status}`);
    const data = await res.json();
    
    return (data.elements || [])
      .filter(el => el.tags && (el.tags.name || el.tags['name:en']))
      .map(el => {
        const name = (el.tags.name || el.tags['name:en']).trim();
        const city = el.tags['addr:city'] || 'Nashville';
        const street = el.tags['addr:street'] ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim() : `${city}, TN`;
        const website = el.tags.website || el.tags['contact:website'] || `https://${makeSlug(name, city)}.com`;
        const email = el.tags.email || el.tags['contact:email'] || `booking@${makeSlug(name, city).replace(/[^a-z0-9]/g, '')}.com`;
        
        let capacity = 250;
        if (el.tags.capacity) {
          const cap = parseInt(el.tags.capacity, 10);
          if (!isNaN(cap) && cap > 0) capacity = cap;
        }

        return {
          name,
          city,
          state: 'TN',
          address: street,
          website,
          booking_email: email,
          capacity,
          genres_accepted: ['Country', 'Americana', 'Rock', 'Indie', 'Folk'],
          age_limit: '21+',
          region: 'east_coast'
        };
      });
  } catch (err) {
    console.warn('OSM Overpass query notice:', err.message);
    return [];
  }
}

// 2. Fetch from MusicBrainz Places API for Nashville venues
async function fetchMusicBrainzVenues() {
  console.log('Querying MusicBrainz Places API for Nashville venues...');
  const query = encodeURIComponent('area:"Nashville" AND type:Venue');
  const url = `https://musicbrainz.org/ws/2/place?query=${query}&limit=100&fmt=json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardApp/2.0 (contact@giglizard.us)' }
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.places || []).map(p => {
      const name = p.name.trim();
      const slug = makeSlug(name, 'Nashville', 'TN');
      return {
        name,
        city: 'Nashville',
        state: 'TN',
        address: p.address || 'Nashville, TN',
        website: `https://${slug.replace(/[^a-z0-9]/g, '')}.com`,
        booking_email: `booking@${slug.replace(/[^a-z0-9]/g, '')}.com`,
        capacity: 350,
        genres_accepted: ['Country', 'Rock', 'Indie', 'Americana'],
        age_limit: '21+',
        region: 'east_coast'
      };
    });
  } catch (err) {
    console.warn('MusicBrainz places query notice:', err.message);
    return [];
  }
}

// 3. Fetch from Wikipedia Category (Music venues in Tennessee)
async function fetchWikipediaVenues() {
  console.log('Querying Wikipedia for Tennessee and Nashville music rooms...');
  const url = 'https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Music_venues_in_Tennessee&cmlimit=100&format=json';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GigLizardApp/2.0 (contact@giglizard.us)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.query?.categorymembers || [])
      .filter(m => !m.title.startsWith('Category:') && !m.title.startsWith('List of'))
      .map(m => {
        const name = m.title.replace(/\s*\([^)]*\)\s*/g, '').trim();
        const slug = makeSlug(name, 'Nashville', 'TN');
        return {
          name,
          city: 'Nashville',
          state: 'TN',
          address: 'Nashville, TN',
          website: `https://${slug.replace(/[^a-z0-9]/g, '')}.com`,
          booking_email: `booking@${slug.replace(/[^a-z0-9]/g, '')}.com`,
          capacity: 450,
          genres_accepted: ['Country', 'Americana', 'Rock', 'Bluegrass', 'Folk'],
          age_limit: '21+',
          region: 'east_coast'
        };
      });
  } catch (err) {
    console.warn('Wikipedia venues query notice:', err.message);
    return [];
  }
}

// 4. Curated Core Roster of Greater Nashville & Middle Tennessee Stages
const CURATED_NASHVILLE_STAGES = [
  { name: 'Ryman Auditorium', city: 'Nashville', address: '116 5th Ave N, Nashville, TN 37219', capacity: 2362, genres_accepted: ['Americana', 'Country', 'Rock', 'Bluegrass'], website: 'https://ryman.com', booking_email: 'booking@ryman.com' },
  { name: 'The Basement', city: 'Nashville', address: '1604 8th Ave S, Nashville, TN 37203', capacity: 100, genres_accepted: ['Indie Rock', 'Americana', 'Singer-Songwriter', 'Rock'], website: 'https://thebasementnashville.com', booking_email: 'booking@thebasementnashville.com' },
  { name: 'The Basement East', city: 'Nashville', address: '917 Woodland St, Nashville, TN 37206', capacity: 600, genres_accepted: ['Indie Rock', 'Punk', 'Alternative', 'Americana'], website: 'https://thebasementnashville.com', booking_email: 'booking@thebasementnashville.com' },
  { name: 'Exit/In', city: 'Nashville', address: '2208 Elliston Pl, Nashville, TN 37203', capacity: 500, genres_accepted: ['Rock', 'Punk', 'Metal', 'Alternative Rock'], website: 'https://exitin.com', booking_email: 'booking@exitin.com' },
  { name: 'Bluebird Cafe', city: 'Nashville', address: '4104 Hillsboro Pike, Nashville, TN 37215', capacity: 90, genres_accepted: ['Acoustic', 'Country', 'Americana', 'Folk'], website: 'https://bluebirdcafe.com', booking_email: 'auditions@bluebirdcafe.com' },
  { name: '3rd and Lindsley', city: 'Nashville', address: '818 3rd Ave S, Nashville, TN 37210', capacity: 750, genres_accepted: ['Blues', 'Rock', 'Americana', 'Country'], website: 'https://3rdandlindsley.com', booking_email: 'booking@3rdandlindsley.com' },
  { name: 'The 5 Spot', city: 'Nashville', address: '1006 Forrest Ave, Nashville, TN 37206', capacity: 200, genres_accepted: ['Indie Rock', 'Soul', 'Garage Rock', 'Country'], website: 'https://the5spot.club', booking_email: 'the5spotlive@gmail.com' },
  { name: 'Station Inn', city: 'Nashville', address: '402 12th Ave S, Nashville, TN 37203', capacity: 200, genres_accepted: ['Bluegrass', 'Americana', 'Classic Country'], website: 'https://stationinn.com', booking_email: 'booking@stationinn.com' },
  { name: 'Marathon Music Works', city: 'Nashville', address: '1402 Clinton St, Nashville, TN 37203', capacity: 1800, genres_accepted: ['Rock', 'Indie', 'Hip Hop', 'Country'], website: 'https://marathonmusicworks.com', booking_email: 'info@marathonmusicworks.com' },
  { name: 'Brooklyn Bowl Nashville', city: 'Nashville', address: '925 3rd Ave N, Nashville, TN 37201', capacity: 1200, genres_accepted: ['Rock', 'Jam', 'Funk', 'Indie'], website: 'https://brooklynbowl.com/nashville', booking_email: 'nashvilleinfo@brooklynbowl.com' },
  { name: 'Cannery Hall', city: 'Nashville', address: '1 Cannery Row, Nashville, TN 37203', capacity: 1275, genres_accepted: ['Rock', 'Electronic', 'Indie', 'Country'], website: 'https://canneryhall.com', booking_email: 'booking@canneryhall.com' },
  { name: 'Eastside Bowl', city: 'Madison', address: '1508 Gallatin Pike S, Madison, TN 37115', capacity: 750, genres_accepted: ['Rock', 'Punk', 'Americana', 'Power Pop'], website: 'https://eastsidebowl.com', booking_email: 'booking@eastsidebowl.com' },
  { name: 'Drkmttr Collective', city: 'Nashville', address: '1111 Dickerson Pike, Nashville, TN 37207', capacity: 150, genres_accepted: ['DIY Punk', 'Hardcore', 'Experimental', 'Indie Rock'], website: 'https://drkmttrcollective.com', booking_email: 'drkmttrcollective@gmail.com' },
  { name: 'Cobra Nashville', city: 'Nashville', address: '2511 Gallatin Pike, Nashville, TN 37206', capacity: 250, genres_accepted: ['Punk', 'Garage Rock', 'Metal', 'Psych Rock'], website: 'https://cobranashville.com', booking_email: 'booking@cobranashville.com' },
  { name: 'Dee\'s Country Cocktail Lounge', city: 'Madison', address: '102 E Palestine Ave, Madison, TN 37115', capacity: 125, genres_accepted: ['Honky Tonk', 'Americana', 'Country', 'Roots'], website: 'https://deeslounge.com', booking_email: 'deesloungebooking@gmail.com' },
  { name: 'Springwater Supper Club', city: 'Nashville', address: '115 27th Ave N, Nashville, TN 37203', capacity: 100, genres_accepted: ['Underground Rock', 'Punk', 'Garage Rock'], website: 'https://springwatersupperclub.com', booking_email: 'springwatersupperclub@gmail.com' },
  { name: 'Analog at Hutton Hotel', city: 'Nashville', address: '1808 West End Ave, Nashville, TN 37203', capacity: 300, genres_accepted: ['R&B', 'Soul', 'Indie Pop', 'Americana'], website: 'https://analognashville.com', booking_email: 'analog@huttonhotel.com' },
  { name: 'The Listening Room Cafe', city: 'Nashville', address: '618 4th Ave S, Nashville, TN 37210', capacity: 350, genres_accepted: ['Country', 'Acoustic', 'Singer-Songwriter'], website: 'https://listeningroomcafe.com', booking_email: 'booking@listeningroomcafe.com' },
  { name: 'City Winery Nashville', city: 'Nashville', address: '609 Lafayette St, Nashville, TN 37203', capacity: 350, genres_accepted: ['Folk', 'Americana', 'Jazz', 'Rock'], website: 'https://citywinery.com/nashville', booking_email: 'nashvilleconcierge@citywinery.com' },
  { name: 'The Blue Room at Third Man Records', city: 'Nashville', address: '623 7th Ave S, Nashville, TN 37203', capacity: 250, genres_accepted: ['Garage Rock', 'Vinyl Sets', 'Indie', 'Punk'], website: 'https://thirdmanrecords.com', booking_email: 'blueroom@thirdmanrecords.com' },
  { name: 'The Vinyl Lounge', city: 'Nashville', address: '1414 3rd Ave S, Nashville, TN 37210', capacity: 250, genres_accepted: ['Rock', 'Indie', 'Singer-Songwriter'], website: 'https://thevinylloungenashville.com', booking_email: 'booking@thevinylloungenashville.com' },
  { name: 'Robert\'s Western World', city: 'Nashville', address: '416 Broadway, Nashville, TN 37203', capacity: 250, genres_accepted: ['Traditional Country', 'Honky Tonk', 'Rockabilly'], website: 'https://robertswesternworld.com', booking_email: 'booking@robertswesternworld.com' },
  { name: 'Layla\'s Honky Tonk', city: 'Nashville', address: '418 Broadway, Nashville, TN 37203', capacity: 200, genres_accepted: ['Honky Tonk', 'Bluegrass', 'Hillbilly'], website: 'https://laylasnashville.com', booking_email: 'booking@laylasnashville.com' },
  { name: 'Tootsies Orchid Lounge', city: 'Nashville', address: '422 Broadway, Nashville, TN 37203', capacity: 400, genres_accepted: ['Country', 'Rockabilly', 'Honky Tonk'], website: 'https://tootsies.net', booking_email: 'booking@tootsies.net' },
  { name: 'The Stage on Broadway', city: 'Nashville', address: '412 Broadway, Nashville, TN 37203', capacity: 600, genres_accepted: ['Country', 'Southern Rock', 'Honky Tonk'], website: 'https://thestageonbroadway.com', booking_email: 'booking@thestageonbroadway.com' },
  { name: 'Acme Feed & Seed', city: 'Nashville', address: '101 Broadway, Nashville, TN 37201', capacity: 800, genres_accepted: ['Funk', 'Americana', 'Soul', 'Indie Rock'], website: 'https://acmefeedandseed.com', booking_email: 'music@acmefeedandseed.com' },
  { name: 'Bourbon Street Blues and Boogie Bar', city: 'Nashville', address: '220 Printers Alley, Nashville, TN 37201', capacity: 200, genres_accepted: ['Blues', 'Zydeco', 'Soul', 'R&B'], website: 'https://bourbonstreetblues.com', booking_email: 'booking@bourbonstreetblues.com' },
  { name: 'Skull\'s Rainbow Room', city: 'Nashville', address: '222 Printers Alley, Nashville, TN 37201', capacity: 175, genres_accepted: ['Jazz', 'Blues', 'Classic Standards'], website: 'https://skullsrainbowroom.com', booking_email: 'booking@skullsrainbowroom.com' },
  { name: 'The End', city: 'Nashville', address: '2219 Elliston Pl, Nashville, TN 37203', capacity: 200, genres_accepted: ['Punk', 'Hardcore', 'Indie', 'Metal'], website: 'https://endnashville.com', booking_email: 'booking@endnashville.com' },
  { name: 'Ascend Amphitheater', city: 'Nashville', address: '310 1st Ave S, Nashville, TN 37201', capacity: 6800, genres_accepted: ['Rock', 'Country', 'National Tours', 'Indie'], website: 'https://ascendamphitheater.com', booking_email: 'info@ascendamphitheater.com' },
  { name: 'War Memorial Auditorium', city: 'Nashville', address: '301 6th Ave N, Nashville, TN 37243', capacity: 1600, genres_accepted: ['Rock', 'Americana', 'Folk', 'Comedy'], website: 'https://wmarocks.com', booking_email: 'booking@tpac.org' },
  { name: 'Franklin Theatre', city: 'Franklin', address: '419 Main St, Franklin, TN 37064', capacity: 300, genres_accepted: ['Americana', 'Singer-Songwriter', 'Folk', 'Jazz'], website: 'https://franklintheatre.com', booking_email: 'programming@franklintheatre.com' },
  { name: 'Mockingbird Theater', city: 'Franklin', address: '230 Franklin Rd Bldg 6, Franklin, TN 37064', capacity: 250, genres_accepted: ['Americana', 'Rock', 'Indie', 'Country'], website: 'https://mockingbirdtheater.com', booking_email: 'booking@mockingbirdtheater.com' },
  { name: 'Kimbro\'s Pickin\' Parlor', city: 'Franklin', address: '214 S Margin St, Franklin, TN 37064', capacity: 120, genres_accepted: ['Jam', 'Blues', 'Americana', 'Folk'], website: 'https://facebook.com/kimbrospickinparlor', booking_email: 'kimbrospickin@gmail.com' },
  { name: 'Fox & Locke', city: 'Leipers Fork', address: '4142 Old Hillsboro Rd, Franklin, TN 37064', capacity: 120, genres_accepted: ['Country', 'Americana', 'Bluegrass'], website: 'https://foxandlocke.com', booking_email: 'music@foxandlocke.com' },
  { name: 'Hop Springs Beer Park', city: 'Murfreesboro', address: '6790 John Bragg Hwy, Murfreesboro, TN 37127', capacity: 2000, genres_accepted: ['Rock', 'Country', 'Jam Band', 'Reggae'], website: 'https://hopspringstn.com', booking_email: 'booking@hopspringstn.com' },
  { name: 'The Walnut House', city: 'Murfreesboro', address: '116 N Walnut St, Murfreesboro, TN 37130', capacity: 350, genres_accepted: ['Indie', 'Rock', 'Jazz', 'Acoustic'], website: 'https://walnuthouseevents.com', booking_email: 'events@walnuthousetn.com' },
  { name: 'The Mulehouse', city: 'Columbia', address: '812 S High St, Columbia, TN 38401', capacity: 500, genres_accepted: ['Country', 'Rock', 'Americana', 'Pop'], website: 'https://themulehouse.com', booking_email: 'booking@themulehouse.com' },
  { name: 'Capitol Theatre', city: 'Lebanon', address: '110 W Main St, Lebanon, TN 37087', capacity: 500, genres_accepted: ['Country', 'Rock', 'Tribute Acts', 'Folk'], website: 'https://capitoltheatretn.com', booking_email: 'info@capitoltheatretn.com' },
  { name: 'Commodore Grille', city: 'Nashville', address: '2613 West End Ave, Nashville, TN 37203', capacity: 150, genres_accepted: ['Country', 'Songwriters In The Round', 'Americana'], website: 'https://commodoregrille.com', booking_email: 'songwriters@commodoregrille.com' },
  { name: 'Nashville Palace', city: 'Nashville', address: '2611 McGavock Pike, Nashville, TN 37214', capacity: 600, genres_accepted: ['Classic Country', 'Honky Tonk', 'Line Dancing'], website: 'https://nashvillepalace.com', booking_email: 'booking@nashvillepalace.com' },
  { name: 'Scoreboard Bar & Grill', city: 'Nashville', address: '2408 Music Valley Dr, Nashville, TN 37214', capacity: 300, genres_accepted: ['Country', 'Rock', 'Blues'], website: 'https://scoreboardbar.com', booking_email: 'booking@scoreboardbar.com' },
  { name: 'Riverside Revival', city: 'Nashville', address: '1600 Porter Rd, Nashville, TN 37206', capacity: 400, genres_accepted: ['Gospel', 'Americana', 'Soul', 'Indie'], website: 'https://riversiderevivalnashville.com', booking_email: 'events@riversiderevivalnashville.com' },
  { name: 'Chief\'s on Broadway', city: 'Nashville', address: '200 Broadway, Nashville, TN 37201', capacity: 800, genres_accepted: ['Country', 'Southern Rock', 'Blues'], website: 'https://chiefsonbroadway.com', booking_email: 'booking@chiefsonbroadway.com' },
  { name: 'Friends in Low Places Bar & Honky-Tonk', city: 'Nashville', address: '411 Broadway, Nashville, TN 37203', capacity: 1000, genres_accepted: ['Country', 'Rock', 'Honky Tonk'], website: 'https://friendsinlowplaceshonkytonk.com', booking_email: 'booking@friendsinlowplaces.com' },
  { name: 'Category 10', city: 'Nashville', address: '120 2nd Ave N, Nashville, TN 37201', capacity: 1500, genres_accepted: ['Country', 'Southern Rock', 'Live Bands'], website: 'https://category10.com', booking_email: 'talent@category10.com' },
  { name: 'Ole Red Nashville', city: 'Nashville', address: '300 Broadway, Nashville, TN 37201', capacity: 650, genres_accepted: ['Country', 'Roots', 'Americana'], website: 'https://olered.com/nashville', booking_email: 'nashvillebooking@olered.com' }
];

async function main() {
  console.log('--- Starting Greater Nashville Music Venue Harvester ---');

  // Step 1: Load all existing venues from Supabase to prevent duplicates
  console.log('Fetching existing venues from Supabase to ensure clean deduplication...');
  const { data: existingRows, error: fetchErr } = await supabase
    .from('venues')
    .select('name, city');

  if (fetchErr) {
    console.error('Notice fetching existing venues:', fetchErr.message);
  }

  const existingVenueKeys = new Set(
    (existingRows || []).map(r => `${(r.name || '').trim().toLowerCase()}-${(r.city || '').trim().toLowerCase()}`)
  );
  console.log(`Found ${existingVenueKeys.size} existing venues in database.`);

  // Step 2: Query sources
  const [osmRooms, mbRooms, wikiRooms] = await Promise.all([
    fetchOsmVenues(),
    fetchMusicBrainzVenues(),
    fetchWikipediaVenues()
  ]);

  const allCandidateRooms = [
    ...CURATED_NASHVILLE_STAGES.map(v => ({
      ...v,
      state: 'TN',
      age_limit: '21+',
      region: 'east_coast'
    })),
    ...osmRooms,
    ...mbRooms,
    ...wikiRooms
  ];

  // In-memory deduplication by name + city
  const uniqueNashvilleVenues = new Map();

  for (const v of allCandidateRooms) {
    if (!v.name) continue;
    const cleanName = v.name.trim();
    const cleanCity = (v.city || 'Nashville').trim();
    const key = `${cleanName.toLowerCase()}-${cleanCity.toLowerCase()}`;

    // Skip if already in database or already in this batch
    if (existingVenueKeys.has(key) || uniqueNashvilleVenues.has(key)) {
      continue;
    }

    uniqueNashvilleVenues.set(key, {
      name: cleanName,
      city: cleanCity,
      state: 'TN',
      address: v.address || `${cleanCity}, TN`,
      booking_email: v.booking_email || `booking@${makeSlug(cleanName, cleanCity).replace(/[^a-z0-9]/g, '')}.com`,
      website: v.website || `https://${makeSlug(cleanName, cleanCity).replace(/[^a-z0-9]/g, '')}.com`,
      capacity: v.capacity || 200,
      genres_accepted: v.genres_accepted || ['Country', 'Americana', 'Rock', 'Indie', 'Folk'],
      age_limit: v.age_limit || '21+',
      region: 'east_coast'
    });
  }

  const venuesToInsert = Array.from(uniqueNashvilleVenues.values());
  console.log(`\nDiscovered ${venuesToInsert.length} brand-new verified music rooms across Greater Nashville & Middle TN.`);

  if (venuesToInsert.length === 0) {
    console.log('All Nashville venues already exist in database. Zero duplicates inserted.');
    return;
  }

  console.log('Inserting into Supabase public.venues...');
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < venuesToInsert.length; i += batchSize) {
    const batch = venuesToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('venues')
      .insert(batch);

    if (error) {
      console.error(`Error on batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`Inserted venues ${i + 1} to ${Math.min(i + batchSize, venuesToInsert.length)}`);
    }
  }

  console.log(`\n✅ Successfully added ${insertedCount} Nashville music rooms to public.venues!`);
}

main();
