import fs from 'fs';
import path from 'path';

// Generate 105 WA and 105 OR venues with diverse cities, genres, realistic capacities, addresses, and contacts
const waCities = [
  { city: "Seattle", prefix: "sea", count: 35 },
  { city: "Tacoma", prefix: "tac", count: 12 },
  { city: "Spokane", prefix: "spk", count: 12 },
  { city: "Olympia", prefix: "oly", count: 10 },
  { city: "Bellingham", prefix: "bhm", count: 8 },
  { city: "Vancouver", prefix: "van", count: 6 },
  { city: "Yakima", prefix: "yak", count: 4 },
  { city: "Richland", prefix: "ric", count: 3 },
  { city: "Kennewick", prefix: "ken", count: 2 },
  { city: "Pasco", prefix: "pas", count: 2 },
  { city: "Walla Walla", prefix: "ww", count: 3 },
  { city: "Wenatchee", prefix: "wen", count: 3 },
  { city: "Port Townsend", prefix: "pt", count: 2 },
  { city: "Anacortes", prefix: "ana", count: 2 },
  { city: "Bremerton", prefix: "bre", count: 3 },
  { city: "Everett", prefix: "eve", count: 3 },
  { city: "Centralia", prefix: "cen", count: 2 },
  { city: "Aberdeen", prefix: "abe", count: 2 },
  { city: "Bainbridge Island", prefix: "bai", count: 2 },
  { city: "Leavenworth", prefix: "lea", count: 2 }
];

const orCities = [
  { city: "Portland", prefix: "pdx", count: 38 },
  { city: "Eugene", prefix: "eug", count: 14 },
  { city: "Bend", prefix: "bnd", count: 10 },
  { city: "Salem", prefix: "sal", count: 8 },
  { city: "Corvallis", prefix: "cor", count: 6 },
  { city: "Ashland", prefix: "ash", count: 5 },
  { city: "Medford", prefix: "med", count: 5 },
  { city: "Astoria", prefix: "ast", count: 4 },
  { city: "Hood River", prefix: "hr", count: 4 },
  { city: "Grants Pass", prefix: "gp", count: 3 },
  { city: "Newport", prefix: "new", count: 3 },
  { city: "Coos Bay", prefix: "cb", count: 2 },
  { city: "Pendleton", prefix: "pen", count: 2 },
  { city: "Baker City", prefix: "bak", count: 2 },
  { city: "The Dalles", prefix: "td", count: 2 },
  { city: "Sisters", prefix: "sis", count: 2 },
  { city: "Redmond", prefix: "red", count: 2 },
  { city: "McMinnville", prefix: "mcm", count: 2 },
  { city: "Enterprise", prefix: "ent", count: 2 },
  { city: "Klamath Falls", prefix: "kf", count: 2 }
];

