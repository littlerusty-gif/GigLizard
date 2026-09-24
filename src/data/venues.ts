import { Venue } from "../types";
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
