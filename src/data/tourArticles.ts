export interface ArticleSection {
  id: string;
  heading: string;
  content: string[];
  proTip?: string;
  bulletList?: string[];
}

export interface ArticleFaq {
  q: string;
  a: string;
}

export interface TourArticle {
  id: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  category: "Routing & Logistics" | "Venue Booking" | "Live Sound & Tech" | "Tour Finances" | "Promotion & Merch" | "Studio & Recording";
  author: {
    name: string;
    role: string;
    bio: string;
  };
  publishDate: string;
  updatedDate: string;
  readTimeMinutes: number;
  excerpt: string;
  keyTakeaways: string[];
  relatedTool: {
    name: string;
    url: string;
    label: string;
    tab: "tour" | "plot" | "rider" | "poster" | "venues" | "bands" | "pricing";
  };
  sections: ArticleSection[];
  faq: ArticleFaq[];
}

import { EXTRA_TOUR_ARTICLES } from "./extraTourArticles";

const BASE_TOUR_ARTICLES: TourArticle[] = [
  {
    id: "art-1",
    slug: "route-diy-tour-without-bleeding-gas-money",
    title: "The 4-Hour Rule: How to Route a DIY Band Tour Without Bleeding Gas Money",
    seoTitle: "The 4-Hour Rule: How to Route a Profitable DIY Band Tour | GigLizard",
    metaDescription: "Master DIY band tour routing: learn the 4-hour highway corridor rule, calculate loaded van fuel budgets at 10-12 MPG, and eliminate costly zig-zag backtrack miles.",
    keywords: ["diy band tour routing", "band van gas calculator", "tour routing corridors", "independent tour planner", "band tour budget"],
    category: "Routing & Logistics",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-12",
    updatedDate: "2026-11-01",
    readTimeMinutes: 8,
    excerpt: "The number one reason independent bands return home broke isn't low guarantees—it's disastrous routing. Learn how anchor dates, highway corridors, and the 4-hour driving cap keep your band sane and profitable.",
    keyTakeaways: [
      "Never book a tour from east-to-west or north-to-south in random zigzag jumps. Lock 2 to 3 anchor dates first, then fill corridor gaps.",
      "Cap driving time at 240 miles (about 4 hours) between weeknight gigs to preserve vocal stamina and prevent highway breakdown fatigue.",
      "A loaded 15-passenger van towing a 5x8 trailer averages 10.5 MPG. Budget fuel at $3.85/gallon baseline plus a 20% elevation/idle buffer.",
      "Use interstate hubs (I-5, I-95, I-80, I-40) rather than cutting diagonally through two-lane county highways at night."
    ],
    relatedTool: {
      name: "Smart Tour Route Planner",
      url: "/tour",
      label: "Map Driving Runs & Calculate Gas with our Free Tour Planner",
      tab: "tour"
    },
    sections: [
      {
        id: "anchor-dates",
        heading: "1. How do you plan a DIY tour route around high-paying anchor dates?",
        content: [
          "Most first-time touring bands make the fatal mistake of emailing 50 random clubs across eight states simultaneously. When three clubs in opposite corners reply with dates, the band attempts to bridge the gap with 600-mile overnight hauls.",
          "Professional tour booking works backward from 'Anchor Dates.' An anchor date is a high-confidence show with a guaranteed payout or a verified crowd draw—often a weekend festival slot, a hometown co-bill, or a high-paying Saturday night club in a regional center like Seattle, Chicago, or Austin.",
          "Once your Friday and Saturday anchors are locked down, your sole mission is stringing together Monday through Thursday corridor dates that fall directly on the highway line connecting them. Even if a Tuesday date pays a modest $150 door guarantee, taking it along your direct drive path beats driving empty miles for zero revenue."
        ],
        proTip: "If you cannot secure a Tuesday club date between two anchors, book a house show, a college radio in-studio performance, or a record store acoustic set rather than burning hotel money on a dark night."
      },
      {
        id: "four-hour-rule",
        heading: "2. How far can a touring band drive between shows without burning out?",
        content: [
          "On paper, driving six hours between Seattle and Spokane or Austin and Dallas looks manageable. In a fully loaded Ford E-350 with four bandmates, luggage, and a drum kit, six hours on Google Maps translates to eight real-world hours.",
          "Factoring in morning load-out from the hotel, gas station bio-breaks, traffic chokepoints, and a 4:30 PM load-in, drives longer than 240 miles force bands into frantic highway rushes. Soundchecks get skipped, vocal cords tire from exhaustion, and driver vigilance plummets.",
          "Adopting a rigid 4-hour driving ceiling preserves the physical and mental health of the group. It leaves a cushion for flat tires, permits a sit-down meal, and ensures you arrive at the venue with the energy to deliver a headline-caliber set."
        ]
      },
      {
        id: "fuel-math",
        heading: "3. How do you calculate van fuel costs before booking a tour?",
        content: [
          "Window stickers on cargo vans claim 14–16 MPG. That estimate is completely detached from the reality of a musical tour. Once you add four adults, two 4x12 guitar cabinets, an 8x10 bass rig, drum hardware bags, and a merch bin, your vehicle weight approaches 8,500 lbs.",
          "Calculate your fuel consumption based on 10.5 MPG for standard passenger vans and 9.0 MPG if towing an enclosed trailer. At $3.80 per gallon, a 2,500-mile two-week run consumes roughly 240 gallons of gas—or $912 in fuel expenses alone.",
          "Always add a mandatory 20% fuel contingency buffer to your route spreadsheet. Mountain passes (like Snoqualmie, the Rockies, or the Grapevine), stop-and-go metro gridlock, and running the vehicle heater or AC while waiting for club doors eat extra fuel."
        ],
        bulletList: [
          "Base Calculation: Total Route Miles ÷ 10.5 MPG = Base Gallons Required",
          "Expense Formula: Base Gallons × Regional Average Gas Price = Base Fuel Cost",
          "Safety Cushion: Base Fuel Cost × 1.20 = Final Projected Tour Gas Budget"
        ]
      },
      {
        id: "corridors",
        heading: "4. What are the best North American highway corridors for DIY touring?",
        content: [
          "North America features well-established touring corridors with dense live music markets separated by 2 to 4 hours of highway. Stick to these established arteries until your national fan base warrants cross-country desert runs:",
          "• Pacific Northwest (I-5 Corridor): Vancouver BC → Bellingham → Seattle → Tacoma → Olympia → Portland → Eugene. Short 1 to 3 hour drives with vibrant indie, punk, and rock scenes.",
          "• Midwest Belt (I-94 / I-80): Minneapolis → Madison → Milwaukee → Chicago → Grand Rapids → Detroit → Cleveland.",
          "• Texas Triangle (I-35 / I-45 / I-10): Dallas/Fort Worth → Denton → Austin → San Antonio → Houston.",
          "• Mid-Atlantic & Northeast (I-95): Richmond → Washington DC → Baltimore → Philadelphia → New York City → New Haven → Boston."
        ]
      }
    ],
    faq: [
      {
        q: "What is an acceptable nightly gas expense per band member?",
        a: "Aim for fuel costs to represent less than 25% of your nightly gross earnings. If a show pays a $300 guarantee, your fuel expense to reach that show should not exceed $75."
      },
      {
        q: "Should we rent a van or tour in our personal vehicle?",
        a: "For tours under 10 days, a well-maintained personal SUV or minivan with roof cargo is significantly cheaper than commercial rental fleets ($120/day + mileage charges). For tours over two weeks or across mountain ranges, a commercially rented van provides 24/7 roadside replacement guarantees that prevent canceled tours."
      }
    ]
  },
  {
    id: "art-2",
    slug: "how-to-cold-email-venue-talent-buyers",
    title: "Cold-Emailing Venue Talent Buyers: The 3-Sentence Pitch That Actually Lands Gigs",
    seoTitle: "How to Pitch Venue Talent Buyers & Book Live Gigs | GigLizard",
    metaDescription: "Stop sending 6-paragraph bios that bookers delete. Learn the exact 3-sentence email pitch, high-converting subject line formula, and follow-up rhythm that lands club dates.",
    keywords: ["how to email talent buyers", "band booking email template", "pitching music venues", "cold email venue bookers", "indie band gig booking"],
    category: "Venue Booking",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-15",
    updatedDate: "2026-11-02",
    readTimeMinutes: 7,
    excerpt: "Venue talent buyers receive between 80 and 200 booking pitches every morning. If your pitch requires scrolling, includes large file attachments, or hides your music, it goes straight to the trash. Here is what actually works.",
    keyTakeaways: [
      "Subject line formula: [Artist Name] ([Genre] / [Key Draw Reference]) Seeking [Day of Week / Exact Date Range].",
      "Keep the email body under 120 words. No life stories, no multi-paragraph origin bios, and zero MP3 or PDF email attachments.",
      "Lead with your strongest live performance video link (YouTube or Vimeo) right in the second sentence. Bookers judge live energy, not studio sheen.",
      "Always suggest a specific pairing: mention 1 or 2 local bands in their market that fit your sonic profile and will pull local patrons."
    ],
    relatedTool: {
      name: "650+ Live Music Venue Directory",
      url: "/venues",
      label: "Find Verified Talent Buyer Inboxes in Our 650+ Free Venue Directory",
      tab: "venues"
    },
    sections: [
      {
        id: "booker-mindset",
        heading: "1. How do venue talent buyers triage cold booking emails?",
        content: [
          "Talent buyers at 150-to-500-capacity clubs do not sit around searching the internet for new undiscovered artists. They spend their mornings fielding artist cancellations, arguing with distributors over sound tech invoices, and skimming a wall of unread emails.",
          "A booker has three questions when scanning a cold pitch: (1) Does this act sound professional? (2) Will they bring people or fit an existing bill? (3) Will they be easy to work with on show night?",
          "If your email opens with: 'We are a four-piece formed in a garage in the summer of 2021 when our guitarist met our bassist at a coffee shop,' the booker has already hit archive. Professional bookers respect brevity and clarity above all else."
        ]
      },
      {
        id: "subject-lines",
        heading: "2. What email subject line gets opened by venue bookers?",
        content: [
          "Your subject line must contain the date, the artist name, and a recognizable sonic or geographic anchor. Avoid vague subject lines like 'Booking inquiry' or 'Hey check out our music.'",
          "• Formula: [Band Name] ([Hometown] [Genre] • FFO [2 Known Artists]) - Tour Hold for [Date Range]",
          "• Example: Dr Hadit (Seattle Alt-Rock • FFO Queens of the Stone Age / Spoon) - Show Hold for Thursday Oct 15",
          "When the booker sees this in their inbox, they immediately know the date you want, whether your genre matches their room, and the sonic aesthetic you deliver."
        ],
        proTip: "Never send booking inquiries from personal iCloud or Hotmail addresses. Use your official band domain or a clean Gmail handle (e.g., booking@yourband.com or yourbandbooking@gmail.com)."
      },
      {
        id: "three-sentence-template",
        heading: "3. What is the optimal pitch format for pitching a venue?",
        content: [
          "Copy and adapt this exact format. It respects the booker's time while providing every necessary data point in 10 seconds of reading:",
          "Hi [Buyer Name],",
          "Sentence 1 (Who & When): We are [Band Name], an energetic [Genre] act from [City], routing our fall tour through [Target City] and looking to jump on a bill or support a local act on [Target Date / Day of Week].",
          "Sentence 2 (Proof of Live Sound): You can watch our 3-minute live performance video from [Notable Venue / Festival] here: [Direct YouTube Link] and stream our latest single here: [Spotify/Bandcamp Link].",
          "Sentence 3 (Local Draw / Co-Bill Plan): In our home market we draw [Number] paying heads, and for this show we are already in talks with local support acts [Local Band A] and [Local Band B] to build a cohesive, packed 3-band bill.",
          "Our stage plot and tech rider are ready for your production staff at [Link]. Thanks for your time and keeping live independent music alive!",
          "Best,",
          "[Your Name & Phone Number] | [Band Website]"
        ]
      },
      {
        id: "follow-up-cadence",
        heading: "4. How often should a band follow up on an unanswered booking inquiry?",
        content: [
          "Bookers miss great emails simply because an invoice was due or a soundboard broke that afternoon. A polite, structured follow-up is not annoying; it is expected.",
          "Wait exactly 7 to 10 business days before sending a single-line reply to your original thread: 'Hey [Buyer Name], just bumping this to the top of your inbox as we finalize our route through [City] for [Date]. Happy to provide any additional details if needed!'",
          "If you receive no reply after the second follow-up, accept the silence gracefully and pursue your secondary or tertiary room in that market. Burning bridges with aggressive messages will blacklist your act across regional promoter networks."
        ]
      }
    ],
    faq: [
      {
        q: "How far in advance should independent bands book club tours?",
        a: "For 100-to-300-capacity venues, 3 to 5 months in advance is the sweet spot. Less than 8 weeks out and calendars are usually full; more than 6 months out and indie club buyers often haven't opened their calendars for support acts."
      },
      {
        q: "Should I attach our MP3s and high-res press photos to the email?",
        a: "Never attach raw audio files, ZIP folders, or 20MB image files. Many club servers automatically route large attachments to the spam folder. Use clean streaming hyperlinks (YouTube, Spotify, Bandcamp, Dropbox)."
      }
    ]
  },
  {
    id: "art-3",
    slug: "anatomy-of-a-flawless-stage-plot-input-list",
    title: "The Anatomy of a Flawless Stage Plot & Input List: What Sound Engineers Need to See",
    seoTitle: "The Anatomy of a Pro Stage Plot & Soundboard Input List | GigLizard",
    metaDescription: "Learn what front-of-house sound engineers look for on your stage plot: physical layout, wedge mix counts, power drop locations, and 24-channel input patch matrices.",
    keywords: ["band stage plot template", "soundboard input patch list", "what is a stage plot", "audio tech rider requirements", "foh sound engineer specs"],
    category: "Live Sound & Tech",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-18",
    updatedDate: "2026-11-03",
    readTimeMinutes: 9,
    excerpt: "House sound engineers can spot a disaster band the second they open an unprofessional stage plot. Discover how clear monitor mix designations, AC drop markers, and concise channel patch lists get your band the best mix in the house.",
    keyTakeaways: [
      "Orient your stage plot from the audience perspective ('Downstage / To Crowd' at the bottom of the diagram).",
      "Sync written monitor specifications dynamically with the physical wedges drawn on stage (e.g. 4 wedges on stage = exactly 4 monitor sends listed).",
      "Always mark AC electrical drops (120V quad-boxes) for pedalboards, guitar amp heads, synthesizers, and drum risers.",
      "Pair your visual illustration with a numbered input patch list detailing channel number, instrument, preferred mic/DI, and boom stand requirements."
    ],
    relatedTool: {
      name: "Interactive Stage Plot Designer",
      url: "/plot",
      label: "Build a Print-Ready Stage Plot & Patch List with our Free Designer",
      tab: "plot"
    },
    sections: [
      {
        id: "visual-hierarchy",
        heading: "1. What orientation and layout should you use on a professional stage plot?",
        content: [
          "Your stage plot is an architectural blueprint for the stage crew. When a venue sound technician walks into the venue at 2:00 PM to patch the snake, your diagram determines where they place sub-snakes, direct input boxes, and power drops.",
          "Always orient the stage plot with the front edge (Downstage) facing the audience at the bottom of the page, labeled 'FRONT OF STAGE / TO CROWD'. Upstage (drums, backline amps, risers) sits at the top.",
          "Keep gear graphics clean, uncluttered, and scaled proportionally. Avoid 3D clip art or cartoon caricatures that obscure labels. Every instrument must clearly show the performer's name and primary role (e.g., 'Guitar / Lead Vocal - Dave')."
        ],
        proTip: "Never design a stage plot with dark black backgrounds for printout. House engineers frequently print plots on black-and-white laser printers; high-contrast black line-work on a crisp white page is the industry standard."
      },
      {
        id: "monitor-wedge-accuracy",
        heading: "2. How should floor monitor wedges and mix sends be mapped on a stage plot?",
        content: [
          "One of the most frequent friction points between touring bands and house engineers is conflicting monitor wedge documentation.",
          "If your visual stage plot shows four monitor wedges, but your written specifications say 'Requires 6 units with 6 independent mix sends,' the engineer doesn't know whether to patch 4 lines or 6 lines from the console.",
          "Clearly label each physical wedge with its assigned auxiliary send (e.g., 'OUT 1 - Lead Vocal', 'OUT 2 - Bass', 'OUT 3 - Guitar', 'OUT 4 - Drum Wedge'). If your drummer uses wired in-ear monitors (IEMs), label the position 'WIRED IEM (XLR DROP)' rather than placing an unnecessary stage wedge."
        ]
      },
      {
        id: "input-patch-matrix",
        heading: "3. The 16-to-24 Channel Input Patch List",
        content: [
          "A visual stage plot without a corresponding input patch list is only half a tech rider. Your input list specifies the standard channel sequence from kick drum to vocal channels.",
          "Standard input list ordering follows live audio conventions: (1) Drums & Percussion, (2) Bass, (3) Guitars & Keyboards, (4) Acoustic / Specialty Instruments, (5) Vocals left-to-right from stage perspective.",
          "For each channel, provide four critical columns: Channel Number, Instrument Description, Preferred Transducer / Mic Type (e.g. Shure B52, Sennheiser e609, Active DI), and Mic Stand Height (Tall Boom, Short Boom, Straight Round Base)."
        ],
        bulletList: [
          "Ch 1: Kick (Shure Beta 52 / Audix D6) - Short Boom",
          "Ch 2: Snare Top (Shure SM57) - Short Boom / Claw",
          "Ch 3: Hi-Hat (Shure SM81 / Condenser) - Short Boom (+48V)",
          "Ch 4: Rack Tom (Sennheiser e604) - Clip-on",
          "Ch 5: Floor Tom (Sennheiser e604) - Clip-on",
          "Ch 6: Overhead Left (Rode NT5 / Shure KSM137) - Tall Boom (+48V)",
          "Ch 7: Overhead Right (Rode NT5 / Shure KSM137) - Tall Boom (+48V)",
          "Ch 8: Bass (Active DI Box / XLR) - Stage Left Drop (+48V)",
          "Ch 9: Electric Guitar (Shure SM57 / Sennheiser e609) - Short Boom",
          "Ch 10: Lead Vocal Center (Shure Beta 58A) - Tall Boom Stand"
        ]
      },
      {
        id: "power-and-contacts",
        heading: "4. Power Drops & Technical Contact Information",
        content: [
          "Modern bands travel with extensive pedalboard power supplies, digital modelers (Helix, Kemper, Quad Cortex), and laptop synths. Detail every AC electrical drop required on stage with bold lightning bolt icons or '120V AC DROP' text.",
          "Finally, include direct contact information in the footer: Production Manager / Band Contact Name, Cell Phone Number, and Email. If the house engineer encounters a stage size conflict before show day, having an immediate phone number prevents last-minute surprises."
        ]
      }
    ],
    faq: [
      {
        q: "What is the difference between Stage Left (SL) and House Left (HL)?",
        a: "Stage Left is the performer's left when looking out toward the audience. House Left is the audience's left when looking at the stage. Professional stage plots always use Stage Left and Stage Right terminology."
      },
      {
        q: "Should I include phantom power (+48V) requirements on my input list?",
        a: "Yes. Always flag channels requiring +48V phantom power (such as condenser overheads, active acoustic DI boxes, or wireless microphone receivers). This allows the sound engineer to engage phantom power before unmuting channels."
      }
    ]
  },
  {
    id: "art-4",
    slug: "co-billing-show-swapping-secret-to-drawing-crowds",
    title: "Co-Billing & Show Swapping: The Secret to Drawing 100+ Paying Fans in New Markets",
    seoTitle: "Co-Billing & Show Swapping: How DIY Bands Draw on Tour | GigLizard",
    metaDescription: "Learn how show swapping and strategic co-bills help touring bands pack 150-cap rooms in unfamiliar cities without spending thousands on social ads.",
    keywords: ["band show swapping", "co-billing indie bands", "how to get local tour support", "diy band networking", "tour show swaps"],
    category: "Venue Booking",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-21",
    updatedDate: "2026-11-02",
    readTimeMinutes: 8,
    excerpt: "You can drive 800 miles and play to three bartenders, or you can team up with a respected local act who pulls 80 people on a Wednesday. Show swapping is the single most cost-effective audience development strategy in live music.",
    keyTakeaways: [
      "A show swap is an agreement between two acts from different markets: Band A hosts Band B in City 1, and Band B hosts Band A in City 2 within 6 months.",
      "Target acts that share your sonic demographic and audience age bracket, but avoid acts with identical instrumentation to keep the bill dynamic.",
      "Agree on financial terms in writing beforehand: equal door splits, shared backline, and reciprocal hospitality expectations.",
      "Treat their home market crowd with intense respect. Use the stage time to win lifelong fans, not to lecture the audience."
    ],
    relatedTool: {
      name: "1,650+ Touring Band Directory",
      url: "/bands",
      label: "Find Co-Bill Partners in 50+ Cities in our Band Directory",
      tab: "bands"
    },
    sections: [
      {
        id: "the-cold-market-trap",
        heading: "1. How do you avoid playing empty rooms in new touring markets?",
        content: [
          "Every touring musician knows the soul-crushing experience of playing an out-of-town gig to a room consisting solely of the sound engineer, the door person, and two friends from college who left after three songs.",
          "Instagram ads and organic Spotify algorithmic plays do not convert into bodies through a club door in a city 600 miles away. Live music attendance in sub-300-capacity venues is inherently tribal and community-driven.",
          "Partnering with an active local band instantly bridges the trust gap. Their loyal local followers show up for their set, witness your electrifying performance, and buy your t-shirts at the merch booth."
        ]
      },
      {
        id: "how-to-propose-swap",
        heading: "2. How do you pitch a reciprocal show swap to an out-of-town band?",
        content: [
          "Do not cold-message bands asking: 'Hey, can you put us on your show?' That sounds like a request for a free handout.",
          "Instead, offer value first: 'Hey [Band Name], we love your new EP. We have a confirmed Saturday night slot at [Respected Club] in Seattle on [Date] where we draw 120+ heads. We want to offer you direct support with a guaranteed payout and hospitality. In exchange, we'd love to swap dates and support you at your favorite room in Portland later this fall.'",
          "Offering confirmed value up front makes the proposition irresistible. Bands understand reciprocal equity and will work aggressively to ensure your reciprocal date is equally successful."
        ],
        proTip: "Search our 1,650+ Band Directory filtered by genre and city. Look for acts marked 'Regional Touring' or 'National Act' that tour the same geographic corridor as your band."
      },
      {
        id: "backline-sharing",
        heading: "3. What is standard backline sharing etiquette for co-bill shows?",
        content: [
          "The biggest logistical advantage of co-billing is backline sharing. Instead of four bands loading four full drum kits, four bass amplifiers, and eight guitar cabinets onto a small 18-foot stage, the acts share a unified backline.",
          "Standard etiquette: The direct support or headlining act provides the drum shells, hardware stands, and bass cabinet. Traveling bands bring their own snare drum, cymbals, bass kick pedal, guitar amp heads, and pedalboards.",
          "Agree on backline specifics two weeks before the date. Always thank the gear-providing band by buying them a round of drinks or tipping their drummer for shell wear-and-tear."
        ]
      },
      {
        id: "reciprocal-fairness",
        heading: "4. Financial Settlement on Swapped Bills",
        content: [
          "On co-billed dates, door money should be split transparently. If total ticket sales net $600 after the venue production fee, dividing it equally between the traveling and local acts ($300 / $300) cements an enduring partnership.",
          "Never attempt to shortchange a visiting act with a $40 gas stipend while keeping $500 for your local band. Word travels fast in DIY touring communities, and an unfair settlement will permanently close doors in that region."
        ]
      }
    ],
    faq: [
      {
        q: "What if the other band fails to deliver on their end of the swap?",
        a: "Set a clear 6-to-9 month window for the reciprocal show. If an act flakes or breaks up before fulfilling the swap, document it and move on. Over a 10-tour career, the 85% of acts who fulfill swaps will form the backbone of your touring network."
      },
      {
        q: "How many bands should be on a club co-bill?",
        a: "Three bands is the golden standard. Two bands can struggle to generate early room energy; four bands leads to 25-minute truncated sets and frantic 10-minute changeovers. Three bands playing 40-to-45-minute sets creates a relaxed, professional evening."
      }
    ]
  },
  {
    id: "art-5",
    slug: "band-van-survival-packing-and-anti-theft-strategy",
    title: "Band Van Survival Guide: Maintenance, Packing & Anti-Theft Strategy",
    seoTitle: "Band Van Security, Maintenance & Packing Guide | GigLizard",
    metaDescription: "Protect your gear on tour: learn puck lock van defense, hotel parking protocols, the master load-out pack order, and emergency breakdown kits.",
    keywords: ["band van security", "tour van packing guide", "prevent gear theft on tour", "band vehicle maintenance", "diy touring checklist"],
    category: "Routing & Logistics",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-24",
    updatedDate: "2026-11-01",
    readTimeMinutes: 9,
    excerpt: "Nothing ends a tour faster than walking out of a budget motel to find your van emptied of guitars or towed with a seized transmission. Implement these non-negotiable security protocols before leaving home.",
    keyTakeaways: [
      "Never leave guitars, vintage tube heads, cymbals, or laptop audio interfaces in the van overnight—regardless of hotel neighborhood.",
      "Install hardened steel puck locks (Master Lock or War-Lok) on van cargo doors; factory latch locks can be defeated with a flathead screwdriver in 8 seconds.",
      "Back your van cargo doors tightly against a brick wall or concrete barrier when parking at hotels to physically block door entry.",
      "Follow the 'First-In, Last-Out' pack order: heavy speaker cabinets and road cases against the front bulkhead, drum bags and gig bags in the center."
    ],
    relatedTool: {
      name: "Van Gas Cost Calculator",
      url: "/tour",
      label: "Calculate Exact Highway Gas Budgets with our Free Tour Tool",
      tab: "tour"
    },
    sections: [
      {
        id: "overnight-security",
        heading: "1. The Iron Rule of Hotel Parking & Gear Security",
        content: [
          "Gear theft hot spots in North America are well known: metro corridors in San Francisco/Oakland, Atlanta, Albuquerque, Chicago, and Memphis report dozens of band van break-ins every year.",
          "Rule Number One: The 'High Value Carry-In'. Guitars, bass guitars, snare drums, pedalboards, cymbals, laptops, and merch cash boxes MUST be loaded into your motel room every single night without exception. Yes, carrying six guitar cases up motel stairs at 2:00 AM is exhausting. It is infinitely less exhausting than canceling three weeks of shows because your vintage instruments vanished.",
          "When parking at motels, back the rear doors of the van within 3 inches of an exterior brick wall, dumpster, or concrete light pole. If thieves cannot swing the cargo doors open, they cannot roll out your 4x12 cabinets or bass rigs."
        ],
        proTip: "Hide two Apple AirTags or Android SmartTags inside hollow speaker cabinets or internal amplifier head cavities. If the vehicle is ever broken into, law enforcement can track the equipment in real time."
      },
      {
        id: "hardware-locks",
        heading: "2. Physical Door Defenses & Window Tinting",
        content: [
          "Factory locks on Ford E-Series, Chevy Express, and Mercedes Sprinter vans can be defeated in seconds by punching the door handle cylinder or prying the rear window seal.",
          "Install hockey-puck style hasp locks (such as Master Lock 770 or Slick Locks) on side and rear cargo doors. These steel shields enclose the shackle completely, rendering bolt cutters useless.",
          "Apply 5% dark limo tint or blackout reflectix panels to all rear passenger windows. If opportunistic thieves cannot see what is inside the vehicle from the parking lot, they move on to easier targets."
        ]
      },
      {
        id: "load-out-order",
        heading: "3. The Master Load-Out Pack Order (Tetris Discipline)",
        content: [
          "Every loaded vehicle needs a permanent, documented pack layout. When every member knows exactly where their piece of gear belongs, load-out takes 20 minutes instead of 60 minutes of chaotic parking lot shifting.",
          "• Layer 1 (Base & Front Bulkhead): Heaviest items go low and as far forward toward the axle as possible. 4x12 guitar cabinets, 8x10 bass cabs, heavy road trunks, and PA subwoofers.",
          "• Layer 2 (Middle Tier): Drum hardware flight cases, combo amplifiers, and drum shell hard cases.",
          "• Layer 3 (Top / Soft Tier): Merch boxes, drum cymbal bags, acoustic guitar cases, and band luggage.",
          "• Strapping: Use heavy-duty ratcheting cargo straps across the interior tie-downs. An unsecured 80-pound amplifier can become a lethal projectile during emergency highway braking."
        ]
      },
      {
        id: "preventive-maintenance",
        heading: "4. The Pre-Tour Van Maintenance Checklist",
        content: [
          "Do not start a 3,000-mile tour hoping your tires will hold up. Conduct these inspections two weeks before departure:",
          "• Brake Pads & Rotors: Heavy van loads shred worn brake pads on downhill mountain grades.",
          "• Tire Tread & Load Rating: Touring vans require 10-ply 'Load Range E' commercial tires inflated to 65–80 PSI. Standard passenger car tires will suffer sidewall blowouts under touring weights.",
          "• Transmission Fluid & Radiator Flush: Towing trailers uphill in hot weather stresses transmissions. Fresh synthetic fluid prevents catastrophic highway overheats."
        ]
      }
    ],
    faq: [
      {
        q: "What should be in a band's emergency roadside breakdown kit?",
        a: "Full-size matching spare tire (not a donut), 3-ton hydraulic floor jack, 4-way cross wrench, heavy jumper cables, 12V portable tire inflator, roadside reflective triangles, 2 quarts of engine oil, and an active AAA Premier membership (which includes 200 miles of free towing)."
      },
      {
        q: "Should our band purchase dedicated musical equipment insurance?",
        a: "Yes. Homeowner's or renter's insurance explicitly excludes gear used for commercial income or gear stolen from an unattended vehicle. Companies like MusicPro or Front Row Insurance offer comprehensive gear riders ($250-$400/year) covering van theft, stage spills, and transit damage anywhere in North America."
      }
    ]
  },
  {
    id: "art-6",
    slug: "tech-riders-vs-stage-plots-soundcheck-disasters",
    title: "Tech Riders vs Stage Plots: The Difference That Prevents Soundcheck Disasters",
    seoTitle: "Tech Riders vs Stage Plots: Complete Guide for Bands | GigLizard",
    metaDescription: "Understand the key differences between a visual stage plot and an audio tech rider. Learn channel patch sequencing, monitor mix auxiliary sends, and backline power specs.",
    keywords: ["tech rider vs stage plot", "band technical rider", "live sound soundcheck tips", "audio input list", "how to soundcheck"],
    category: "Live Sound & Tech",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-26",
    updatedDate: "2026-11-03",
    readTimeMinutes: 8,
    excerpt: "Conflating a stage plot with a tech rider is the quickest way to create confusion at the soundboard. Learn how pairing a spatial diagram with an exact channel patch matrix ensures your soundcheck takes 15 minutes instead of 45.",
    keyTakeaways: [
      "A Stage Plot is a spatial map showing where musicians stand, where amplifiers sit, and where microphones and AC power drops belong.",
      "A Tech Rider is an engineering document detailing audio channel assignments, mic model preferences, +48V phantom power, and front-of-house PA requirements.",
      "Always include hospitality, parking, and load-in specifications within the tech rider document.",
      "Send your combined Stage Plot and Tech Rider to the venue sound tech 10 to 14 days prior to show night to allow sub-snake pre-patching."
    ],
    relatedTool: {
      name: "Tech Rider & Patch List Builder",
      url: "/rider",
      label: "Build an Industry-Standard Audio Tech Rider for Free",
      tab: "rider"
    },
    sections: [
      {
        id: "distinct-purposes",
        heading: "1. Two Documents with Two Distinct Functions",
        content: [
          "Touring acts often ask: 'Can't I just put my input list on the same drawing as my stage plot?' While a combined single-page overview is useful for quick reference, understanding the distinct operational roles of each document is critical.",
          "The Stage Plot is used by the stage manager, backline technicians, and hands who physically set up the room. They need to know: Does the drum kit need a 8x8 riser? Where are the 120V AC power quad-boxes? Where do the vocal boom stands go?",
          "The Tech Rider is used by the Front-of-House (FOH) and Monitor sound engineers at the mixing console. They need to know: How many channels does this band take on the digital snake? Which channels need phantom power? What are the monitor mix groupings?"
        ]
      },
      {
        id: "channel-patch-standards",
        heading: "2. The 24-Channel Industry Patch Standard",
        content: [
          "Professional sound engineers memorize standard console patch orders. When an amateur band submits an input list starting with Lead Vocal on Channel 1 and Kick Drum on Channel 14, the engineer has to mentally translate their console layout.",
          "Always adhere to conventional soundboard sequencing: Drums → Percussion → Bass → Rhythm Instruments → Guitars → Keyboards → Horns/Strings → Vocals.",
          "Specify the exact preferred microphone model, whether your instrument uses a direct box (Active DI vs Passive DI), and whether the channel requires +48V phantom power from the console preamp."
        ],
        proTip: "If your bass player uses an active bass or preamp pedal (like a Darkglass or SansAmp), note 'XLR Output Provided from Bass Rig' so the sound tech doesn't waste time running an extra stage DI box."
      },
      {
        id: "soundcheck-protocol",
        heading: "3. The 15-Minute Professional Line Check Protocol",
        content: [
          "At club shows with three or four bands, full 45-minute soundchecks are rare. You will almost certainly be conducting a 15-minute 'line check' right before your set.",
          "Line Check Discipline: (1) Do not noodle on your guitar while the engineer is checking drum mics. (2) When the engineer calls for 'Kick Drum,' hit the kick drum with consistent show volume until they say stop. (3) When asked for vocals, sing at full performance intensity—do not mumble into the microphone.",
          "Communicate monitor mix adjustments with clear hand signals and specific terminology: 'Can I get more Lead Vocal in Wedge 1?' is actionable. 'Everything sounds muddy' is useless to an engineer working under a 10-minute clock."
        ]
      },
      {
        id: "hospitality-riders",
        heading: "4. Practical Hospitality Riders for Independent Clubs",
        content: [
          "Unless your band sells out 1,000-seat theaters, keep your hospitality rider grounded in reality. Requesting vintage champagne or specific color-coded M&Ms will get your tech rider laughed at by club owners.",
          "Professional indie hospitality requests: (1) Clean drinking water or refillable gallon jugs backstage. (2) Hot meal buyout ($15 to $20 per band member) or hot meals from the venue kitchen. (3) 12 to 24 cold craft beers or sparkling waters. (4) Clean backstage restroom access.",
          "Keep it respectful, polite, and reasonable. Venues remember considerate acts and welcome them back with open arms."
        ]
      }
    ],
    faq: [
      {
        q: "What does FOH stand for?",
        a: "FOH stands for 'Front of House'—both the sound mixing console located in the audience area and the engineer responsible for balancing the audio mix that the audience hears."
      },
      {
        q: "Should our band carry our own vocal microphones on tour?",
        a: "Yes. Carrying your own vocal mics (such as Shure Beta 58A, sE V7, or Sennheiser e935) guarantees sanitary hygiene, eliminates feedback surprises from mismatched capsule patterns, and provides consistent frequency response in every venue."
      }
    ]
  },
  {
    id: "art-7",
    slug: "merch-table-economics-maximizing-per-head-sales",
    title: "Merch Table Economics: Maximizing Per-Head Sales on the Road",
    seoTitle: "Band Merch Economics: How to Maximize Road Sales | GigLizard",
    metaDescription: "Master band merch economics: calculate per-head sales metrics, size curve distribution (M/L/XL), mobile point-of-sale setups, and display lighting psychology.",
    keywords: ["band merch economics", "how to sell more merch on tour", "band t-shirt size breakdown", "band merch table setup", "tour merch pricing"],
    category: "Tour Finances",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-28",
    updatedDate: "2026-11-02",
    readTimeMinutes: 8,
    excerpt: "On independent tours, your merchandise table frequently out-earns your stage guarantees. Discover how strategic pricing, lighting display psychology, and seamless digital payments double your per-head merch revenue.",
    keyTakeaways: [
      "Per-Head Average (Total Merch Gross ÷ Total Show Attendance) is your true touring metric. Target $4.00 to $8.00 per head in independent clubs.",
      "The Golden Size Breakdown for 100 t-shirts: Small: 10, Medium: 25, Large: 35, XL: 20, 2XL: 10.",
      "Light your merchandise display with portable battery-operated LED clip lights. Dark merch tables in dingy club corners lose 40% of impulse sales.",
      "Accept every payment method: Cash, Venmo QR code, Cash App, Apple Pay, and Square credit card swipe with offline payment processing enabled."
    ],
    relatedTool: {
      name: "Concert Poster Designer",
      url: "/poster",
      label: "Design High-Impact Merch Flyers with our Poster Studio",
      tab: "poster"
    },
    sections: [
      {
        id: "per-head-metric",
        heading: "1. The 'Per-Head' Merch Benchmark",
        content: [
          "Amateur bands judge merch success by gross dollars: 'We made $400 tonight!' Professional touring acts judge success by the 'Per-Head' ratio (Total Merch Gross divided by Total Ticket Holders in the room).",
          "If you made $400 in a room of 50 people, your per-head average is an extraordinary $8.00/head. If you made $400 in a room of 400 people, your per-head average is a lackluster $1.00/head.",
          "Tracking your per-head average by city and day of the week reveals your real touring trajectory. When your per-head metric climbs consistently above $5.00, your audience connection is primed for larger market investments."
        ]
      },
      {
        id: "pricing-psychology",
        heading: "2. Clean Pricing Psychology & Inventory Bundling",
        content: [
          "Never use awkward change pricing like $23 or $28. Every price at your merch table should be rounded to a clean $5 or $10 increment to eliminate fumbling with coins in the dark.",
          "• Standard T-Shirts: $25 or $30",
          "• Long Sleeves / Hoodies: $40 to $55",
          "• Vinyl LPs: $25 or $30",
          "• Enamel Pins & Embroidered Patches: $10",
          "• Die-Cut Stickers: $2 to $5 (or free with any shirt purchase)",
          "The 'Bundle Upsell': Offer a $40 package combining a $30 T-Shirt + $10 Vinyl/CD + Free Sticker. Bundling increases ticket basket size by 30% because concertgoers perceive immediate value."
        ],
        proTip: "Place a bold, printed sign on the front of your table: 'All Shirts Printed on 100% Ringspun Cotton (Comfort Colors / Bella Canvas)'. Fans gladly pay $30 for soft, premium shirts they will actually wear; cheap, scratchy cardboard tees sit in drawers."
      },
      {
        id: "table-lighting-display",
        heading: "3. Merch Table Lighting & Spatial Positioning",
        content: [
          "Clubs often tuck the merchandise area into the darkest corner of the venue by the exit doors or coat check. If patrons cannot see your shirt graphics clearly from 15 feet away, they will walk past your table without stopping.",
          "Always travel with two portable, rechargeable warm-white LED clip lights and an adjustable rear banner grid. Illuminate your hanging t-shirts and vinyl records so the artwork pops in the dim room.",
          "Display shirts at eye level using velvet wooden hangers or a folding grid wall. Keep sample sizes laid out neatly on the front edge so customers can touch the fabric and gauge real sizing."
        ]
      },
      {
        id: "payment-technology",
        heading: "4. Conquering Basement Club Payment Dead-Zones",
        content: [
          "A shocking number of independent rock clubs are located in subterranean basements or concrete bunkers where cellular data drops to zero. If your card reader cannot connect, you lose sales immediately.",
          "Configure your Square or Stripe terminal to enable 'Offline Mode' before leaving for tour. Offline processing stores encrypted card swipes locally on your device and submits transactions automatically the moment you reconnect to hotel Wi-Fi.",
          "Display a laminated card featuring high-contrast QR codes for Venmo, Cash App, and PayPal. Include your explicit handle in bold text below the QR code for patrons whose phone cameras struggle in low-light conditions."
        ]
      }
    ],
    faq: [
      {
        q: "What is a 'Merch Cut' and do independent clubs take one?",
        a: "A merch cut is a percentage (typically 15% to 25% of soft goods) that some venues deduct from artist merch sales. In sub-300-capacity DIY clubs, merch cuts are rare and should be aggressively resisted during initial contract negotiation. If a venue insists on a merch cut, request that they provide a dedicated, paid seller."
      },
      {
        q: "Who should staff the merchandise table during the show?",
        a: "When possible, travel with a dedicated touring merch manager or tour assistant. If self-staffing, the lead singer and band members MUST be behind the table within 3 minutes of ending your set while audience adrenaline and excitement are at their peak."
      }
    ]
  },
  {
    id: "art-8",
    slug: "negotiating-guarantees-door-splits-and-versus-deals",
    title: "How to Negotiate Guarantees, Door Splits, and Versus Deals Without Getting Burned",
    seoTitle: "Band Deal Structures: Guarantees vs Door Splits vs Versus | GigLizard",
    metaDescription: "Master live music deal structures: straight guarantees, door splits after production expense nuts, and versus deals. Learn how to settle cash with club promoters.",
    keywords: ["band guarantee vs door split", "versus deal concert booking", "how to negotiate live gig pay", "promoter expense nut", "live music settlement etiquette"],
    category: "Tour Finances",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-10-30",
    updatedDate: "2026-11-02",
    readTimeMinutes: 9,
    excerpt: "Signing a performance contract without understanding the 'house expense nut' is how bands draw 150 people and walk away with $60. Demystify live concert financial agreements and learn how to audit your midnight settlement.",
    keyTakeaways: [
      "Straight Guarantee: A fixed payment ($300, $500, $1,000) paid regardless of ticket sales. The gold standard for touring acts covering highway gas.",
      "Door Split: The artist receives a percentage (e.g. 80%) of ticket sales AFTER the venue deducts its approved 'production nut' (sound engineer, security, door staff).",
      "Versus Deal ($500 vs 80%): The artist receives whichever amount is greater—the guaranteed floor or the percentage share.",
      "Always inspect the venue door count audit sheet before signing the settlement slip at the end of the night."
    ],
    relatedTool: {
      name: "Transparent Pricing Comparison",
      url: "/pricing",
      label: "See How GigLizard Helps Touring Bands Keep 100% of Their Earnings",
      tab: "pricing"
    },
    sections: [
      {
        id: "three-deal-types",
        heading: "1. The Three Primary Concert Deal Structures",
        content: [
          "When a talent buyer replies to your pitch with a deal memo, it will usually fall into one of three categories:",
          "• 1. Flat Guarantee: You are paid an exact dollar sum (e.g., $400) upon completion of your performance. The promoter takes all financial risk on ticket sales. Best for mid-week dates in unfamiliar markets.",
          "• 2. Door Split / Percentage: You receive a portion of box office gross—typically 70% to 85% of door revenue. Crucially, this split can be 'from dollar one' or 'after the house nut'. A 100% door split on a $10 ticket with 80 people pays $800.",
          "• 3. The Versus Deal (The Pro Standard): Written as '$500 vs 80% of net door'. You are guaranteed a minimum of $500. If 150 tickets sell at $10 ($1,500 gross minus $300 expenses = $1,200 net), your 80% cut equals $960. You take the higher $960 payout."
        ]
      },
      {
        id: "the-expense-nut",
        heading: "2. Beware the Inflated 'House Expense Nut'",
        content: [
          "The most common way independent bands get blindsided is an unverified 'production expense nut'. A promoter promises '80% of the door after expenses', but at midnight settlement they produce an invoice for $650 in expenses:",
          "Sound Tech: $200, Door Staff: $100, Security: $150, Hospitality: $100, Advertising: $100. If the door took in $700, the 'net profit' is only $50, leaving the band with a measly $40.",
          "Never agree to an open-ended 'expenses' clause. Cap the expense nut in your email agreement: 'Deal is 80% of door sales after a capped house sound fee not to exceed $150.' If a promoter refuses to cap their expense nut, walk away."
        ],
        proTip: "Have your tour manager or a trusted band member periodically check the clicker count at the front door at 8:30 PM, 9:30 PM, and 10:30 PM. Discrepancies between physical room headcount and the promoter's reported ticket sales are easiest to address in real time."
      },
      {
        id: "settlement-etiquette",
        heading: "3. Midnight Settlement Etiquette with the Bookkeeper",
        content: [
          "Settlement occurs 15 to 30 minutes after the headliner finishes, usually in the venue manager's office or behind the soundboard.",
          "Designate ONE person from your band to handle settlement. Do not bring the entire four-piece group into the office holding beers; it creates an adversarial, chaotic atmosphere.",
          "Politely review the settlement sheet: (1) Total tickets sold at advance price, (2) Total tickets sold at door price, (3) Gross box office receipts, (4) Agreed-upon production deductions, (5) Net artist payout. Count cash quietly and securely before stepping away."
        ]
      },
      {
        id: "w9-and-taxes",
        heading: "4. W-9 Forms, Electronic Payouts & Withholding",
        content: [
          "Venues paying guarantees over $600 will require a completed IRS Form W-9 before handing over a corporate check or initiating an ACH transfer.",
          "Carry a pre-filled, signed W-9 PDF on your phone under your band's legal LLC or designated business entity name. Avoid having large checks written to an individual band member's personal name, which concentrates income tax liabilities on a single individual.",
          "If being paid by check, ensure the venue has a functioning contact phone number and confirm when checks clear with your mobile banking app before driving out of state."
        ]
      }
    ],
    faq: [
      {
        q: "What should a band do if a venue promoter refuses to pay the agreed guarantee?",
        a: "Stay calm and professional. Pull up your written email agreement on your phone confirming the agreed-upon guarantee. If the manager claims ticket sales were soft, negotiate a compromise (e.g., free food/drinks + partial cash + a confirmed re-booking date). Never resort to physical confrontation or property damage, which creates legal liability and destroys your reputation."
      },
      {
        q: "Is an email confirmation legally binding for band bookings?",
        a: "Yes. In the United States, written email correspondence establishing an offer, acceptance, agreed compensation, and performance date constitutes an enforceable contract under standard commercial law."
      }
    ]
  },
  {
    id: "art-9",
    slug: "designing-gig-posters-that-actually-sell-tickets",
    title: "Designing High-Converting Gig Posters & Street Postering Legally",
    seoTitle: "How to Design Concert Posters That Sell Tickets | GigLizard",
    metaDescription: "Master concert poster design: 5-foot readability rules, 11x17 tabloid formatting, conversion QR codes, and legal street postering regulations.",
    keywords: ["how to design concert posters", "band gig flyer design rules", "street postering laws for bands", "gig flyer typography", "concert promotion poster tips"],
    category: "Promotion & Merch",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-11-01",
    updatedDate: "2026-11-03",
    readTimeMinutes: 7,
    excerpt: "A concert poster is not fine art meant for quiet museum study—it is an advertising billboard competing with traffic, neon signs, and pedestrian distractions. Learn the typography hierarchy and street postering tactics that put fans in the room.",
    keyTakeaways: [
      "The 5-Foot Readability Test: A pedestrian walking past a telephone pole or record store window must digest the Headliner, Date, and Venue in 3 seconds.",
      "Include the 6 Mandatory Data Points: Headliner, Support Acts, Day of Week, Full Date, Venue Name & City, Door & Show Time, and Age Restriction (21+ / All Ages).",
      "Format print posters in standard 11x17 inch Tabloid at 300 DPI with a 0.125-inch bleed margin for commercial offset print shops.",
      "Embed a high-contrast QR code linked directly to advance ticket sales with Google Analytics UTM tracking parameters."
    ],
    relatedTool: {
      name: "Concert Poster Designer",
      url: "/poster",
      label: "Design Vintage Halftone & Neon Gig Flyers with our Poster Studio",
      tab: "poster"
    },
    sections: [
      {
        id: "typography-hierarchy",
        heading: "1. The 3-Second Typographic Hierarchy",
        content: [
          "Graphic designers often make the mistake of using ornate, illegible gothic or psychedelic scripts that obscure the show's basic facts. If someone has to stop, squint, and decipher your font, your flyer has failed.",
          "Hierarchical Rule of Live Event Postering:",
          "• Tier 1 (Largest Element - 40% of visual weight): Headlining Band Name. High-contrast, bold, readable from across the street.",
          "• Tier 2 (Secondary Element - 25% of weight): Supporting Acts. Clean, complementary typography.",
          "• Tier 3 (Action Data - 20% of weight): Day of Week, Date, Venue Name, and City. (e.g. 'FRIDAY, NOVEMBER 14 • THE SHOWBOX • SEATTLE').",
          "• Tier 4 (Fine Print - 15% of weight): Door time, Show time, Ticket Price ($15 Adv / $18 Door), Age Policy (21+), and Ticket QR Code."
        ],
        proTip: "Always include the DAY OF THE WEEK alongside the numerical date. People plan their social lives around 'Friday' or 'Saturday', not 'November 14'."
      },
      {
        id: "print-vs-social",
        heading: "2. The Print (11x17) vs Social (9:16 & 1:1) Dimension Split",
        content: [
          "Designing one single graphic and cropping it arbitrarily across platforms results in awkward, cut-off social posts.",
          "Every show campaign requires three master aspect ratios:",
          "• 1. 11x17 Inches (Tabloid Print): The standard for coffee shop bulletin boards, record store windows, and telephone poles. Print at 300 DPI CMYK.",
          "• 2. 9:16 Vertical (1080x1920 px): Optimized for Instagram Stories, TikTok, and mobile viewing.",
          "• 3. 1:1 Square (1080x1080 px): Optimized for Instagram feed posts, Facebook event headers, and Bandcamp community updates."
        ]
      },
      {
        id: "qr-code-optimization",
        heading: "3. Designing QR Codes That Actually Convert",
        content: [
          "Placing a raw, tiny QR code in the bottom corner of a poster rarely generates scans. To drive conversions, make the QR code actionable:",
          "Surround the code with a clear call-to-action border: 'SCAN FOR $12 ADVANCE TICKETS (SAVE $5 AT THE DOOR)'. Financial incentives dramatically increase scan rates.",
          "Always test your QR code from 4 feet away under dim indoor lighting before printing 200 copies. Ensure the QR code has a solid white quiet zone around its perimeter so phone cameras can lock focus."
        ]
      },
      {
        id: "street-postering-laws",
        heading: "4. The Rules of Legal Street Postering",
        content: [
          "Most metropolitan cities enforce municipal sign ordinances regarding utility poles and public property. Getting hit with a city code compliance fine can wipe out your entire show profit.",
          "• High-Yield Legal Spots: Independent record stores, vintage clothing boutiques, guitar shops, college campus community bulletin boards, and independent coffee houses.",
          "• Always Ask Permission: Spend 30 seconds asking the shop clerk: 'Hey, we're playing at [Local Venue] next week, would you mind if we hung a flyer on your community board?' Establishing rapport ensures your flyer stays up for weeks rather than being recycled the next morning.",
          "• Never Poster Over Other Acts: Postering etiquette is sacred in DIY scenes. Never tape your poster over another band whose concert date has not passed yet. Find open space or pin alongside."
        ]
      }
    ],
    faq: [
      {
        q: "How many physical posters should a touring band send ahead to the venue?",
        a: "Mail 5 to 10 11x17 tabloid posters directly to the venue talent buyer or production office 3 to 4 weeks prior to the show date, marked with 'ATTN: GIG POSTERS FOR [DATE]'."
      },
      {
        q: "Is wheatpasting legal in US cities?",
        a: "In most commercial districts, permanent wheatpasting on private buildings or city infrastructure is classified as graffiti vandalism. Stick to designated public message boards or approved postering kiosks."
      }
    ]
  },
  {
    id: "art-10",
    slug: "day-of-show-timeline-load-in-to-settlement",
    title: "The Day-of-Show Master Timeline: From 3:00 PM Load-In to Midnight Settlement",
    seoTitle: "The Day-of-Show Timeline for Touring Bands | GigLizard",
    metaDescription: "Master day-of-show execution: load-in etiquette, line checks vs full soundchecks, dinner buyouts, stage changeovers, and midnight settlement procedures.",
    keywords: ["day of show timeline bands", "gig load in schedule", "soundcheck etiquette", "stage changeover timeline", "concert settlement process"],
    category: "Live Sound & Tech",
    author: {
      name: "Little Rusty",
      role: "Touring Musician & Live Sound Engineer (Dr Hadit)",
      bio: "15+ years touring the Lower 48 in 15-passenger vans and box trucks; founder of GigLizard."
    },
    publishDate: "2026-11-02",
    updatedDate: "2026-11-03",
    readTimeMinutes: 8,
    excerpt: "Show night runs like clockwork when your band follows an exact timeline. Walk through the standard 9-hour live production sequence—from van arrival and line check to midnight settlement and hotel departure.",
    keyTakeaways: [
      "Arrive at the venue 15 minutes before your scheduled load-in time. Being 30 minutes late disrupts the entire 4-band soundcheck schedule.",
      "Clear your gear off the stage immediately following your set before speaking to fans or packing your personal guitar cases.",
      "Stage changeovers are capped at 15 minutes in club environments. Practice quick-strike setup and teardown at band rehearsal.",
      "Respect curfew times strictly. A band that plays through a hard 11:00 PM or midnight curfew costs the venue thousands in municipal noise fines."
    ],
    relatedTool: {
      name: "650+ Venue Directory",
      url: "/venues",
      label: "View Stage Specs & Production Contacts Across 650+ Venues",
      tab: "venues"
    },
    sections: [
      {
        id: "the-master-timeline",
        heading: "1. The Standard 9-Hour Club Show Timeline",
        content: [
          "While every venue has quirks, 90% of independent music venues operate on this exact day-of-show production schedule:",
          "• 3:30 PM: Van arrival & stage door check-in with the house sound engineer.",
          "• 4:00 PM: Load-in & backline staging in the green room or gear storage corridor.",
          "• 5:00 PM: Headliner Soundcheck (45 minutes).",
          "• 5:45 PM: Direct Support Soundcheck (30 minutes).",
          "• 6:15 PM: Local Opener Line Check (15 minutes).",
          "• 6:30 PM: Stage cleared, room swept, hospitality dinner break.",
          "• 7:00 PM: Doors open to the public; background music playlist active.",
          "• 8:00 PM: Opener Set (30–35 min) + 15 min changeover.",
          "• 8:50 PM: Support Set (40–45 min) + 15 min changeover.",
          "• 9:50 PM: Headliner Set (60–75 min) including encore.",
          "• 11:15 PM: Set concludes, immediate stage clearing, merch table rush.",
          "• 11:45 PM: Midnight cash settlement with venue bookkeeper; van loaded & locked."
        ]
      },
      {
        id: "load-in-etiquette",
        heading: "2. Load-In Etiquette: Staging vs Setting Up",
        content: [
          "When you arrive at load-in, DO NOT immediately place your drums or amplifiers on the active stage. The stage belongs to the band currently scheduled for soundcheck.",
          "Place all your cases, pedalboards, and amplifiers in the designated 'dead case' storage area or against the rear green room wall. Consolidate your footprint so walking paths remain clear for staff and sound techs.",
          "Introduce yourself to the house sound engineer immediately with a polite handshake: 'Hey, I'm [Name] with [Band Name]. Here is our fresh printed stage plot and patch list. Let us know when you're ready for our backline.' A respectful introduction sets a positive tone for the entire night."
        ],
        proTip: "Never leave vehicle loading doors unattended on city streets. Always designate one band member to stand watch outside while others carry amplifiers into the venue."
      },
      {
        id: "changeover-discipline",
        heading: "3. The 15-Minute 'Rapid Strike' Stage Changeover",
        content: [
          "The true test of a professional touring band is how quickly they clear the stage when their final chord rings out.",
          "As soon as your set ends: Unplug all instruments, collapse your mic boom stands, and physically carry all guitar heads, pedalboards, and drum hardware off the stage to the storage area FIRST. Only once the stage is 100% clear should you disassemble your pedalboard cables or pack snare drums into cases.",
          "Lingering on stage chatting with friends while the next band stands waiting in the wings with guitars in hand is the ultimate amateur move. Clear first, socialize second."
        ]
      },
      {
        id: "curfews-and-encores",
        heading: "4. Why is honoring venue sound curfews critical for independent bands?",
        content: [
          "Municipalities impose strict noise and sound ordinance curfews—frequently 11:00 PM on weeknights and 12:00 AM on weekends. If a show runs past curfew, the city fines the venue $500 to $2,500.",
          "If your set is scheduled to end at 11:00 PM, your last note must finish by 10:59 PM. Never ask the engineer: 'Hey, can we do two more songs?' They will say no, or cut the front-of-house PA power directly at the console.",
          "Encores are earned, not obligatory. Only perform an encore if the crowd refuses to leave and the house engineer or stage manager gives you an enthusiastic 'thumbs up' indicating time remains on the clock."
        ]
      }
    ],
    faq: [
      {
        q: "What should a band do if the schedule falls 30 minutes behind?",
        a: "Be the hero of the night: voluntarily offer the sound tech to trim 5 to 7 minutes off your set. The sound engineer and talent buyer will deeply appreciate your professionalism, and you guarantee yourself an instant re-booking next tour."
      },
      {
        q: "Can we drink our own alcohol in the backstage green room?",
        a: "In almost all US states, bringing outside alcohol into a licensed commercial bar or music venue is a severe liquor license violation. Drink only the hospitality beverages provided by the venue."
      }
    ]
  }
];

export const TOUR_ARTICLES: TourArticle[] = [
  ...BASE_TOUR_ARTICLES,
  ...EXTRA_TOUR_ARTICLES
];

export function getArticleBySlug(slug: string): TourArticle | undefined {
  const cleanSlug = slug.toLowerCase().trim().replace(/^\/articles\//, "").replace(/^\//, "");
  return TOUR_ARTICLES.find(a => a.slug === cleanSlug);
}

export function getRelatedArticles(slugOrId: string, limit: number = 3): TourArticle[] {
  const current = TOUR_ARTICLES.find(a => a.slug === slugOrId || a.id === slugOrId);
  if (!current) return TOUR_ARTICLES.slice(0, limit);
  return TOUR_ARTICLES
    .filter(a => a.id !== current.id && a.slug !== current.slug)
    .sort((a, b) => (a.category === current.category ? -1 : 1) - (b.category === current.category ? -1 : 1))
    .slice(0, limit);
}