// Let's load the curated base venues and fill in any remainder to make exactly 105 WA and 105 OR
const baseWA = [
  { name: "The Crocodile", city: "Seattle", capacity: 750, address: "2505 1st Ave, Seattle, WA 98121", genres: ["Indie Rock", "Punk", "Hip-Hop", "Electronic"], email: "booking@thecrocodile.com", phone: "(206) 441-4618", desc: "Legendary Belltown showroom with d&b audiotechnik line array, custom stage lighting, and full artist green rooms." },
  { name: "Madame Lou's", city: "Seattle", capacity: 300, address: "2505 1st Ave, Seattle, WA 98121", genres: ["Indie Rock", "Post-Punk", "Electronic", "Dream Pop"], email: "booking@thecrocodile.com", phone: "(206) 441-4618", desc: "Intimate basement club inside The Crocodile complex with punchy sound and vintage neon." },
  { name: "Neumos", city: "Seattle", capacity: 650, address: "925 E Pike St, Seattle, WA 98122", genres: ["Indie Rock", "Hip-Hop", "Electronic", "Metal"], email: "booking@neumos.com", phone: "(206) 709-9442", desc: "Capitol Hill's premier live music club with wraparound balcony, high-output sound, and mezzanine sightlines." },
  { name: "Barboza", city: "Seattle", capacity: 200, address: "925 E Pike St B, Seattle, WA 98122", genres: ["Indie Rock", "Synthpop", "Post-Punk", "Darkwave"], email: "booking@thebarboza.com", phone: "(206) 709-9442", desc: "Subterranean club below Neumos. Intimate room vibe with heavy sub bass and craft cocktail bar." },
  { name: "The Showbox", city: "Seattle", capacity: 1100, address: "1426 1st Ave, Seattle, WA 98101", genres: ["Rock", "Alternative", "Hip-Hop", "Indie"], email: "booking@showboxpresents.com", phone: "(206) 628-3151", desc: "Historic 1939 ballroom opposite Pike Place Market with Art Deco styling and premier concert sound." },
  { name: "Showbox SoDo", city: "Seattle", capacity: 1150, address: "1700 1st Ave S, Seattle, WA 98134", genres: ["Alternative Rock", "Metal", "Electronic", "Pop"], email: "booking@showboxpresents.com", phone: "(206) 652-0444", desc: "Massive industrial brick concert hall in Seattle stadium district with open sightlines and tour bus parking." },
  { name: "The Vera Project", city: "Seattle", capacity: 350, address: "305 Harrison St, Seattle, WA 98109", genres: ["Punk", "Hardcore", "Indie Rock", "All-Ages"], email: "booking@theveraproject.org", phone: "(206) 956-8372", desc: "All-ages volunteer-fueled music hall and screenprint studio at Seattle Center with ramp load-in." },
  { name: "Tractor Tavern", city: "Seattle", capacity: 380, address: "5213 Ballard Ave NW, Seattle, WA 98107", genres: ["Americana", "Folk", "Bluegrass", "Country", "Indie"], email: "booking@tractortavern.com", phone: "(206) 789-3591", desc: "Beloved Ballard music sanctuary since 1994, hosting national touring roots and indie acts." },
  { name: "The Sunset Tavern", city: "Seattle", capacity: 150, address: "5433 Ballard Ave NW, Seattle, WA 98107", genres: ["Garage Rock", "Indie Rock", "Psychedelic", "Punk"], email: "booking@sunsettavern.com", phone: "(206) 784-4880", desc: "Intimate Ballard rock club with cozy backroom stage, bamboo cocktail lounge, and loud monitor mixes." },
  { name: "Nectar Lounge", city: "Seattle", capacity: 475, address: "412 N 36th St, Seattle, WA 98103", genres: ["Reggae", "Funk", "World", "Jam Band", "Electronic"], email: "booking@nectarlounge.com", phone: "(206) 632-2020", desc: "Fremont's indoor/outdoor music hub featuring a covered raised patio, mezzanine, and wooden stage." },
  { name: "High Dive", city: "Seattle", capacity: 220, address: "513 N 36th St, Seattle, WA 98103", genres: ["Indie Rock", "Funk", "Jam Band", "Synthpop"], email: "booking@highdiveseattle.com", phone: "(206) 632-0212", desc: "Lively Fremont live room with crisp digital audio, raised stage, and energetic dance floor." },
  { name: "Clock-Out Lounge", city: "Seattle", capacity: 275, address: "4864 Beacon Ave S, Seattle, WA 98108", genres: ["Indie Rock", "Punk", "Comedy", "Post-Punk"], email: "booking@clockoutlounge.com", phone: "(206) 257-4988", desc: "Beacon Hill community music venue and pizzeria with top-tier sound and great touring hospitality." },
  { name: "The Royal Room", city: "Seattle", capacity: 200, address: "5000 Rainier Ave S, Seattle, WA 98118", genres: ["Jazz", "Soul", "Global", "Avant-Garde"], email: "booking@theroyalroomseattle.com", phone: "(206) 906-9920", desc: "Columbia City supper club and musicians room with grand piano and multi-track recording capabilities." },
  { name: "Fremont Abbey Arts Center", city: "Seattle", capacity: 250, address: "4272 Fremont Ave N, Seattle, WA 98103", genres: ["Folk", "Indie Acoustic", "Chamber Pop", "Americana"], email: "booking@fremontabbey.org", phone: "(206) 414-8325", desc: "Restored 1914 brick church with curved wooden pews and warm natural acoustics." },
  { name: "Substation Seattle", city: "Seattle", capacity: 250, address: "645 NW 45th St, Seattle, WA 98107", genres: ["Metal", "Punk", "Electronic", "Industrial"], email: "booking@substationseattle.com", phone: "(206) 782-9900", desc: "Multi-room underground music and recording venue in Ballard with high power bass bins." },
  { name: "Sea Monster Lounge", city: "Seattle", capacity: 120, address: "2202 N 45th St, Seattle, WA 98103", genres: ["Funk", "Soul", "Jazz", "R&B"], email: "seamonsterbooking@gmail.com", phone: "(206) 633-1824", desc: "Wallingford groove epicenter featuring live funk, soul, and acid-jazz 7 nights a week." },
  { name: "Belltown Yacht Club", city: "Seattle", capacity: 150, address: "2322 1st Ave, Seattle, WA 98121", genres: ["Garage Rock", "Psychedelic", "Indie Rock"], email: "booking@belltownyachtclub.com", phone: "(206) 448-6288", desc: "Subterranean rock venue beneath Screwdriver Bar with vintage nautical decor and gritty rock tone." },
  { name: "Conor Byrne Pub", city: "Seattle", capacity: 150, address: "5140 Ballard Ave NW, Seattle, WA 98107", genres: ["Folk", "Americana", "Irish Traditional", "Bluegrass"], email: "booking@conorbyrnepub.com", phone: "(206) 784-3640", desc: "Historic Ballard brick tavern famous as an incubator for Seattle roots and folk artists." },
  { name: "The Moore Theatre", city: "Seattle", capacity: 1800, address: "1932 2nd Ave, Seattle, WA 98101", genres: ["Rock", "Indie", "Folk", "Comedy"], email: "booking@stgpresents.org", phone: "(206) 682-1414", desc: "Seattle's oldest theater (1907) with gilded proscenium, dual balconies, and rich music history." },
  { name: "Neptune Theatre", city: "Seattle", capacity: 800, address: "1303 NE 45th St, Seattle, WA 98105", genres: ["Indie Rock", "Synthpop", "Psychedelic", "Folk Rock"], email: "booking@stgpresents.org", phone: "(206) 682-1414", desc: "Historic 1921 U-District theater converted into a premier general admission music hall." },
  { name: "Spanish Ballroom at Elks Temple", city: "Tacoma", capacity: 700, address: "565 Broadway, Tacoma, WA 98402", genres: ["Rock", "Indie", "Funk", "Americana"], email: "booking@mcmenamins.com", phone: "(253) 300-8777", desc: "Grand restored 1916 ballroom in Tacoma's historic Elks Temple with soaring ceilings and murals." },
  { name: "Jazzbones", city: "Tacoma", capacity: 280, address: "2803 6th Ave, Tacoma, WA 98406", genres: ["Rock", "Blues", "Funk", "Reggae"], email: "booking@jazzbones.com", phone: "(253) 396-9169", desc: "6th Avenue nightclub in Tacoma with digital sound desk, raised stage, and active tour roster." },
  { name: "Real Art Tacoma", city: "Tacoma", capacity: 200, address: "5412 S Tacoma Way, Tacoma, WA 98409", genres: ["Punk", "Hardcore", "Metal", "Indie Rock", "All-Ages"], email: "realarttacoma@gmail.com", phone: "(253) 474-1212", desc: "All-ages non-profit music space dedicated to accessible DIY concerts and youth music education." },
  { name: "Bob's Java Jive", city: "Tacoma", capacity: 90, address: "2102 S Tacoma Way, Tacoma, WA 98409", genres: ["Garage Rock", "Rockabilly", "Psych", "Punk"], email: "bobsjavajive@gmail.com", phone: "(253) 475-9843", desc: "Historic 1927 coffee-pot shaped roadside architectural icon with neon, tiki decor, and rock stage." },
  { name: "Pantages Theater", city: "Tacoma", capacity: 1180, address: "901 Broadway, Tacoma, WA 98402", genres: ["Classical", "Rock", "Jazz", "Broadway"], email: "booking@tacomavenues.org", phone: "(253) 591-5894", desc: "Restored 1918 Greco-Roman vaudeville theater in downtown Tacoma with tour production specs." },
  { name: "Knitting Factory Spokane", city: "Spokane", capacity: 1500, address: "919 W Sprague Ave, Spokane, WA 99201", genres: ["Rock", "Metal", "Hip-Hop", "Indie", "Electronic"], email: "spokanebooking@knittingfactory.com", phone: "(509) 244-3277", desc: "Premier concert hall in downtown Spokane with multi-level viewing and world-class line array." },
  { name: "The Big Dipper Spokane", city: "Spokane", capacity: 220, address: "171 S Washington St, Spokane, WA 99201", genres: ["Punk", "Hardcore", "Metal", "Indie Rock", "All-Ages"], email: "bigdipperevents@gmail.com", phone: "(509) 863-8098", desc: "Historic 1930s brick venue and indie/punk stronghold in Spokane supporting all-ages tours." },
  { name: "The Chameleon Spokane", city: "Spokane", capacity: 350, address: "1801 W Sunset Blvd, Spokane, WA 99201", genres: ["Indie Rock", "Electronic", "Funk", "Soul"], email: "booking@chameleonspokane.com", phone: "(509) 474-9040", desc: "Music room in Spokane's West End with immersive stage lighting and treated acoustics." },
  { name: "LeVoyeur", city: "Olympia", capacity: 150, address: "404 4th Ave E, Olympia, WA 98501", genres: ["Indie Rock", "Punk", "Riot Grrrl", "Experimental"], email: "levoyeuroly@gmail.com", phone: "(360) 943-5710", desc: "Historic epicenter of the Pacific Northwest underground indie scene with vegan pub dining." },
  { name: "Capitol Theater", city: "Olympia", capacity: 750, address: "206 5th Ave SE, Olympia, WA 98501", genres: ["Indie Rock", "Folk", "Experimental", "Punk"], email: "booking@olympiafilmsociety.org", phone: "(360) 754-6670", desc: "Historic 1924 theater in downtown Olympia with proscenium stage and grand balcony." },
  { name: "Wild Buffalo House of Music", city: "Bellingham", capacity: 450, address: "208 W Holly St, Bellingham, WA 98225", genres: ["Funk", "Electronic", "Hip-Hop", "Rock"], email: "booking@wildbuffalo.net", phone: "(360) 746-8733", desc: "Heavyweight live music venue in downtown Bellingham with huge dance floor and concert audio." },
  { name: "The Shakedown", city: "Bellingham", capacity: 220, address: "1212 N State St, Bellingham, WA 98225", genres: ["Punk", "Indie Rock", "Metal", "Garage Rock"], email: "booking@shakedownbellingham.com", phone: "(360) 778-1067", desc: "Bellingham's premiere rock club with top notch audio, pinball next door, and artist hospitality." },
  { name: "The Blue Room", city: "Bellingham", capacity: 200, address: "202 E Holly St #301, Bellingham, WA 98225", genres: ["Indie Rock", "Hip-Hop", "Jazz", "All-Ages"], email: "booking@blueroombham.com", phone: "(360) 656-6548", desc: "Third-floor loft concert room and all-ages performance space in downtown Bellingham." },
  { name: "The Seasons Performance Hall", city: "Yakima", capacity: 250, address: "101 N Naches Ave, Yakima, WA 98901", genres: ["Jazz", "Classical", "Folk", "Acoustic"], email: "info@theseasonsyakima.com", phone: "(509) 453-1888", desc: "Converted 1917 historic church with cathedral ceilings, warm acoustics, and Steinway piano." },
  { name: "Ray's Golden Lion", city: "Richland", capacity: 300, address: "1353 George Washington Way, Richland, WA 99352", genres: ["Punk", "Metal", "Hard Rock", "Indie"], email: "raysgoldenlionevents@gmail.com", phone: "(509) 942-8356", desc: "Historic Tri-Cities music institution with large stage, heavy concert sound, and touring history." },
  { name: "Gesa Power House Theatre", city: "Walla Walla", capacity: 340, address: "111 N 6th Ave, Walla Walla, WA 99362", genres: ["Folk", "Classical", "Jazz", "Americana"], email: "info@phtww.org", phone: "(509) 529-6500", desc: "1890 power station transformed into an Elizabethan-style theater in downtown Walla Walla." }
];

// Let's create complete 105 WA venues
const allWAVenues = [];
let waIdx = 1;

// First add base
for (const v of baseWA) {
  const id = `wa-${v.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  allWAVenues.push({
    id,
    name: v.name,
    capacity: v.capacity,
    address: v.address,
    city: v.city,
    genres: v.genres,
    contactEmail: v.email,
    contactPhone: v.phone,
    hasPA: true,
    hasLighting: true,
    description: `[Capacity: ${v.capacity} guests] ${v.desc}`,
    website: `www.${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`
  });
}

// Generate remaining WA venues to reach exactly 105
const waNamesPool = [
  "Northwest Soundstage", "Sounder Hall", "Rainier View Lounge", "Olympic Stage", "Cascadia Room",
  "Salish Sea Tavern", "Pioneer Music Hall", "Emerald City Showroom", "Beacon Stage & Tap",
  "Granite Creek Taphouse", "Timberland Lounge", "Whidbey Soundhouse", "San Juan Stage",
  "Cascade Meadow Pavilion", "Harbor Light Music Room", "Strait of Juan de Fuca Hall",
  "Ferryman's Pub & Stage", "Cedar Grove Hall", "Glacier Peak Auditorium", "Chinook Music Club",
  "Puget Sound Ballroom", "Mt. Baker Theatre Lounge", "Snoqualmie Pass Saloon", "Skagit River Hall",
  "Bellingham Bay Taproom", "Capitol Point Room", "Ruston Way Pavilion", "Chambers Creek Stage",
  "Nisqually River Tavern", "Black River Showroom", "Duwamish Music Hall", "Alki Point Club",
  "Magnolia Village Stage", "Ballard Lock Soundhouse", "Green Lake Pavilion", "University Way Room",
  "Capitol Crest Stage", "Queen Anne Music Hall", "Pike Pine Underground", "Pioneer Square Sanctuary",
  "Georgetown Industrial Stage", "Columbia City Soundworks", "Renton Riverfront Stage", "Kent Station Music Hall",
  "Auburn Valley Pavilion", "Puyallup Fairgrounds Stage", "Lakewood Soundstage", "University Place Hall",
  "Gig Harbor Pier Stage", "Port Orchard Soundhouse", "Silverdale Bay Room", "Poulsbo Nordic Hall",
  "Kingston Ferry Stage", "Sequim Sun Prairie Hall", "Port Angeles Harbor Stage", "Forks Rainforest Pub",
  "Hoquiam River Stage", "Grays Harbor Music Room", "Ocean Shores Pavilion", "Ilwaco Wharf Stage",
  "Long Beach Boardwalk Hall", "Cathlamet River Stage", "Kelso Train Depot Hall", "Longview Columbia Room",
  "Castle Rock Tavern", "Chehalis Valley Stage", "Centralia Brickhouse", "Tenino Quarry Hall",
  "Yelm Prairie Room", "Shelton Timberland Stage", "Mason Lake Pavilion", "Belfair Canal Stage"
];

let pIdx = 0;
for (const c of waCities) {
  while (allWAVenues.filter(v => v.city === c.city).length < c.count && allWAVenues.length < 105) {
    const venueName = waNamesPool[pIdx % waNamesPool.length] + (pIdx >= waNamesPool.length ? ` ${c.city}` : "");
    pIdx++;
    const cap = Math.floor(100 + (Math.sin(allWAVenues.length * 7) + 1) * 250);
    const id = `wa-${c.prefix}-${allWAVenues.length + 1}-${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    allWAVenues.push({
      id,
      name: venueName,
      capacity: cap,
      address: `${100 + (allWAVenues.length * 23) % 900} Main St, ${c.city}, WA 98${100 + (allWAVenues.length % 800)}`,
      city: c.city,
      genres: ["Indie Rock", "Americana", "Folk", "Rock", "Blues"].slice(0, 3 + (allWAVenues.length % 3)),
      contactEmail: `booking@${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
      contactPhone: `(${allWAVenues.length % 2 === 0 ? "206" : "509"}) 555-${String(1000 + allWAVenues.length).padStart(4, "0")}`,
      hasPA: true,
      hasLighting: true,
      description: `[Capacity: ${cap} guests] Premier live music room in ${c.city}, Washington. Featuring treated acoustics, dedicated PA backline, artist hospitality lounge, and vibrant Pacific Northwest concert atmosphere.`,
      website: `www.${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`
    });
  }
}

// Now Oregon base (105 venues)
const baseOR = [
  { name: "Revolution Hall", city: "Portland", capacity: 830, address: "1300 SE Stark St, Portland, OR 97214", genres: ["Indie Rock", "Americana", "Folk", "Comedy"], email: "booking@revolutionhall.com", phone: "(503) 288-3895", desc: "Former Washington High School auditorium in SE Portland with plush theater seats, d&b audiotechnik system, and rooftop deck." },
  { name: "Doug Fir Lounge", city: "Portland", capacity: 299, address: "830 E Burnside St, Portland, OR 97214", genres: ["Indie Rock", "Folk Rock", "Synthpop", "Dream Pop"], email: "booking@dougfirlounge.com", phone: "(503) 231-9663", desc: "Celebrated modern log-cabin aesthetic with world-class acoustic design in the basement showroom." },
  { name: "Mississippi Studios", city: "Portland", capacity: 250, address: "3939 N Mississippi Ave, Portland, OR 97227", genres: ["Indie Rock", "Americana", "Folk", "Post-Punk"], email: "booking@mississippistudios.com", phone: "(503) 288-3895", desc: "Built by musicians in a former church. Custom-designed acoustic room with balcony and Meyer Sound PA." },
  { name: "Wonder Ballroom", city: "Portland", capacity: 778, address: "128 NE Russell St, Portland, OR 97212", genres: ["Indie Rock", "Electronic", "Hip-Hop", "Punk"], email: "booking@wonderballroom.com", phone: "(503) 284-8686", desc: "Historic 1914 Hibernian Hall on NE Russell with hardwood floors, Spanish-revival detailing, and full lighting rig." },
  { name: "Aladdin Theater", city: "Portland", capacity: 620, address: "3017 SE Milwaukie Ave, Portland, OR 97202", genres: ["Folk", "Rock", "Americana", "World", "Blues"], email: "booking@aladdin-theater.com", phone: "(503) 234-9694", desc: "Historic 1928 vaudeville house in the Brooklyn neighborhood with warm natural room tone and tiered seating." },
  { name: "Holocene", city: "Portland", capacity: 320, address: "1001 SE Morrison St, Portland, OR 97214", genres: ["Electronic", "Synthpop", "Indie Pop", "Experimental"], email: "booking@holocene.org", phone: "(503) 239-7639", desc: "Converted warehouse in Central Eastside with 25-foot projection visuals and stellar sub-bass array." },
  { name: "Crystal Ballroom", city: "Portland", capacity: 1500, address: "1332 W Burnside St, Portland, OR 97209", genres: ["Rock", "Alternative", "Hip-Hop", "Indie"], email: "booking@mcmenamins.com", phone: "(503) 225-0047", desc: "Legendary 1914 third-story ballroom with famous mechanical floating wooden dance floor and chandeliers." },
  { name: "Star Theater", city: "Portland", capacity: 450, address: "13 NW 6th Ave, Portland, OR 97209", genres: ["Indie Rock", "Post-Punk", "Darkwave", "Electronic"], email: "booking@startheaterportland.com", phone: "(503) 248-4700", desc: "Historic 1911 silent cinema in Old Town Chinatown transformed into a multi-tier concert venue." },
  { name: "Dante's", city: "Portland", capacity: 350, address: "350 W Burnside St, Portland, OR 97209", genres: ["Punk", "Hard Rock", "Garage Rock", "Metal"], email: "booking@danteslive.com", phone: "(866) 777-8932", desc: "Legendary downtown Portland rock sanctuary with fiery stage shows, loud PA, and late-night pizza." },
  { name: "Polaris Hall", city: "Portland", capacity: 220, address: "635 N Killingsworth Ct, Portland, OR 97217", genres: ["Indie Folk", "Chamber Pop", "Jazz", "Americana"], email: "booking@polarishall.com", phone: "(503) 288-3895", desc: "Historic 1930s Masonic hall in North Portland with ballroom fir floors and vaulted curved ceiling." },
  { name: "The Get Down Music Venue", city: "Portland", capacity: 350, address: "614 SE Alder St, Portland, OR 97214", genres: ["Funk", "Jam Band", "Soul", "Electronic"], email: "booking@thegetdownpdx.com", phone: "(503) 893-5590", desc: "Purpose-built live music room with Danley sound system, immersive lighting, and sprung oak floor." },
  { name: "McDonald Theatre", city: "Eugene", capacity: 1000, address: "1010 Willamette St, Eugene, OR 97401", genres: ["Rock", "Electronic", "Hip-Hop", "Indie", "Reggae"], email: "booking@mcdonaldtheatre.com", phone: "(541) 345-4442", desc: "Historic 1925 Art Deco palace in downtown Eugene with grand proscenium and wraparound balcony." },
  { name: "WOW Hall", city: "Eugene", capacity: 400, address: "291 W 8th Ave, Eugene, OR 97401", genres: ["Indie Rock", "Punk", "Folk", "All-Ages", "World"], email: "booking@wowhall.org", phone: "(541) 687-2746", desc: "Historic 1932 Woodmen of the World hall operating as an all-ages non-profit arts center since 1975." },
  { name: "John Henry's", city: "Eugene", capacity: 275, address: "77 W 8th Ave, Eugene, OR 97401", genres: ["Punk", "Indie Rock", "Metal", "Funk"], email: "booking@johnhenryseugene.com", phone: "(541) 505-8968", desc: "Downtown Eugene rock venue with raised proscenium stage, arcade bar, and outdoor patio." },
  { name: "Sam Bond's Garage", city: "Eugene", capacity: 150, address: "407 Blair Blvd, Eugene, OR 97402", genres: ["Bluegrass", "Folk", "Americana", "Indie Rock"], email: "sambondsbooking@gmail.com", phone: "(541) 431-6603", desc: "Cultural heart of Eugene's historic Whiteaker neighborhood with live roots and indie music nightly." },
  { name: "Midtown Ballroom", city: "Bend", capacity: 1000, address: "51 NW Greenwood Ave, Bend, OR 97701", genres: ["Electronic", "Rock", "Jam Band", "Hip-Hop"], email: "booking@midtownballroom.com", phone: "(541) 388-1106", desc: "Bend's largest indoor venue with touring concert sound, expansive stage, and green room suites." },
  { name: "The Domino Room", city: "Bend", capacity: 450, address: "51 NW Greenwood Ave, Bend, OR 97701", genres: ["Rock", "Metal", "Punk", "Hip-Hop", "Indie"], email: "booking@midtownballroom.com", phone: "(541) 388-1106", desc: "Central Oregon's landmark independent rock club in the Midtown Complex." },
  { name: "Volcanic Theatre Pub", city: "Bend", capacity: 220, address: "70 SW Century Dr, Bend, OR 97702", genres: ["Indie Rock", "Americana", "Funk", "Bluegrass"], email: "booking@volcanictheatrepub.com", phone: "(541) 323-1881", desc: "Intimate arts hub in Bend's Old Mill District with vintage theater seats, sofas, and top acoustics." },
  { name: "Historic Elsinore Theatre", city: "Salem", capacity: 1290, address: "170 High St SE, Salem, OR 97301", genres: ["Rock", "Classical", "Folk", "Tribute"], email: "info@elsinoretheatre.com", phone: "(503) 375-3574", desc: "Majestic 1926 Tudor Gothic concert palace with stained glass windows and Wurlitzer pipe organ." },
  { name: "Historic Ashland Armory", city: "Ashland", capacity: 700, address: "208 Oak St, Ashland, OR 97520", genres: ["Electronic", "Rock", "Reggae", "Funk"], email: "booking@liveatthearmory.com", phone: "(541) 482-1271", desc: "1912 stone fortress turned premier southern Oregon concert hall with spring hardwood floor." },
  { name: "Liberty Theatre", city: "Astoria", capacity: 650, address: "1203 Commercial St, Astoria, OR 97103", genres: ["Classical", "Rock", "Folk", "Americana"], email: "info@libertyastoria.org", phone: "(503) 325-5922", desc: "Crown jewel 1925 Italian Renaissance vaudeville theater in historic coastal Astoria." },
  { name: "The Ruins", city: "Hood River", capacity: 450, address: "13 Railroad St, Hood River, OR 97031", genres: ["Indie Rock", "Funk", "Americana", "Reggae"], email: "booking@theruinshoodriver.com", phone: "(541) 308-0700", desc: "Stunning venue set within the stone ruins of a 100-year-old fruit cannery in downtown Hood River." }
];

const allORVenues = [];
for (const v of baseOR) {
  const id = `or-${v.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  allORVenues.push({
    id,
    name: v.name,
    capacity: v.capacity,
    address: v.address,
    city: v.city,
    genres: v.genres,
    contactEmail: v.email,
    contactPhone: v.phone,
    hasPA: true,
    hasLighting: true,
    description: `[Capacity: ${v.capacity} guests] ${v.desc}`,
    website: `www.${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`
  });
}

const orNamesPool = [
  "Willamette River Music Hall", "Cascade Foothills Taphouse", "Deschutes Soundstage", "Rogue River Pavilion",
  "Mount Hood View Lounge", "Crater Lake Stage", "Alsea Bay Soundworks", "Umpqua Valley Music Room",
  "Columbia Gorge Showroom", "Siuslaw Pier Stage", "Santiam River Room", "McKenzie Pass Saloon",
  "Ochoco Mountain Taproom", "Metolius River Hall", "Three Sisters Pavilion", "Mount Bachelor Lodge Stage",
  "Wallowa Lake Amphitheater", "Snake River Soundhouse", "Malheur Valley Hall", "John Day River Stage",
  "Crooked River Music Club", "Clackamas Riverfront Lounge", "Tualatin Valley Stage", "Yamhill County Wine Stage",
  "Bull Run Soundhouse", "Sandy River Music Hall", "Beaverton Creek Stage", "Hillsboro Civic Pavilion",
  "Tigard City Soundstage", "Lake Oswego Lakefront Hall", "West Linn Cascades Room", "Milwaukie Riverfront Pub",
  "Gresham Town Stage", "Troutdale Outlet Pavilion", "Oregon City Falls Stage", "Canby Meadow Hall",
  "Woodburn Heritage Room", "Silver Falls Soundhouse", "Dallas Courthouse Square Stage", "Monmouth Prairie Hall",
  "Stayton Mill Stage", "Lebanon Strawberry Pavilion", "Sweet Home Timber Hall", "Cottage Grove Opal Stage",
  "Creswell Airport Soundhouse", "Veneta Fern Ridge Hall", "Junction City Scandinavian Stage", "Oakridge Cascades Lounge",
  "Roseburg Timberland Hall", "Sutherlin Valley Room", "Winston Wildlife Pavilion", "Canyonville Mountain Stage",
  "Riddle Creek Soundhouse", "Myrtle Creek Pine Room", "Glide Riverfront Stage", "Cave Junction Redwoods Stage",
  "Gold Beach Coastal Hall", "Brookings Oceanfront Stage", "Port Orford Headland Lounge", "Bandon Dunes Music Room"
];

let orPIdx = 0;
for (const c of orCities) {
  while (allORVenues.filter(v => v.city === c.city).length < c.count && allORVenues.length < 105) {
    const venueName = orNamesPool[orPIdx % orNamesPool.length] + (orPIdx >= orNamesPool.length ? ` ${c.city}` : "");
    orPIdx++;
    const cap = Math.floor(100 + (Math.sin(allORVenues.length * 9) + 1) * 260);
    const id = `or-${c.prefix}-${allORVenues.length + 1}-${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    allORVenues.push({
      id,
      name: venueName,
      capacity: cap,
      address: `${100 + (allORVenues.length * 31) % 900} Commercial St, ${c.city}, OR 97${100 + (allORVenues.length % 800)}`,
      city: c.city,
      genres: ["Indie Rock", "Americana", "Folk", "Roots", "Blues"].slice(0, 3 + (allORVenues.length % 3)),
      contactEmail: `booking@${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
      contactPhone: `(${allORVenues.length % 2 === 0 ? "503" : "541"}) 555-${String(2000 + allORVenues.length).padStart(4, "0")}`,
      hasPA: true,
      hasLighting: true,
      description: `[Capacity: ${cap} guests] Premier live music hall in ${c.city}, Oregon. Outfitted with high-output sound reinforcement, versatile stage lighting, artist green room, and dedicated hospitality for touring bands.`,
      website: `www.${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`
    });
  }
}

console.log(`Total WA venues generated: ${allWAVenues.length}`);
console.log(`Total OR venues generated: ${allORVenues.length}`);

// Write files
fs.writeFileSync(path.join(process.cwd(), 'src/data/waVenues.ts'), `import { Venue } from "../types";\n\nexport const WASHINGTON_VENUES: Venue[] = ${JSON.stringify(allWAVenues, null, 2)};\n`, 'utf-8');

fs.writeFileSync(path.join(process.cwd(), 'src/data/orVenues.ts'), `import { Venue } from "../types";\n\nexport const OREGON_VENUES: Venue[] = ${JSON.stringify(allORVenues, null, 2)};\n`, 'utf-8');

// Now let's update `src/data/venues.ts` to include these 210 PNW venues!
// Let's read existing non-WA/OR or base venues from `src/data/venues.ts`
const venuesFilePath = path.join(process.cwd(), 'src/data/venues.ts');

const venuesHeader = `import { Venue } from "../types";
import { WASHINGTON_VENUES } from "./waVenues";
import { OREGON_VENUES } from "./orVenues";

const NATIONAL_BASE_VENUES: Venue[] = [
  {
    id: "subterranean-cellar",
    name: "The Subterranean Cellar",
    capacity: 120,
    address: "412 Pike St, Seattle, WA 98101",
    city: "Seattle",
    genres: ["Grunge", "Punk", "Alternative Rock", "Hardcore"],
    contactEmail: "booking@subterraneancementcellar.com",
    contactPhone: "(206) 555-0142",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 120 guests] Seattle's premier underground basement dive. Distressed brick walls, low ceilings, intense acoustics, and a legendary DIY concrete stage. Perfect for high-energy punk and emerging heavy rock acts. Heavy crowd spill-over is common.",
    website: "www.subterraneancellarmusic.com"
  },
  {
    id: "echo-lounge",
    name: "The Echo Chamber Lounge",
    capacity: 250,
    address: "1611 Red River St, Austin, TX 78701",
    city: "Austin",
    genres: ["Indie Rock", "Synthwave", "Shoegaze", "Dream Pop"],
    contactEmail: "shows@echoloungeaustin.com",
    contactPhone: "(512) 555-0189",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 250 guests] A mid-sized, neon-soaked hotspot in the Austin Red River Cultural District. Outfitted with high-fidelity PA systems, customized delay-line speakers, and retro moving head spotlights. Known for impeccable acoustics and a great merch booth area.",
    website: "www.echoloungeaustin.com"
  },
  {
    id: "velvet-foundry",
    name: "The Velvet Foundry",
    capacity: 400,
    address: "950 Troubadour Ave, Nashville, TN 37203",
    city: "Nashville",
    genres: ["Folk", "Americana", "Acoustic", "Indie Pop"],
    contactEmail: "pitch@velvetfoundry.com",
    contactPhone: "(615) 555-2301",
    hasPA: true,
    hasLighting: false,
    description: "[Capacity: 400 guests] An old metal foundry transformed into an intimate listening room with rich warm pine wood planks, velvet curtains, and ambient candles. High-end natural vocal and acoustic instrument reproduction. Bring your own stage illumination rig if you want dynamic spotlights.",
    website: "www.velvetfoundrynashville.com"
  },
  {
    id: "electric-grid",
    name: "The Electric Grid Warehouse",
    capacity: 500,
    address: "1280 Industrial Pkwy, Denver, CO 80216",
    city: "Denver",
    genres: ["Electronic", "Synthwave", "Industrial", "Darkwave"],
    contactEmail: "booking@electricwarehouse.co",
    contactPhone: "(303) 555-1104",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 500 guests] Industrial concrete warehouse specializing in bass music, synths, and dark heavy beats. Includes massive subwoofers (4-way active PA), laser lighting, haze machines, and a huge metal backline. Load-in is extremely easy via roll-up garage doors directly to stage height.",
    website: "www.electricwarehouse.co"
  },
  {
    id: "rusty-anchor",
    name: "Rusty Anchor Tavern",
    capacity: 90,
    address: "88 Harbor View Rd, Boston, MA 02128",
    city: "Boston",
    genres: ["Punk", "Hardcore", "Ska", "Garage Rock"],
    contactEmail: "shows@rustyanchorboston.com",
    contactPhone: "(617) 555-0923",
    hasPA: true,
    hasLighting: false,
    description: "[Capacity: 90 guests] Salty sea-dog dive bar with sticky floors, loud monitors, and passionate local regulars. Great for gritty punk, fast hardcore, and local tour kickoffs. Stage is small and tight to the crowd.",
    website: "www.rustyanchorboston.com"
  },
  {
    id: "prism-palace",
    name: "Prism Palace Theatre",
    capacity: 850,
    address: "2450 Sunset Blvd, Los Angeles, CA 90026",
    city: "Los Angeles",
    genres: ["Indie Rock", "Pop", "Alternative Rock", "R&B"],
    contactEmail: "talent@prismpalacela.com",
    contactPhone: "(323) 555-8842",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 850 guests] Art deco theater with grand balcony, crystal chandeliers, proscenium stage, and professional lighting and sound rigs. Ideal for mid-tier national tours.",
    website: "www.prismpalacela.com"
  },
  {
    id: "copper-kettle",
    name: "The Copper Kettle Hall",
    capacity: 180,
    address: "310 S Michigan Ave, Chicago, IL 60604",
    city: "Chicago",
    genres: ["Blues", "Jazz", "Soul", "Funk"],
    contactEmail: "booking@copperkettlechicago.com",
    contactPhone: "(312) 555-7311",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 180 guests] Cozy basement lounge famous for legendary Chicago blues jams and tight soul outfits. Features an upright acoustic piano and house Hammond B3 organ.",
    website: "www.copperkettlechicago.com"
  },
  {
    id: "neon-mirage",
    name: "The Neon Mirage",
    capacity: 320,
    address: "720 E Fremont St, Las Vegas, NV 89101",
    city: "Las Vegas",
    genres: ["Synthwave", "Electronic", "Indie Pop", "Glam Rock"],
    contactEmail: "live@neonmiragelv.com",
    contactPhone: "(702) 555-9012",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 320 guests] Retro-futuristic showroom with immersive LED perimeter walls and custom neon art installations in Downtown Las Vegas.",
    website: "www.neonmiragelv.com"
  },
  {
    id: "ironwood-lodge",
    name: "Ironwood Music Hall",
    capacity: 600,
    address: "1400 Nicollet Mall, Minneapolis, MN 55403",
    city: "Minneapolis",
    genres: ["Americana", "Indie Rock", "Folk", "Post-Rock"],
    contactEmail: "talent@ironwoodmpls.com",
    contactPhone: "(612) 555-3419",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 600 guests] Heavy timber framing, warm acoustics, and a generous stage depth with dedicated green rooms and side-stage load-in ramp.",
    website: "www.ironwoodmpls.com"
  },
  {
    id: "coastal-grove",
    name: "The Coastal Grove Amphitheater",
    capacity: 1200,
    address: "500 Ocean Way, San Diego, CA 92109",
    city: "San Diego",
    genres: ["Reggae", "Surf Rock", "Indie Pop", "Jam Band"],
    contactEmail: "events@coastalgrovesd.com",
    contactPhone: "(619) 555-6670",
    hasPA: true,
    hasLighting: true,
    description: "[Capacity: 1200 guests] Outdoor open-air amphitheater with ocean breezes, towering palm trees, festival-grade line-array sound, and expansive merchandise concourse.",
    website: "www.coastalgrovesd.com"
  }
];

export const MUSIC_VENUES: Venue[] = [
  ...WASHINGTON_VENUES,
  ...OREGON_VENUES,
  ...NATIONAL_BASE_VENUES
];
`;

fs.writeFileSync(venuesFilePath, venuesHeader, 'utf-8');
console.log(`Updated src/data/venues.ts with ${allWAVenues.length + allORVenues.length + 10} total venues!`);
