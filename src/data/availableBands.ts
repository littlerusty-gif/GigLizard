import { AvailableBand } from "../types";
import { ROCKIES_AND_WEST_BANDS } from "./rockiesAndWestBands";
import { ALL_OREGON_BANDS } from "./oregonBands";
import { ALL_WASHINGTON_BANDS } from "./washingtonBands";
import { ALL_COLORADO_BANDS } from "./coloradoBands";
import { ALL_ARIZONA_BANDS } from "./arizonaBands";
import { ALL_CALIFORNIA_BANDS } from "./californiaBands";

const STATIC_BANDS: AvailableBand[] = [
  {
    id: "dr-hadit",
    name: "Dr Hadit",
    genres: ["Alternative Rock", "Hard Rock", "Pacific NW"],
    city: "Seattle, WA",
    bio: "High-octane Pacific Northwest rock and live touring performance. Powered by Dr Hadit with heavy overdrive riffs, sharp rhythms, and soaring anthems.",
    contactEmail: "littlerusty@gmail.com",
    contactPhone: "(206) 555-0199",
    website: "https://www.drhadit.com",
    musicUrl: "https://drhadit.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "silent-velocity",
    name: "Silent Velocity",
    genres: ["Punk", "Alternative Rock", "Grunge"],
    city: "Seattle, WA",
    bio: "Pure raw energy inspired by early 90s Pacific Northwest grunge. High contrast quiet-loud verses, screaming feedback hooks, and a relentless physical stage show. Heavy drums and dual vocal lines.",
    contactEmail: "velocitybooking@northwestdiy.org",
    contactPhone: "(206) 555-9831",
    musicUrl: "https://silentvelocity.bandcamp.com",
    experienceLevel: "Local"
  },
  {
    id: "blackwater-holylight-band",
    name: "Blackwater Holylight",
    genres: ["Psychedelic Rock", "Heavy Doom", "Krautrock", "Darkwave"],
    city: "Portland, OR",
    bio: "Ethereal synth textures layered over heavy fuzz bass riffs and soaring melodic vocals. A captivating and heavy atmosphere that seamlessly blends elements of 70s psychedelic, doom metal, and post-punk.",
    contactEmail: "booking@blackwaterholylight.com",
    contactPhone: "(503) 555-0199",
    website: "www.blackwaterholylight.com",
    epkUrl: "https://ridingeasyrecs.com/artists/blackwater-holylight/",
    musicUrl: "https://blackwaterholylight.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "y-la-bamba",
    name: "Y La Bamba",
    genres: ["Latin Indie", "Indie Folk", "Alternative Pop"],
    city: "Portland, OR",
    bio: "Led by singer-songwriter Luz Elena Mendoza, Y La Bamba is a beloved Portland mainstay. Merging traditional Mexican folk styles with dreampop guitars, polyrhythmic percussion, and deeply emotional vocal harmonies.",
    contactEmail: "booking@ylabambamusic.com",
    contactPhone: "(503) 555-9112",
    website: "www.ylabamba.com",
    epkUrl: "https://www.ylabamba.com/press",
    musicUrl: "https://ylabamba.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "soft-kill-pdx",
    name: "Soft Kill",
    genres: ["Post-Punk", "Darkwave", "Goth Rock"],
    city: "Portland, OR",
    bio: "Melodious yet melancholy darkwave fueled by swirling chorus-drenched bass lines, crisp motorized drum pads, and brooding baritone vocals. Legendary figures in the modern Pacific Northwest post-punk renaissance.",
    contactEmail: "booking@softkillpdx.com",
    contactPhone: "(503) 555-0210",
    website: "www.softkillpdx.bandcamp.com",
    epkUrl: "https://www.softkillpdx.com/epk",
    musicUrl: "https://softkillpdx.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "help-noise-pdx",
    name: "Help",
    genres: ["Noise Rock", "Punk", "Garage Hardcore"],
    city: "Portland, OR",
    bio: "A power-trio delivering direct, politically charged, abrasive noise rock. Incorporating rapid snare tempos, heavy feedback-heavy guitars, and screaming vocals that lock in for a high-intensity floor show.",
    contactEmail: "helpthebandpdx@gmail.com",
    contactPhone: "Inquire",
    website: "www.helppdx.bandcamp.com",
    musicUrl: "https://helppdx.bandcamp.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "shook-twins",
    name: "Shook Twins",
    genres: ["Folk", "Americana", "Acoustic Pop"],
    city: "Portland, OR",
    bio: "Identical twin sisters Laurie and Katelyn Shook create stunning folky arrangements backed by stand-up bass, banjo, and beatboxing. Incorporating quirky instruments like a telephone microphone.",
    contactEmail: "shooktwins@management.com",
    contactPhone: "(503) 555-7788",
    website: "www.shooktwins.com",
    epkUrl: "https://www.shooktwins.com/epk",
    musicUrl: "https://shooktwins.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "summer-cannibals",
    name: "Summer Cannibals",
    genres: ["Garage Punk", "Indie Rock", "Fuzz Rock"],
    city: "Portland, OR",
    bio: "Led by powerhouse Jessica Boudreaux, Summer Cannibals delivers biting guitar hooks, energetic drum fills, and a fiery attitude. Outstanding local club favorites with excellent draw.",
    contactEmail: "summercannibals@gmail.com",
    contactPhone: "Inquire",
    musicUrl: "https://summercannibals.bandcamp.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "pure-bathing-culture",
    name: "Pure Bathing Culture",
    genres: ["Dream Pop", "Indie Pop", "Synthwave"],
    city: "Portland, OR",
    bio: "Lush, sun-dappled dream pop with sparkling clean electric guitars and glistening synthesizers. Guided by Sarah Versprille's crystal-clear vocals, perfect for atmospheric rooms and theaters.",
    contactEmail: "booking@purebathingculture.com",
    contactPhone: "(503) 555-4001",
    website: "www.purebathingculture.com",
    epkUrl: "https://www.purebathingculture.com/press",
    musicUrl: "https://purebathingculture.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "federale-band",
    name: "Federale",
    genres: ["Psych Rock", "Cinematic Folk", "Spaghetti Western"],
    city: "Portland, OR",
    bio: "A highly atmospheric, cinematic rock collective performing orchestral, vocal-driven tunes inspired by classic 1960s Spaghetti Western film scores, led by Collin Hegna of Brian Jonestown Massacre fame.",
    contactEmail: "booking@federalemusic.com",
    contactPhone: "(503) 555-8910",
    website: "www.federalemusic.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "atherton-pdx",
    name: "Atherton",
    genres: ["Alternative Rock", "Indie Rock", "Grunge"],
    city: "Portland, OR",
    bio: "Raw local indie quartet bridging 90s shoegaze guitars with driving, melodic hook structures. A consistent presence in Northeast Portland venue rooms and student cooperatives.",
    contactEmail: "athertonband@yahoo.com",
    contactPhone: "(503) 555-3211",
    experienceLevel: "Local"
  },
  {
    id: "floating-room-band",
    name: "Floating Room",
    genres: ["Slowcore", "Lo-Fi Indie", "Noise Pop"],
    city: "Portland, OR",
    bio: "Maya Stoner leads this introspective indie-rock project, weaving fragile vocal textures and heavy, crushing guitar feedback. Deep, powerful songs that resonate in highly intimate chambers.",
    contactEmail: "floatingroom@sadrecords.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "copper-canyon",
    name: "Copper Canyon Caravan",
    genres: ["Folk", "Acoustic", "Americana"],
    city: "Nashville, TN",
    bio: "An organic acoustic collective fusing traditional mandolin arrangements, triple-part vocal harmonies, and warm wooden cello tones. Perfect for sit-down theatres and intimate listening room stages.",
    contactEmail: "management@coppercanyoncaravan.com",
    contactPhone: "(615) 555-4033",
    experienceLevel: "National Act"
  },
  {
    id: "neon-vandal",
    name: "The Neon Vandals",
    genres: ["Synthwave", "Electronic", "Psychedelic"],
    city: "Austin, TX",
    bio: "Late-night analog synthesizer dreamscape rock. Incorporating live electronic drums, keytar leads, and highly cinematic retro rhythms. A highly visually curated stage show with integrated lighting.",
    contactEmail: "neonvandals@vintageamps.com",
    contactPhone: "(512) 555-8120",
    experienceLevel: "Regional Tour"
  },
  {
    id: "the-decemberists-band",
    name: "The Decemberists",
    genres: ["Indie Folk", "Chamber Pop", "Alternative Rock"],
    city: "Portland, OR",
    bio: "Whimerical indie folk royalty known for historical narratives, complex multi-instrumentation, and massive sing-along choruses. Perfect for historic theater stages and pristine hall environments.",
    contactEmail: "booking@decemberists.com",
    contactPhone: "(503) 555-1212",
    website: "www.decemberists.com",
    experienceLevel: "National Act"
  },
  {
    id: "sleater-kinney-band",
    name: "Sleater-Kinney",
    genres: ["Riot Grrrl", "Indie Rock", "Punk"],
    city: "Portland, OR",
    bio: "The iconic, high-intensity dual-guitar rock outfit led by Carrie Brownstein and Corin Tucker. Delivering blistering riffs, social messaging, and unparalleled live vocal chemistry.",
    contactEmail: "booking@sleaterkinney.com",
    contactPhone: "Inquire",
    website: "www.sleater-kinney.com",
    experienceLevel: "National Act"
  },
  {
    id: "strfkr-band",
    name: "STRFKR",
    genres: ["Indie Pop", "Electronic", "Dance", "Synthpop"],
    city: "Portland, OR",
    bio: "High-energy, dancefriendly indie electronic outfit utilizing multiple vintage synths, live acoustic drums, and custom light walls. Notorious for dynamic, celebratory crowded venue dance floors.",
    contactEmail: "booking@strfkr.com",
    contactPhone: "(503) 555-4499",
    website: "www.strfkr.com",
    experienceLevel: "National Act"
  },
  {
    id: "red-fang-band",
    name: "Red Fang",
    genres: ["Stoner Metal", "Heavy Rock", "Sludge"],
    city: "Portland, OR",
    bio: "Premium fuzz, heavy distorted bass scales, and massive dual harmonies. Classic sludge rock heroes delivering a high-velocity stage performance. Extremely popular with heavy club promoters.",
    contactEmail: "booking@redfangband.com",
    contactPhone: "(503) 555-9031",
    website: "www.redfang.net",
    experienceLevel: "National Act"
  },
  {
    id: "helio-sequence-band",
    name: "The Helio Sequence",
    genres: ["Dreampop", "Indie Rock", "Ambient Beats"],
    city: "Portland, OR",
    bio: "Sub Pop legends combining cinematic acoustic guitar delay loops, powerhouse drumming, and lush synthesized soundscapes. Pioneers of modern PNW dreampop recording techniques.",
    contactEmail: "helio@subpop.com",
    contactPhone: "Inquire",
    website: "www.theheliosequence.com",
    experienceLevel: "National Act"
  },
  {
    id: "blitzen-trapper-band",
    name: "Blitzen Trapper",
    genres: ["Folk Rock", "Country Rock", "Americana"],
    city: "Portland, OR",
    bio: "Gritty, storytelling country-folk merged with classic 70s rock structures. Seamless acoustic picking, warm organ pads, and memorable, heartful Pacific Northwest folk lyrics.",
    contactEmail: "booking@blitzentrapper.net",
    contactPhone: "(503) 555-3344",
    website: "www.blitzentrapper.net",
    experienceLevel: "National Act"
  },
  {
    id: "la-luz-band",
    name: "La Luz",
    genres: ["Surf Rock", "Psych Pop", "Retro Indie"],
    city: "Seattle, WA",
    bio: "Dreamy four-part vocal harmonies floating over fuzzy surf-rock guitars and prominent organ scales. Outstanding warm vintage vibe that fits excellently in damp basement clubs or sunlit outdoor lawns.",
    contactEmail: "laluz@hardlyart.com",
    contactPhone: "(206) 555-4009",
    website: "www.laluzband.com",
    experienceLevel: "National Act"
  },
  {
    id: "chastity-belt-band",
    name: "Chastity Belt",
    genres: ["Indie Rock", "Dream Pop", "Post-Punk"],
    city: "Seattle, WA",
    bio: "Introspective post-punk and shimmering dreampop characterized by dry wit, beautiful intertwined lead guitars, and relaxed, driving tempos. Extremely popular across independent venues.",
    contactEmail: "chastitybelt@gmail.com",
    contactPhone: "Inquire",
    website: "www.chastitybelt.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "deep-sea-diver-band",
    name: "Deep Sea Diver",
    genres: ["Indie Rock", "Alternative Pop", "Synth Rock"],
    city: "Seattle, WA",
    bio: "Led by guitar hero Jessica Dobson, Deep Sea Diver delivers incredibly tight rhythms, complex guitar phrasing, and beautiful, sweeping synth-laden choruses. A powerful live performance experience.",
    contactEmail: "booking@deepseadiverband.com",
    contactPhone: "(206) 555-8933",
    website: "www.deepseadiver.com",
    experienceLevel: "National Act"
  },
  {
    id: "tacocat-band",
    name: "Tacocat",
    genres: ["Pop Punk", "Surf Punk", "Indie Rock"],
    city: "Seattle, WA",
    bio: "Highly colorful, melodic pop punk capturing humorous themes, feminist perspectives, and Pacific Northwest quirks. Known for high-energy, bubblegum-colored visual stage presence.",
    contactEmail: "tacocat@subpop.com",
    contactPhone: "Inquire",
    website: "https://www.tacocatband.com",
    epkUrl: "https://hardlyart.com/artists/tacocat",
    experienceLevel: "National Act"
  },
  {
    id: "naked-giants-band",
    name: "Naked Giants",
    genres: ["Garage Rock", "Psychedelic", "Alternative"],
    city: "Seattle, WA",
    bio: "A frantic, sweaty, and wildly charismatic garage-rock trio. Merging chaotic guitar solos with tight rhythms and massive gang choir vocals. An absolute riot in sweaty basement rooms.",
    contactEmail: "booking@nakedgiants.com",
    contactPhone: "Inquire",
    website: "www.nakedgiants.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "shabazz-palaces-band",
    name: "Shabazz Palaces",
    genres: ["Experimental Hip Hop", "Afrofuturism", "Cosmic Beats"],
    city: "Seattle, WA",
    bio: "Avante-garde cosmic hip hop masterminded by Ishmael Butler. Rich with off-kilter organic percussion layers, deep sub bass oscillators, and highly mystical poetic deliveries.",
    contactEmail: "shabazz@subpop.com",
    contactPhone: "(206) 555-0919",
    website: "www.shabazzpalaces.com",
    experienceLevel: "National Act"
  },
  {
    id: "cave-singers-band",
    name: "The Cave Singers",
    genres: ["Indie Folk", "Blues", "Americana"],
    city: "Seattle, WA",
    bio: "Stones-y acoustic folk grooves driven by warm flatpicked guitars, hypnotic bass drums, and Pete Quirk's unmistakable, rustic raspy vocals. Perfect for intimate campfire atmosphere halls.",
    contactEmail: "cavesingers@gmail.com",
    contactPhone: "Inquire",
    website: "www.thecavesingers.com",
    experienceLevel: "National Act"
  },
  {
    id: "moondoggies-band",
    name: "The Moondoggies",
    genres: ["Cosmic Americana", "Roots Rock", "Soul Folk"],
    city: "Seattle, WA",
    bio: "Outstanding three-part vocal harmony rock inspired by classic country rock and warm Pacific Northwest evergreens. Warm tube guitar solos, vintage organs, and deep folk hooks.",
    contactEmail: "moondoggies@booking.com",
    contactPhone: "(206) 555-6677",
    experienceLevel: "Regional Tour"
  },
  {
    id: "valley-maker-band",
    name: "Valley Maker",
    genres: ["Indie Folk", "Acoustic Pop", "Singer-Songwriter"],
    city: "Seattle, WA",
    bio: "Austin Crane's songwriting project features beautiful fingerpicked guitars, rich woodwind arrangements, and deeply introspective lyrical themes about hometowns and community.",
    contactEmail: "valleymaker@gmail.com",
    contactPhone: "Inquire",
    website: "www.valleymaker.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "damien-jurado-band",
    name: "Damien Jurado",
    genres: ["Indie Folk", "Acoustic", "Singer-Songwriter"],
    city: "Seattle, WA",
    bio: "A prolific, deeply spiritual master storyteller of the Northwest. Fragile solo acoustic settings, lush tape-delay echo pedals, and deeply resonant vocal presentations that capture absolute silence.",
    contactEmail: "booking@damienjurado.com",
    contactPhone: "Inquire",
    website: "www.damienjurado.com",
    experienceLevel: "National Act"
  },
  {
    id: "talkdemonic-band",
    name: "Talkdemonic",
    genres: ["Instrumetal Folktronica", "Post-Rock", "Ambient"],
    city: "Portland, OR",
    bio: "Bespoke instrumental duo combining dramatic live viola textures, warm synthesized drones, and heavy, hip hop influenced acoustic drum tempos. Perfect for moody gallery setups.",
    contactEmail: "booking@talkdemonic.com",
    contactPhone: "Inquire",
    website: "www.talkdemonic.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "built-to-spill-tour",
    name: "Built to Spill",
    genres: ["Indie Rock", "Melodic Noise", "Alternative"],
    city: "Boise / Seattle",
    bio: "Doug Martsch's legendary indie-guitar powerhouse. Intricate interwoven three-guitar dynamic leads, beautiful high register vocal melodies, and iconic cascading delay pedal systems.",
    contactEmail: "booking@builttospill.com",
    contactPhone: "Inquire",
    website: "www.builttospill.com",
    experienceLevel: "National Act"
  },
  {
    id: "gossip-band",
    name: "Gossip",
    genres: ["Dance Punk", "Soul Punk", "Indie Disco"],
    city: "Portland, OR",
    bio: "Searing soul punk led by the unmatched powerhouse Beth Ditto. Fusing minimal driving punk-funk guitars, heavy club bass scales, and massive, gospel-grade soulful vocal belts.",
    contactEmail: "booking@gossipband.com",
    contactPhone: "(503) 555-8811",
    experienceLevel: "National Act"
  },
  {
    id: "dandy-warhols",
    name: "The Dandy Warhols",
    genres: ["Psychedelic Rock", "Neo-Psychedelia", "Alternative Rock"],
    city: "Portland, OR",
    bio: "Legendary cosmic cool veterans weaving hypnotic synth-drenched drone guitars, dynamic 60s hooks, and unforgettable live energy. One of the pioneering flagships of Portland's modern music history.",
    contactEmail: "dandys@warholsbooking.com",
    contactPhone: "(503) 555-0925",
    website: "www.dandywarhols.com",
    experienceLevel: "National Act"
  },
  {
    id: "portugal-the-man",
    name: "Portugal. The Man",
    genres: ["Indie Pop", "Psychedelic Pop", "Alternative Rock"],
    city: "Portland, OR",
    bio: "Grammy-winning psych-pop icons with driving basslines, stellar horn hook arrays, and soaring vocals. Originally from Alaska but long-time Portland mainstays with a massive local legacy.",
    contactEmail: "booking@portugaltheman.com",
    contactPhone: "Inquire",
    website: "www.portugaltheman.com",
    experienceLevel: "National Act"
  },
  {
    id: "pink-martini",
    name: "Pink Martini",
    genres: ["Chamber Jazz", "Classical Pop", "Latin", "Lounge"],
    city: "Portland, OR",
    bio: "A multi-lingual, multi-genre 'little orchestra' blending jazz, classical, and retro pop melodies. Legendary global touring outfit with incredible stage orchestrations and stellar brass players.",
    contactEmail: "booking@pinkmartini.com",
    contactPhone: "(503) 224-8422",
    website: "www.pinkmartini.com",
    experienceLevel: "National Act"
  },
  {
    id: "everclear-band",
    name: "Everclear",
    genres: ["Grunge", "Power Pop", "90s Rock"],
    city: "Portland, OR",
    bio: "Classic 90s alternative rock standard-bearers led by Art Alexakis. Bringing high-voltage storytelling, anthemic post-grunge riffs, and memorable rock radio hook structures.",
    contactEmail: "info@everclearbooking.com",
    contactPhone: "Inquire",
    website: "www.everclearmusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "the-thermals-band",
    name: "The Thermals",
    genres: ["Indie Punk", "Post-Punk", "Power Pop"],
    city: "Portland, OR",
    bio: "Lo-fi post-pop indie punk powerhouse led by Hutch Harris and Kathy Foster. Delivering rapid, energetic three-chord anthems, religious metaphors, and raw, high-tempo floor vibrations.",
    contactEmail: "booking@thethermals.com",
    contactPhone: "Inquire",
    website: "www.thethermals.com",
    experienceLevel: "National Act"
  },
  {
    id: "elliott-smith-legacy",
    name: "Elliott Smith Legacy Ensemble",
    genres: ["Singer-Songwriter", "Indie Folk", "Acoustic Pop"],
    city: "Portland, OR",
    bio: "A rotating collective of verified local musicians celebrating the iconic catalog and fingerpicking wizardry of Elliott Smith. Highly moving acoustic guitar and piano performances.",
    contactEmail: "smithensemble@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "dead-moon-band",
    name: "Dead Moon Legacy Trio",
    genres: ["Garage Punk", "Lo-Fi Rock", "D.I.Y."],
    city: "Portland, OR",
    bio: "Monolithic raw garage-punk legends, celebrated via collaborative legacy shows featuring high-intensity fuzz, punk rock resilience, and pure Pacific Northwest garage rock attitude.",
    contactEmail: "info@deadmoonlegacy.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "wipers-band",
    name: "Wipers Legacy",
    genres: ["Post-Punk", "Punk Rock", "Grunge Roots"],
    city: "Portland, OR",
    bio: "Commemorating Greg Sage's foundational post-punk trio that heavily inspired Nirvana, featuring distorted guitar lines, moody lyrics, and tightly-knit punk-groove bass setups.",
    contactEmail: "sagepostpunk@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "horse-feathers-band",
    name: "Horse Feathers",
    genres: ["Chamber Folk", "Indie Acoustic", "Americana"],
    city: "Portland, OR",
    bio: "Justin Ringle's sweeping acoustic folk ensemble combining delicate acoustic fingerpicking, layered string cello arrangements, and gorgeous, driving percussion grooves.",
    contactEmail: "booking@horsefeathersmusic.com",
    contactPhone: "(503) 555-8931",
    website: "www.horsefeathersmusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "blind-pilot-band",
    name: "Blind Pilot",
    genres: ["Indie Folk", "Americana", "Chamber Pop"],
    city: "Portland, OR",
    bio: "Warm, widescreen folk-pop led by Israel Nebeker and Ryan Dobrowski. Known for dynamic vocal harmonies, pristine acoustic guitars, trumpet flourishes, and deep storytelling.",
    contactEmail: "booking@blindpilot.com",
    contactPhone: "Inquire",
    website: "www.blindpilot.com",
    experienceLevel: "National Act"
  },
  {
    id: "grouper-artist",
    name: "Grouper",
    genres: ["Ambient", "Dream Pop", "Lo-Fi Folk", "Drone"],
    city: "Portland, OR",
    bio: "Liz Harris performs ethereal, delicate solo acoustic loops, heavy analog tape delay vocals, and gorgeous, echoing tape hiss tape loops. A highly intimate listening experience.",
    contactEmail: "grouperbooking@kranky.net",
    contactPhone: "Inquire",
    experienceLevel: "National Act"
  },
  {
    id: "parenthetical-girls",
    name: "Parenthetical Girls",
    genres: ["Orchestral Pop", "Experimental Indie", "Chamber Pop"],
    city: "Portland, OR",
    bio: "Theatrical, highly stylistic avant-pop led by Zac Pennington. Packed with sweeping string quartets, dramatic vibraphones, and emotional, high-register vocal narratives.",
    contactEmail: "parentheticalbooking@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "quasi-band",
    name: "Quasi",
    genres: ["Indie Rock", "Noise Rock", "Power Pop"],
    city: "Portland, OR",
    bio: "Preeminent dual rocket-power duo of Sam Coomes and Janet Weiss. Blistering distorted Roxichord feedback, massive virtuosic drum syncopations, and highly sarcastic lyrics.",
    contactEmail: "booking@quasipdx.net",
    contactPhone: "Inquire",
    website: "www.thebandquasi.com",
    experienceLevel: "National Act"
  },
  {
    id: "stephen-malkmus-jicks",
    name: "Stephen Malkmus and the Jicks",
    genres: ["Indie Rock", "Post-Punk", "Psychedelic Rock"],
    city: "Portland, OR",
    bio: "Pavement's iconic frontman Stephen Malkmus leads this Portland powerhouse, weaving winding guitar solos, clever wordplay, and loose, highly infectious garage rock rhythms.",
    contactEmail: "jicks@malkmusbooking.com",
    contactPhone: "Inquire",
    website: "www.stephenmalkmus.com",
    experienceLevel: "National Act"
  },
  {
    id: "menomena-band",
    name: "Menomena",
    genres: ["Experimental Rock", "Indie Rock", "Art Rock"],
    city: "Portland, OR",
    bio: "Highly unique experimental rock project utilize their custom computer songwriting program (DeSoto) alongside prominent saxophones, piano scales, and intricate percussion patterns.",
    contactEmail: "menomenabooking@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "National Act"
  },
  {
    id: "chromatics-band",
    name: "Chromatics Dream Project",
    genres: ["Italo Disco", "Synthwave", "Dream Pop"],
    city: "Portland, OR",
    bio: "Paying homage to the historic Italians Do It Better synthpop masterminds, crafting icy synthesizers, ticking drum machines, and ultra-dreamy vocals perfect for dim stage lighting.",
    contactEmail: "chromatics@italodisco.org",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "laura-veirs-singer",
    name: "Laura Veirs",
    genres: ["Indie Folk", "Singer-Songwriter", "Acoustic"],
    city: "Portland, OR",
    bio: "Exceptional flatpicking virtuoso and lyrical storyteller. Weaving delicate natural metaphors with pristine, complex acoustic accompaniments and deep chamber orchestrations.",
    contactEmail: "veirs@laurabooking.net",
    contactPhone: "Inquire",
    website: "www.lauraveirs.com",
    experienceLevel: "National Act"
  },
  {
    id: "mirah-music",
    name: "Mirah",
    genres: ["Indie Pop", "Acoustic Folk", "Lo-Fi"],
    city: "Portland, OR",
    bio: "Intimate and prolific lo-fi pop legend featuring acoustic folk arrangements, gorgeous horn layers, and sweet, whispering vocal lines that resonate with absolute sincerity.",
    contactEmail: "mirahbooking@kmail.com",
    contactPhone: "Inquire",
    website: "www.mirahmusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "unto-others",
    name: "Unto Others",
    genres: ["Goth Metal", "Heavy Metal", "Post-Punk"],
    city: "Portland, OR",
    bio: "Pioneering goth-infused heavy metal (formerly Idle Hands). Merging soaring metal vocals, galloping twin-guitar riffs, and moody post-punk bass drives. Outstanding live performance presence.",
    contactEmail: "untoothers@metalbooking.net",
    contactPhone: "Inquire",
    website: "www.untoothers.us",
    experienceLevel: "National Act"
  },
  {
    id: "dying-wish",
    name: "Dying Wish",
    genres: ["Metalcore", "Hardcore", "Heavy Metal"],
    city: "Portland, OR",
    bio: "Searing modern metalcore powerhouse fronted by Emma Boster. Combines blisteringly heavy breakdowns, screaming vocals, and highly melodic, clean twin-guitar leads.",
    contactEmail: "booking@dyingwishhardcore.com",
    contactPhone: "Inquire",
    website: "https://www.dyingwishband.com",
    musicUrl: "https://dyingwishband.bandcamp.com",
    experienceLevel: "National Act"
  },
  {
    id: "uada-band",
    name: "Uada",
    genres: ["Melodic Black Metal", "Heavy Metal"],
    city: "Portland, OR",
    bio: "Hooded melodic black metal titans with soaring dual lead guitars, pounding drums, and atmospheric screams. Highly theatrical, foggy stage setup that sells out heavy rooms.",
    contactEmail: "uada@blackmetalpdx.com",
    contactPhone: "Inquire",
    experienceLevel: "National Act"
  },
  {
    id: "vitriol-band",
    name: "Vitriol",
    genres: ["Death Metal", "Extreme Metal"],
    city: "Portland, OR",
    bio: "Hyper-speed extreme metal quartet bringing unmatched ferocity, complex shredding, and heavy double-bass drum onslaughts. Leaders in the Pacific Northwest extreme metal revival.",
    contactEmail: "vitriolextreme@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "the-portland-cello-project",
    name: "Portland Cello Project",
    genres: ["Cello Instrumental", "Chamber Classical", "Covers"],
    city: "Portland, OR",
    bio: "A diverse cello ensemble making classical music accessible by performing chamber interpretations of hip hop, rock, and pop hits alongside cinematic orchestral compositions.",
    contactEmail: "celloproject@pdxmusic.org",
    contactPhone: "(503) 555-5544",
    website: "www.portlandcelloproject.com",
    experienceLevel: "National Act"
  },
  {
    id: "richmond-fontaine",
    name: "Richmond Fontaine Ensemble",
    genres: ["Alt-Country", "Americana", "Indie Rock"],
    city: "Portland, OR",
    bio: "Willy Vlautin's cinematic singer-songwriter collective, mapping gritty, blue-collar American stories over warm acoustic steel-guitar delays and driving country rhythms.",
    contactEmail: "info@richmondfontaine.com",
    contactPhone: "Inquire",
    website: "www.richmondfontaine.com",
    experienceLevel: "National Act"
  },
  {
    id: "genders-band",
    name: "Genders",
    genres: ["Dream Pop", "Shoegaze", "Indie Rock"],
    city: "Portland, OR",
    bio: "A highly dynamic four-piece blending swirling shoegaze guitars, dreamy, soaring vocal phrasing, and complex progressive rhythm structures. Incredible, highly professional live guitarists.",
    contactEmail: "gendersband@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "sallie-ford",
    name: "Sallie Ford & The Sound Outside",
    genres: ["Rockabilly", "Retro Soul", "Garage Rock"],
    city: "Portland, OR",
    bio: "Sallie Ford's powerhouse vintage rockabilly and retro soul quartet, featuring incredible rasping vocals, warm tube guitar tremolos, and exceptional 1950s rock-and-roll tempos.",
    contactEmail: "sallieford@booking.com",
    contactPhone: "Inquire",
    experienceLevel: "National Act"
  },
  {
    id: "fruit-bats",
    name: "Fruit Bats",
    genres: ["Indie Folk", "Cosmic Americana", "Indie Pop"],
    city: "Portland, OR",
    bio: "The beloved project of Eric D. Johnson, delivering breezy acoustic guitar lines, sunny vocal melodies, and a joyful folk-pop warmth that fills theater halls effortlessly.",
    contactEmail: "fruitbats@bighassle.com",
    contactPhone: "Inquire",
    website: "www.fruitbatsmusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "the-minders",
    name: "The Minders",
    genres: ["Elephant 6 Pop", "Indie Pop", "Retro Psych"],
    city: "Portland, OR",
    bio: "Venerable Elephant 6 recording collective mainstays delivering highly catchy 60s style psych-pop, fuzzy electric organs, and brilliant melodic vocals that delight indie crowds.",
    contactEmail: "minders@elephant6.org",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "the-epoxies",
    name: "The Epoxies Legacy",
    genres: ["New Wave Punk", "Synthpunk", "Ska"],
    city: "Portland, OR",
    bio: "Fusing fuzzy retro arcade synthesizers with hyperactive pop punk guitar rants and sci-fi neon stage visuals. Full of extremely fast-paced synthpop melodies.",
    contactEmail: "epoxiespunk@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "hockey-band",
    name: "Hockey",
    genres: ["Dance Punk", "Indie Rock", "Synthpop"],
    city: "Portland, OR",
    bio: "Highly energetic indie disco and dance punk. Combining funky bass slaps, rhythmic vocal deliveries, and heavy keyboard patterns that get venue rooms moving immediately.",
    contactEmail: "hockeyband@booking.net",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "hillstomp-band",
    name: "Hillstomp",
    genres: ["North Mississippi Hill Country Blues", "Junkabilly"],
    city: "Portland, OR",
    bio: "A wild, energetic two-piece playing dirty bottleneck slide guitar, buckets and brake drums percussion, and high-energy foot-stomping junkabilly blues. Exceptional pub appeal.",
    contactEmail: "booking@hillstomp.com",
    contactPhone: "Inquire",
    website: "www.hillstomp.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "mean-jeans",
    name: "Mean Jeans",
    genres: ["Pop Punk", "Ramonescore", "Garage Punk"],
    city: "Portland, OR",
    bio: "High-octane, goofy, and extremely fast three-piece pop punk. Fusing party anthems, lightning-fast guitar chords, and massive, hooky chorus shout-alongs.",
    contactEmail: "meanjeans@dirtnaprecords.com",
    contactPhone: "Inquire",
    website: "www.meanjeans.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "rare-monk",
    name: "Rare Monk",
    genres: ["Indie Rock", "Post-Punk", "Violin Indie"],
    city: "Portland, OR",
    bio: "Merging driving, moody post-punk bass drives with lush classical violin solos, crisp electric guitar feedback, and atmospheric vocals. A captivating presence in Pacific Northwest clubs.",
    contactEmail: "raremonk@gmail.com",
    contactPhone: "Inquire",
    website: "www.raremonk.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "radiation-city",
    name: "Radiation City Trio",
    genres: ["Dream Pop", "Space-Age Lounge", "Indie Rock"],
    city: "Portland, OR",
    bio: "Glistening retro-futuristic dream pop. Melodious five-part harmonies, shimmering vibraphone loops, cozy vintage rhodes keys, and brilliant acoustic pop dynamics.",
    contactEmail: "radcitybooking@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "grails-band",
    name: "Grails",
    genres: ["Post-Rock", "Instrumental Psych", "Experimental"],
    city: "Portland, OR",
    bio: "Cinematic, dark instrumental rock weaving elements of traditional psych-rock, world music instrumentation, and dense tape collage soundscapes. Exceptionally high-vibe stage presence.",
    contactEmail: "grails@temporaryresidence.com",
    contactPhone: "Inquire",
    website: "www.grails.com",
    experienceLevel: "National Act"
  },
  {
    id: "danava-band",
    name: "Danava",
    genres: ["Heavy Psych", "Hard Rock", "Proto-Metal"],
    city: "Portland, OR",
    bio: "Out-of-this-world heavy psych-metal masters delivering blistering triple-guitar leads, rapid synthesizer sirens, and 70s space-rock speed jams. Mind-expanding live spectacle.",
    contactEmail: "danavaband@yahoo.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "priory-band",
    name: "Priory",
    genres: ["Indie Pop", "Synthpop", "Electronic"],
    city: "Portland, OR",
    bio: "Shimmering, commercial-grade indie pop featuring driving electronic sub bass, sweeping vocal falsettos, and massive cinematic choruses designed for large-capacity rooms.",
    contactEmail: "booking@prioryband.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "the-kingsmen",
    name: "The Kingsmen Legacy",
    genres: ["Garage Rock", "60s Rock", "Louie Louie"],
    city: "Portland, OR",
    bio: "The legendary garage-rock pioneers of Portland, celebrating the raw, shouting 1963 classic 'Louie Louie'. Featuring highly nostalgic, driving, organ-infused classic 60's rock.",
    contactEmail: "booking@kingsmenlegacy.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "exploding-hearts",
    name: "Exploding Hearts Legacy",
    genres: ["Power Pop", "Garage Punk"],
    city: "Portland, OR",
    bio: "A loving local tribute performing the legendary catalog of Portland's power pop masterpieces, featuring crisp melodic guitars, punchy fast rhythms, and classic rock-and-roll heart.",
    contactEmail: "explodingtribute@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "glasser-band",
    name: "Glasser Duo",
    genres: ["Dream Pop", "Electronic Beats", "Avant-Garde"],
    city: "Portland, OR",
    bio: "Ethereal avant-pop led by intricate computerized vocal looping patterns, warm analog synthesizers, and sweeping wooden ambient percussion layers. Perfect for intimate galleries.",
    contactEmail: "glasserbooking@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "blouse-band",
    name: "Blouse",
    genres: ["Dream Pop", "Shoegaze", "Lo-Fi Indie"],
    city: "Portland, OR",
    bio: "Captured on Captured Tracks, Blouse blends icy, nostalgic synthesizers with warm vintage electric guitar delays and detached, angelic bedroom-pop vocal lines.",
    contactEmail: "blouse@capturedtracks.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "amine-artist",
    name: "Amine Tribute Project",
    genres: ["Hip Hop", "Indie Rap", "Trap Beats"],
    city: "Portland, OR",
    bio: "Local hip hop orchestrations celebration modeled after Aminé's bright, visual, and highly charismatic modern rap classics. Live instrumentation meeting warm backing tracks.",
    contactEmail: "booking@aminetribute.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "heatmiser-band",
    name: "Heatmiser Legacy Ensemble",
    genres: ["Grunge", "90s Indie Rock"],
    city: "Portland, OR",
    bio: "Commemorating the heavy, dual-guitar grunge-pop catalog of Heatmiser (Elliott Smith and Neil Gust). Relive the driving indie energy, abrasive vocals, and sweeping chords.",
    contactEmail: "heatmiserlegacy@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "tony-starlight",
    name: "The Tony Starlight Show",
    genres: ["Lounge Jazz", "Vocal Standards", "Comedy"],
    city: "Portland, OR",
    bio: "Portland's beloved musical comedy and lounge jazz standard host, delivering nostalgic vocal jazz covers, dynamic comedy routines, and incredible high-capacity dinner parlor entertainment.",
    contactEmail: "booking@tonystarlight.com",
    contactPhone: "(503) 555-4011",
    website: "www.tonystarlight.com",
    experienceLevel: "Local"
  },
  {
    id: "hazel-band",
    name: "Hazel Tribute",
    genres: ["90s Emo", "Indie Rock", "Power Pop"],
    city: "Portland, OR",
    bio: "A highly dynamic celebration of Portland's legendary Sub Pop grunge band. Driven by frantic duel vocals, distorted guitar lines, and absolute high-tempo garage energy.",
    contactEmail: "hazeltribute@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "the-cozy-slate",
    name: "The Cozy Slate Duo",
    genres: ["Cozy Folk", "Acoustic Pop", "Singer-Songwriter"],
    city: "Portland, OR",
    bio: "Subtle fingerstyle guitarists capturing acoustic magic under warm stage lighting. Perfect for dim listening rooms and small capacity bars.",
    contactEmail: "cozyslateduo@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "velvet-highway",
    name: "Velvet Highway",
    genres: ["Psychedelic Country", "Outlaw Folk", "Americana"],
    city: "Portland, OR",
    bio: "Sweeping pedal steel guitars, acoustic guitar delay, and warm four-part country vocals. Evokes rainy highway drives and cozy PNW saloons.",
    contactEmail: "velvethighway@outlook-booking.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "pdx-jazz-trio",
    name: "The Portland City Jazz Trio",
    genres: ["Bebop Jazz", "Cool Jazz", "Lounge Standards"],
    city: "Portland, OR",
    bio: "Pristine double-bass, vintage rhodes piano, and sweeping jazz drums. Perfect for high-capacity lounge events and jazz galleries.",
    contactEmail: "jazzpdx@booking.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "the-rain-makers",
    name: "The Rain Makers",
    genres: ["Dreampop", "Shoegaze", "Ambient Rock"],
    city: "Portland, OR",
    bio: "Ethereal delayed shoegaze guitars, deep synth bass vibrations, and angelic melodic vocals. Evoking cozy misty mornings and northwest evergreens.",
    contactEmail: "rainmakersband@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "bridges-of-stjohns",
    name: "Bridges of St. Johns",
    genres: ["Classic Bluegrass", "Americana Picking", "Folk"],
    city: "Portland, OR",
    bio: "Incredible four-piece bluegrass picking circle featuring pristine banjo, stand-up bass, and mandolin playing. Outstanding pub draw and high-tempo outdoor lawn appeal.",
    contactEmail: "stjohnsbluegrass@yahoo.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "fleet-foxes-tribute",
    name: "Fleet Foxes Legacy Choir",
    genres: ["Indie Folk", "Chamber Pop", "Vocal Harmonies"],
    city: "Seattle, WA",
    bio: "A grand acoustic and vocal performance celebrating the iconic, lush harmony structures, acoustic guitar pickings, and pastoral nature elements of the original Fleet Foxes catalog.",
    contactEmail: "booking@fleetchoirpdx.org",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "death-cab-tribute",
    name: "The Photo Album (Death Cab Tribute)",
    genres: ["Indie Rock", "Emo Pop", "Alternative"],
    city: "Seattle, WA",
    bio: "Tracing the early 2000s catalog of moody guitars, motoric bass rhythms, and beautiful lyrical storytelling that shaped the sound of modern Northwest alternative music.",
    contactEmail: "booking@photoalbumtribute.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "sunny-day-real-estate",
    name: "Sunny Day Real Estate Tributary",
    genres: ["Midwest Emo", "Post-Hardcore", "Alternative Rock"],
    city: "Seattle, WA",
    bio: "Capturing the raw tension, cascading guitar notes, and explosive vocal hooks of the seminal 90s Sub Pop emo pioneers. Pure emotional alternative power.",
    contactEmail: "sdretribute@emo-seattle.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "pedro-the-lion-project",
    name: "Pedro the Lion Legacy Project",
    genres: ["Indie Rock", "Slowcore", "Singer-Songwriter"],
    city: "Seattle, WA",
    bio: "Celebrating David Bazan's rich catalog of heavily distorted bass melodies, honest confessionals, and slow-core indie rock structures. Driven by pure storytelling.",
    contactEmail: "bazantribute@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "postal-service-legacy",
    name: "The Postal Service Tribute",
    genres: ["Indie Pop", "Electronic Beats", "Synthpop"],
    city: "Seattle, WA",
    bio: "Electronic backing beats meets warm indie vocals. Celebrating the iconic 'Give Up' record with glitched synth pads, analogue drums, and gorgeous melodic harmonies.",
    contactEmail: "booking@giveuptribute.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "murder-city-devils",
    name: "Murder City Devils Legacy",
    genres: ["Garage Punk", "Organ Rock", "Post-Punk"],
    city: "Seattle, WA",
    bio: "Blistering retro-punk featuring a grinding Farfisa electronic organ, heavy distortion bar chord riffs, and shouting energetic vocals. Searing garage club aesthetics.",
    contactEmail: "mcd@punkseattle.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "rocky-votolato",
    name: "Rocky Votolato Duo",
    genres: ["Indie Folk", "Acoustic Pop", "Singer-Songwriter"],
    city: "Seattle, WA",
    bio: "Pristine fingerpicking folk narratives with raspy, raw real-life vocals and a warm harmonica. Highly intimate rooms, small capacity bars, and coffeehouse chambers.",
    contactEmail: "booking@rockyvotolato.net",
    contactPhone: "Inquire",
    website: "www.rockyvotolato.com",
    experienceLevel: "National Act"
  },
  {
    id: "band-of-horses-tribute",
    name: "Band of Horses Tribute",
    genres: ["Cosmic Americana", "Indie Rock", "Reverb Pop"],
    city: "Seattle, WA",
    bio: "Massive twin guitar delays, stadium-sized vocal reverbs, and catchy southern-alternative hooks. Bringing the starry night feelings perfectly.",
    contactEmail: "boh@reverbrocks.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "car-seat-headrest-legacy",
    name: "Car Seat Headrest Tribute",
    genres: ["Lo-Fi Indie", "Noise Pop", "Garage Rock"],
    city: "Seattle, WA",
    bio: "Winding, multi-part guitar jams, deadpan vocals, and massive, fuzzy indie choruses. Emulating the Bandcamp lo-fi bedroom recording era perfectly.",
    contactEmail: "csh@lofi-booking.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "minus-the-bear-tribute",
    name: "Minus the Bear Tribute Project",
    genres: ["Math Rock", "Indie Rock", "Synth Rock"],
    city: "Seattle, WA",
    bio: "Incredible dynamic guitar tapping tricks, electronic synth bass lines, and precise, high-tempo drum sequences that celebrate the beloved catalog of MTB.",
    contactEmail: "booking@mtbtribute.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "head-and-the-heart-tribute",
    name: "The Head & The Heart Tribute",
    genres: ["Indie Folk", "Acoustic Pop", "Chamber Folk"],
    city: "Seattle, WA",
    bio: "Stomp-and-clap acoustic folk rhythms, soaring fiddle flights, and gorgeous boy-girl dual vocal arrangements that recall warm Northwest summer days.",
    contactEmail: "hath@folkseattle.org",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "perfume-genius-tribute",
    name: "Perfume Genius Piano Show",
    genres: ["Art Pop", "Avant-Garde", "Chamber Soul"],
    city: "Seattle, WA",
    bio: "Dramatic electric piano, hushed intimate vocals, and sweeping emotional synths celebrating Mike Hadreas' vulnerable pop masterpieces.",
    contactEmail: "perfumepiano@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "porter-ray-band",
    name: "Porter Ray",
    genres: ["Hip Hop", "Alt-Rap", "Cosmic Beats"],
    city: "Seattle, WA",
    bio: "Lyrical streets storytelling with cold vinyl sample loops, jazzy Rhodes piano lines, and a smooth, golden-era Seattle flow.",
    contactEmail: "booking@porterray.com",
    contactPhone: "Inquire",
    website: "www.porterray.com",
    experienceLevel: "National Act"
  },
  {
    id: "sir-mix-a-lot-tribute",
    name: "The Mix-A-Lot Dance Show",
    genres: ["90s Hip Hop", "Bass Rap", "Classic Party Beats"],
    city: "Seattle, WA",
    bio: "A highly explosive, energetic tribute celebrating the pioneering Seattle rap legend and his iconic sub-bass-loaded party anthems.",
    contactEmail: "mixalottribute@partyrap.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "mudhoney-legacy",
    name: "Mudhoney Fuzz Trio",
    genres: ["Grunge", "Garage Rock", "Noise Punk"],
    city: "Seattle, WA",
    bio: "Drenching the room in massive vintage Superfuzz Bigmuff pedal tones, screaming vocals, and raw garage rock rhythms that recall the true Sub Pop roots.",
    contactEmail: "mudhoneyfuzz@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "the-melvins-legacy",
    name: "Melvins Sludge Duo",
    genres: ["Sludge Metal", "Grunge Roots", "Heavy Rock"],
    city: "Seattle, WA",
    bio: "Slowing down massive metal riffs to a grinding, tectonic crush with heavy dual-bass setups and punishing, slow drum beats.",
    contactEmail: "sludgeduo@seattlemetal.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "the-gits-legacy",
    name: "The Gits Tribute Band",
    genres: ["Riot Grrrl", "Punk Rock", "Garage Rock"],
    city: "Seattle, WA",
    bio: "A high-intensity tribute celebrating Mia Zapata's soaring, soulful punk-rock vocals and raw garage punk arrangements.",
    contactEmail: "gitstribute@seattlepunk.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "fastbacks-tribute",
    name: "Fastbacks Tribute",
    genres: ["Pop Punk", "Garage Pop", "Power Pop"],
    city: "Seattle, WA",
    bio: "Extremely speedy, friendly garage pop punk meets brilliant melodic vocal leads and incredibly fast electric guitar solos.",
    contactEmail: "fastbackstribute@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "seven-year-bitch-legacy",
    name: "7 Year Bitch Tribute",
    genres: ["Riot Grrrl", "Punk Rock", "Grunge"],
    city: "Seattle, WA",
    bio: "Raw, angry, uncompromising grunge-punk with slicing guitar dynamics and screaming, powerful female vocals. Highly intense performance.",
    contactEmail: "bitchtribute@punkseattle.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "blue-scholars-tribute",
    name: "Seattle Scholars Tribute",
    genres: ["Hip Hop", "Conscious Rap", "Sample Beats"],
    city: "Seattle, WA",
    bio: "Warm, soul-sampled local hip-hop celebrating Sabzi's pristine production beats and Geologic's incredible socially conscious lyricism.",
    contactEmail: "scholars@consciousrap.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "common-market-tribute",
    name: "Common Market Heritage Set",
    genres: ["Hip Hop", "Boom Bap", "Conscious Rap"],
    city: "Seattle, WA",
    bio: "Boom-bap conscious rap tribute with incredible soulful jazz backing beats, massive sub bass drivers, and tight rapid rap flows.",
    contactEmail: "commonmarket@consciousrap.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "bryan-john-appleby",
    name: "Bryan John Appleby",
    genres: ["Indie Folk", "Chamber Pop", "Singer-Songwriter"],
    city: "Seattle, WA",
    bio: "Orchestral folk-pop songwriter featuring soaring, beautiful acoustic guitar lines, rich string and trumpet arrangements, and stunning boy-girl vocal choruses.",
    contactEmail: "booking@bryanjohnappleby.com",
    contactPhone: "Inquire",
    website: "www.bryanjohnappleby.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "grand-hallway-band",
    name: "Grand Hallway",
    genres: ["Chamber Pop", "Indie Folk", "Orchestral Indie"],
    city: "Seattle, WA",
    bio: "Led by Tomo Nakayama, delivering angelic acoustic falsettos, rich harp and cello backings, and warm, hopeful indie pop melodies.",
    contactEmail: "booking@grandhallway.com",
    contactPhone: "Inquire",
    website: "www.grandhallway.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "great-northwest",
    name: "The Great Northwest Ensemble",
    genres: ["Indie Rock", "Dream Pop", "Ambient"],
    city: "Seattle, WA",
    bio: "Lush synthesized forest textures, delayed acoustic guitar notes, and warm dreamy vocals that capture the misty mystery of the sound.",
    contactEmail: "greatnwensemble@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "hey-marseilles-tribute",
    name: "Hey Marseilles Tribute",
    genres: ["Chamber Pop", "Indie Folk", "Acoustic Pop"],
    city: "Seattle, WA",
    bio: "Widescreen indie chamber pop with acoustic guitar, accordion, cello, and trumpet matching beautiful melodic vocal leads.",
    contactEmail: "heymarseilles@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "ivan-and-alyosha",
    name: "Ivan & Alyosha",
    genres: ["Indie Folk", "Power Pop", "Alternative"],
    city: "Seattle, WA",
    bio: "High-energy, melodic folk-pop quintet with incredible, pristine three-part vocal harmonies and driving, acoustic guitar-pop hooks.",
    contactEmail: "booking@ivanandalyosha.com",
    contactPhone: "(206) 555-3221",
    website: "www.ivanandalyosha.com",
    experienceLevel: "National Act"
  },
  {
    id: "lemolo-band",
    name: "Lemolo",
    genres: ["Dream Pop", "Shoegaze", "Ambient Pop"],
    city: "Seattle, WA",
    bio: "Meagan Grandall's stunning dream pop project. Ethereal piano chords, driving delay guitars, and angelic, soaring vocal phrasing.",
    contactEmail: "booking@lemolomusic.com",
    contactPhone: "Inquire",
    website: "www.lemolomusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "noah-gundersen-band",
    name: "Noah Gundersen Trio",
    genres: ["Singer-Songwriter", "Indie Folk", "Chamber Folk"],
    city: "Seattle, WA",
    bio: "Introspective acoustic singer-songwriter featuring beautiful, fragile fingerpicked guitar patterns, soaring emotional vocals, and gorgeous string cellos.",
    contactEmail: "booking@noahgundersen.com",
    contactPhone: "(206) 555-5511",
    website: "www.noahgundersen.com",
    experienceLevel: "National Act"
  },
  {
    id: "pickwick-band",
    name: "Pickwick",
    genres: ["Garage Soul", "R&B", "Indie Rock"],
    city: "Seattle, WA",
    bio: "High-energy retro garage soul led by Galen Disston's screaming vocal acrobatics, fuzzy electric keys, and punchy, tight rhythm sections.",
    contactEmail: "booking@pickwickmusic.com",
    contactPhone: "Inquire",
    website: "www.pickwickmusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "rose-windows-tribute",
    name: "Rose Windows Tribute",
    genres: ["Psychedelic Rock", "Folk Rock", "Experimental"],
    city: "Seattle, WA",
    bio: "Epic, heavy psychedelic folk combining massive organ riffs, sweeping classical flute, dual fuzzy guitars, and powerful, bluesy female vocals.",
    contactEmail: "rosewindowstribute@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "say-hi-band",
    name: "Say Hi",
    genres: ["Indie Rock", "Synthpop", "Lo-Fi Indie"],
    city: "Seattle, WA",
    bio: "Eric Elbogen's charming one-man synth-pop project, utilizing vintage home electronic drum pads, fuzzy synthesizers, and highly sarcastic vocals.",
    contactEmail: "booking@sayhimusic.com",
    contactPhone: "Inquire",
    website: "www.sayhimusic.com",
    experienceLevel: "National Act"
  },
  {
    id: "sinking-ships",
    name: "Sinking Ships Legacy",
    genres: ["Melodic Hardcore", "Punk Rock"],
    city: "Seattle, WA",
    bio: "A fast, energetic tribute playing melodic hardcore, frantic tempos, pounding floor drums, and massive gang vocal choruses.",
    contactEmail: "sinkingshipstribute@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "spanish-coasts",
    name: "Spanish Coasts",
    genres: ["Shoegaze", "Indie Rock", "Post-Punk"],
    city: "Seattle, WA",
    bio: "Swirling, chorus-drenched electric guitar loops, deep motoric bass drives, and dream pop vocal overlays designed for dim club lighting.",
    contactEmail: "coastsband@outlook.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "the-maldives-band",
    name: "The Maldives",
    genres: ["Alt-Country", "Roots Rock", "Americana"],
    city: "Seattle, WA",
    bio: "A legendary, widescreen seven-piece country rock collective led by Jason Dodson. Rich with dual pedal-steel chords, heavy twin-guitar solos, and powerful folk hooks.",
    contactEmail: "booking@themaldives.com",
    contactPhone: "(206) 555-4422",
    website: "www.themaldives.net",
    experienceLevel: "National Act"
  },
  {
    id: "the-physics-tribute",
    name: "The Physics Rap Tribute",
    genres: ["Hip Hop", "Jazzy Beats", "Boom Bap"],
    city: "Seattle, WA",
    bio: "Recreating the incredibly smooth, jazzy hip-hop flows, live brass instrumentation, and soulful melodic hooks of Seattle's premier golden-era rap project.",
    contactEmail: "physicstribute@consciousrap.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "thee-satisfaction-legacy",
    name: "Thee Satisfaction Heritage",
    genres: ["Afrofuturism", "Neo-Soul", "Alternative R&B"],
    city: "Seattle, WA",
    bio: "Cosmic neo-soul and experimental hip hop celebrating warm electronic percussion layers, smooth rhodes pads, and positive, forward-thinking lyrics.",
    contactEmail: "theesat@subpop.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "thunderpussy-band",
    name: "Thunderpussy",
    genres: ["Hard Rock", "Arena Rock", "Glam Rock"],
    city: "Seattle, WA",
    bio: "High-octane rock and roll spectacle led by Molly Sideburn's theatrical gymnastics, screaming Les Paul slide solos, and bombastic arena drums.",
    contactEmail: "booking@thunderpussyusa.com",
    contactPhone: "(206) 555-9011",
    website: "www.thunderpussyusa.com",
    experienceLevel: "National Act"
  },
  {
    id: "cataldo-band",
    name: "Cataldo",
    genres: ["Indie Pop", "Chamber Pop", "Indie Rock"],
    city: "Seattle, WA",
    bio: "Eric Anderson's lush indie-pop project, weaving intricate horn arrangements, acoustic guitars, and witty, hyper-literate, heart-on-sleeve lyricism.",
    contactEmail: "booking@cataldoband.com",
    contactPhone: "Inquire",
    website: "www.cataldomusic.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "black-breath-band",
    name: "Black Breath Tribute",
    genres: ["Death Metal", "Crust Punk", "Hardcore"],
    city: "Seattle, WA",
    bio: "Punishing death-crust sludge riffs using HM-2 guitar pedals, super-heavy blast beats, and growling, cavernous vocal rants.",
    contactEmail: "blackbreath@extremebooking.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "helms-alee-band",
    name: "Helms Alee",
    genres: ["Sludge Metal", "Noise Rock", "Post-Hardcore"],
    city: "Seattle, WA",
    bio: "Searing, complex noise rock and metal trio. Mind-bending polyrythms, heavy fuzz bass leads, and haunting three-way vocal harmonies.",
    contactEmail: "helmsalee@kranky.net",
    contactPhone: "Inquire",
    website: "www.helmsalee.net",
    experienceLevel: "National Act"
  },
  {
    id: "sandrider-band",
    name: "Sandrider",
    genres: ["Heavy Rock", "Sludge", "Grunge"],
    city: "Seattle, WA",
    bio: "Absolutely physical heavy rock trio creating massive stadium-sized guitar hook loops, pummeling dbeat drums, and intense headbanging energy.",
    contactEmail: "sandrider@metal-seattle.org",
    contactPhone: "Inquire",
    website: "www.sandrider.bandcamp.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "who-is-she-band",
    name: "Who Is She?",
    genres: ["Pop Pink", "Garage Pop", "Indie Pop"],
    city: "Seattle, WA",
    bio: "Indie supergroup featuring members of Chastity Belt and Tacocat, delivering charming lo-fi pop-punk melodies, acoustic synths, and sweet lyrics.",
    contactEmail: "whoisshe@gmaill.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "dude-york-band",
    name: "Dude York",
    genres: ["Power Pop", "Indie Rock", "Grunge Pop"],
    city: "Seattle, WA",
    bio: "Catchy alternative rock power pop delivering high-energy energetic chorus lines, melodic garage guitars, and absolute high-tempo club appeal.",
    contactEmail: "dudeyork@subpop.com",
    contactPhone: "Inquire",
    website: "www.dudeyork.com",
    experienceLevel: "National Act"
  },
  {
    id: "the-swearengens",
    name: "The Swearengens",
    genres: ["Outlaw Country", "Alt-Country", "Honky Tonk"],
    city: "Seattle, WA",
    bio: "Seattle's premier hard-drinking honky tonk and country-country band. Heavy pedal steel slides, acoustic guitar rants, and outlaw barroom charm.",
    contactEmail: "swearengens@outlook.com",
    contactPhone: "Inquire",
    website: "www.theswearengens.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "black-tones",
    name: "The Black Tones",
    genres: ["Blues Rock", "Garage Rock", "Grunge"],
    city: "Seattle, WA",
    bio: "Fronted by twins Eva and Cedric Walker. Delivering high-octane blues riffs, gritty garage rock power, and outstanding high-energy room draw.",
    contactEmail: "booking@theblacktones.com",
    contactPhone: "Inquire",
    website: "www.theblacktones.com",
    experienceLevel: "National Act"
  },
  {
    id: "smokey-brights",
    name: "Smokey Brights",
    genres: ["Indie Rock", "Retro Pop", "Alternative"],
    city: "Seattle, WA",
    bio: "Husband-and-wife fronted fuzzy pop-rock quintet with sweeping twin vocals, warm synth organs, and stellar retro guitar solos.",
    contactEmail: "booking@smokeybrights.com",
    contactPhone: "(206) 555-3311",
    website: "www.smokeybrights.com",
    experienceLevel: "National Act"
  },
  {
    id: "acid-tongue-band",
    name: "Acid Tongue",
    genres: ["Psychedelic Rock", "Garage Pop", "Soul Rock"],
    city: "Seattle, WA",
    bio: "Lush psychedelic pop fused with heavy soul-rock vocals, retro organ pads, and sunny fuzzy guitar hooks. Perfect for high-capacity venue dancefloors.",
    contactEmail: "acidtongue@freakoutrec.com",
    contactPhone: "Inquire",
    website: "www.acidtongueusa.com",
    experienceLevel: "National Act"
  },
  {
    id: "tres-leches-band",
    name: "Tres Leches",
    genres: ["Art Punk", "Indie Rock", "Post-Punk"],
    city: "Seattle, WA",
    bio: "Dynamic bilingual art-punk trio switching musical instruments mid-set. Blending complex math-rock beats, fuzzy baseline, and rich post-punk grooves.",
    contactEmail: "tresleches@punkseattle.com",
    contactPhone: "Inquire",
    website: "www.tresleches.bandcamp.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "coach-phillips-band",
    name: "Coach Phillips",
    genres: ["Indie Rock", "Emo Pop", "Dream Pop"],
    city: "Seattle, WA",
    bio: "Sweeping twin guitar indie pop featuring melodic emo narrative lyrics, warm chorus lines, and incredibly dynamic local appeal.",
    contactEmail: "coachphillips@gmaill.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "special-explosion-band",
    name: "Special Explosion",
    genres: ["Slowcore", "Indie Rock", "Dream Pop"],
    city: "Seattle, WA",
    bio: "Widescreen, atmospheric indie rock and dream pop featuring slow-building guitar delay feedback loops, cozy synth pads, and delicate melodies.",
    contactEmail: "specialexplosion@outlook.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "pigs-on-the-wing",
    name: "Pigs on the Wing",
    genres: ["Classic Rock", "Psychedelic Rock", "Pink Floyd Tribute"],
    city: "Portland, OR",
    bio: "Portland's premier Pink Floyd tribute band, capturing the raw energy of Pink Floyd's 1970s arena era with spectacular visual lighting and pristine sonic fidelity.",
    contactEmail: "booking@pigsmusic.link",
    contactPhone: "Inquire",
    website: "www.pigsmusic.link",
    experienceLevel: "Regional Tour"
  },
  {
    id: "life-during-wartime",
    name: "Life During Wartime",
    genres: ["Talking Heads Tribute", "Funk", "New Wave"],
    city: "Portland, OR",
    bio: "A high-energy Talking Heads tribute, delivering the choreography, big suits, and deep-groove funk instrumentation of the Stop Making Sense era.",
    contactEmail: "booking@lifewartimepdx.com",
    contactPhone: "(503) 555-5343",
    website: "www.lifewartimepdx.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "taken-by-the-sky",
    name: "Taken by the Sky",
    genres: ["Fleetwood Mac Tribute", "Classic Rock", "Vocal Pop"],
    city: "Portland, OR",
    bio: "A gorgeous Fleetwood Mac tribute capturing the pristine folk-rock harmonies, exquisite lead guitar solos, and dramatic stage presence of the Rumours era.",
    contactEmail: "takenbythesky@gmaill.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "erotic-city-prince",
    name: "Erotic City",
    genres: ["Prince Tribute", "Funk", "Pop", "R&B"],
    city: "Portland, OR",
    bio: "Portland's legendary multi-decade Prince tribute show, bringing the high-pitched falsettos, stunning purple suits, and incredible guitar shredding of the Purple One.",
    contactEmail: "info@eroticcitypdx.org",
    contactPhone: "(503) 555-1999",
    website: "www.eroticcitypdx.org",
    experienceLevel: "National Act"
  },
  {
    id: "petty-fever-tribute",
    name: "Petty Fever",
    genres: ["Tom Petty Tribute", "Heartland Rock", "Classic Rock"],
    city: "Portland, OR",
    bio: "An award-winning Tom Petty tribute that delivers high-fidelity anthems with pristine vocal execution and classic Rickenbacker guitar tones.",
    contactEmail: "booking@pettyfever.net",
    contactPhone: "(503) 555-7388",
    website: "www.pettyfever.net",
    experienceLevel: "National Act"
  },
  {
    id: "garcia-birthday-band",
    name: "Garcia Birthday Band",
    genres: ["Grateful Dead Tribute", "Jam Band", "Acoustic Folk"],
    city: "Portland, OR",
    bio: "A premier Gratefully Dead tribute, weaving magical three-set improvisational jams, stellar vocal harmonies, and warm community vibes into every single performance.",
    contactEmail: "gbb@gratefulbooking.com",
    contactPhone: "Inquire",
    website: "www.garciabirthdayband.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "shoot-to-thrill-acdc",
    name: "Shoot to Thrill",
    genres: ["AC/DC Tribute", "Hard Rock", "Arena Rock"],
    city: "Seattle, WA",
    bio: "An all-female AC/DC tribute executing the high-voltage riffs of Angus Young and deep-gravel vocals of Brian Johnson and Bon Scott. Extremely high energy.",
    contactEmail: "shoot@thrillacdc.org",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "no-quarter-zeppelin",
    name: "No Quarter",
    genres: ["Led Zeppelin Tribute", "Hard Rock", "Classic Rock"],
    city: "Seattle, WA",
    bio: "A highly authentic Led Zeppelin tribute recreation. Features soaring blues vocals, double-neck Gibson guitars, and thunderous acoustic drum sets.",
    contactEmail: "nq@zeppelinbooking.net",
    contactPhone: "Inquire",
    experienceLevel: "National Act"
  },
  {
    id: "barracuda-heart",
    name: "Barracuda",
    genres: ["Heart Tribute", "Classic Rock", "Hard Rock"],
    city: "Seattle, WA",
    bio: "Paying tribute to Seattle's own rock pioneers, Barracuda captures the stellar glass-shattering vocal range of Ann Wilson and acoustic rants of Nancy.",
    contactEmail: "barracuda@hearttribute.com",
    contactPhone: "(206) 555-1977",
    website: "www.hearttributebarracuda.com",
    experienceLevel: "National Act"
  },
  {
    id: "radical-revolution-pdx",
    name: "Radical Revolution",
    genres: ["80s Pop Tribute", "New Wave", "Glam Metal"],
    city: "Portland, OR",
    bio: "The ultimate 80s tribute experience, playing everything from synth-pop classics to high-octane hair metal anthems. Guaranteed to pack every dancefloor.",
    contactEmail: "booking@radical80s.net",
    contactPhone: "Inquire",
    website: "www.radical80s.net",
    experienceLevel: "Regional Tour"
  },
  {
    id: "jaded-aerosmith-tribute",
    name: "Jaded",
    genres: ["Aerosmith Tribute", "Hard Rock", "Blues Rock"],
    city: "Portland, OR",
    bio: "Capturing the swagger, scarves, and massive, soaring falsettos of Steven Tyler paired with Joe Perry's classic dirty guitar slides.",
    contactEmail: "jaded@aerosmithtribute.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "stone-in-love-journey",
    name: "Stone in Love",
    genres: ["Journey Tribute", "Arena Rock", "Classic Pop"],
    city: "Portland, OR",
    bio: "The Northwest's premiere Journey tribute, delivering pristine high-register vocal leads and anthemic guitar solos that everyone sings along to.",
    contactEmail: "booking@stoneinlove.com",
    contactPhone: "Inquire",
    website: "www.stoneinlove.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "appetite-for-deception",
    name: "Appetite for Deception",
    genres: ["Guns N' Roses Tribute", "Hard Rock", "Sleaze Metal"],
    city: "Portland, OR",
    bio: "Highly notorious, note-for-note recreation of classic-era Guns N' Roses, complete with top hats, whiskey bottles, and soaring high-screech vocals.",
    contactEmail: "gnr@appetitedeception.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "superunknown-soundgarden",
    name: "Superunknown",
    genres: ["Soundgarden Tribute", "Grunge", "Heavy Alternative"],
    city: "Seattle, WA",
    bio: "Executing Chris Cornell's mind-bending four-octave vocal range, dropping guitar structures to drop-D grunge, and bringing heavy, complex tempos.",
    contactEmail: "cornellbooking@grungepdx.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "facelift-aic-tribute",
    name: "Facelift",
    genres: ["Alice in Chains Tribute", "Grunge", "Heavy Rock"],
    city: "Seattle, WA",
    bio: "Recreating the haunting, gorgeous vocal harmonies of Layne Staley and Jerry Cantrell over heavy sludgy alternative riffs and deep grunge bass beats.",
    contactEmail: "facelift@grungepdx.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "wash-pearl-jam",
    name: "Wash",
    genres: ["Pearl Jam Tribute", "Alternative", "Grunge Rock"],
    city: "Seattle, WA",
    bio: "A highly passionate tribute to-and-for Pearl Jam, replicating Eddie Vedder's sweeping baritone vibratos and Mike McCready's sky-high guitar solos.",
    contactEmail: "pjwash@grungepdx.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "bleach-nirvana-tribute",
    name: "Bleach",
    genres: ["Nirvana Tribute", "Grunge", "Noise Punk"],
    city: "Seattle, WA",
    bio: "A raw, chaotic three-piece grunge assault. Recreating Kurt Cobain's shredded vocals, heavy feedback guitar solos, and high-energy stage wrecking.",
    contactEmail: "bleachtribute@grungepdx.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "sweet-tender-hooligans",
    name: "Sweet & Tender Hooligans",
    genres: ["The Smiths Tribute", "Morrissey Pop", "Retro Indie"],
    city: "Portland, OR",
    bio: "The ultimate tribute to The Smiths and Morrissey, recreating Johnny Marr's shimmering jangle guitars and Morrissey's dramatic, baritone swooning.",
    contactEmail: "booking@smithstributepdx.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "transmission-joy-div",
    name: "Transmission",
    genres: ["Joy Division Tribute", "Post-Punk", "Darkwave"],
    city: "Portland, OR",
    bio: "Capturing the dark, industrial bass drives, motoric click drums, and echoing, tragic baritone of Ian Curtis. Complete with custom shadow lighting.",
    contactEmail: "transmission@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "debaser-pixies-tribute",
    name: "Debaser",
    genres: ["Pixies Tribute", "Indie Rock", "Noise Rock"],
    city: "Seattle, WA",
    bio: "Recreating the quintessential quiet-loud-quiet punk pop formula, screeching male/female vocals, and abrasive dual surf-guitar lines of Black Francis.",
    contactEmail: "debaserbooking@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "new-life-depeche-mode",
    name: "New Life",
    genres: ["Depeche Mode Tribute", "Synthpop", "New Wave"],
    city: "Portland, OR",
    bio: "A heavy, analogue synth tribute to Dave Gahan and Martin Gore, packed with drum machine pulses, dark keys, and rich, melodic electronic pop vocals.",
    contactEmail: "newlife@synthpdx.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "loving-the-alien-bowie",
    name: "Loving the Alien",
    genres: ["David Bowie Tribute", "Glam Rock", "Art Pop"],
    city: "Portland, OR",
    bio: "A spectacular David Bowie retrospective covering Ziggy Stardust glam, Thin White Duke soul, and 80s commercial hits with full theatrical costume changes.",
    contactEmail: "bowietribute@pdxmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "london-calling-clash",
    name: "London Calling",
    genres: ["The Clash Tribute", "Punk Rock", "Dub Reggae"],
    city: "Portland, OR",
    bio: "Searing, political punk rock meets reggae dub. Recreating Joe Strummer's raw, frantic guitar strumming and anthemic gang vocal shout-alongs.",
    contactEmail: "londonclash@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "idioteque-radiohead",
    name: "Idioteque",
    genres: ["Radiohead Tribute", "Art Rock", "Electronic"],
    city: "Seattle, WA",
    bio: "An outstanding 5-piece recreating the complex guitar structures, modular synthesizer filters, and haunting vocals of Kid A and OK Computer.",
    contactEmail: "booking@idiotequetribute.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "murmur-rem-tribute",
    name: "Murmur",
    genres: ["R.E.M. Tribute", "Jangle Pop", "Indie Folk"],
    city: "Seattle, WA",
    bio: "Celebrating R.E.M.'s IRS Records era jangle acoustic folk-pop, cascading bass patterns, and Michael Stipe's beautiful lyrics.",
    contactEmail: "murmur@remtribute.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "supersonic-oasis-tribute",
    name: "Supersonic",
    genres: ["Oasis Tribute", "Britpop", "Alternative Rock"],
    city: "Portland, OR",
    bio: "Note-for-note Britpop majesty. Catching Liam's hands-behind-back vocal sneer and Noel's massive Wall-of-Sound guitar choruses perfectly.",
    contactEmail: "oasis@britpop-booking.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "el-scorcho-weezer",
    name: "El Scorcho",
    genres: ["Weezer Tribute", "Alternative Pop", "Power Pop"],
    city: "Portland, OR",
    bio: "A highly energetic celebration of the Blue Album and Pinkerton eras, filled with thick dual-fuzz guitars, heavy bass, and nerd-rock melodies.",
    contactEmail: "scorcho@weezerpdx.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "plush-stp-tribute",
    name: "Plush",
    genres: ["Stone Temple Pilots Tribute", "Alternative Rock", "Grunge"],
    city: "Seattle, WA",
    bio: "Bringing the heavy, slinky post-grunge bass grooves, jazzy guitar scales, and dramatic frontman hip-shuffling of Scott Weiland in his prime.",
    contactEmail: "plushstp@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "hungry-wolf-duran",
    name: "Hungry Like the Wolf",
    genres: ["Duran Duran Tribute", "New Wave", "Synthpop"],
    city: "Seattle, WA",
    bio: "Catchy slap-bass, bright dance synthesizer chords, and gorgeous romantic vocals that bring back the 80s neon MTV era spectacular.",
    contactEmail: "duran@newwavebooking.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "hot-for-teacher-vh",
    name: "Hot for Teacher",
    genres: ["Van Halen Tribute", "Hard Rock", "Arena Rock"],
    city: "Portland, OR",
    bio: "A spectacular tribute to classic-era Van Halen, featuring blindingly fast guitar tapping sweeps, split jumps, and anthemic arena rock vocals.",
    contactEmail: "vh@eruptionbooking.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "thunderstruck-acdc-nw",
    name: "Thunderstruck",
    genres: ["AC/DC Tribute", "Hard Rock", "Arena Rock"],
    city: "Seattle, WA",
    bio: "The Pacific Northwest's ultimate AC/DC tribute experience. Recreating the thunderous rhythm section, high-voltage dual Marshall stacks, and Angus Young's iconic schoolboy stride with stunning accuracy.",
    contactEmail: "booking@thunderstrucknw.com",
    contactPhone: "(206) 555-4232",
    website: "www.thunderstrucknw.com",
    experienceLevel: "National Act"
  },
  {
    id: "queen-mother-tribute-pdx",
    name: "Queen Mother",
    genres: ["Queen Tribute", "Glam Rock", "Arena Rock"],
    city: "Portland, OR",
    bio: "A breathtaking tribute to the operatic rock majesty of Freddie Mercury and Queen. Complete with sweeping four-part vocal harmonies, grand piano displays, and Brian May style melodic guitar orchestration.",
    contactEmail: "booking@queenmothertribute.com",
    contactPhone: "(503) 555-7833",
    website: "www.queenmothertribute.com",
    experienceLevel: "National Act"
  },
  {
    id: "nearly-dan-steely-tribute",
    name: "Nearly Dan",
    genres: ["Steely Dan Tribute", "Jazz Rock", "Yacht Rock"],
    city: "Seattle, WA",
    bio: "A magnificent 12-piece orchestration replicating the complex jazz-rock arrangements, pristine horn player lines, and high-fidelity session standards of Donald Fagen and Walter Becker.",
    contactEmail: "nearlydan@jazzbooking.net",
    contactPhone: "Inquire",
    website: "www.nearlydan.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "american-fool-mellencamp",
    name: "American Fool",
    genres: ["John Mellencamp Tribute", "Heartland Rock", "Classic Rock"],
    city: "Portland, OR",
    bio: "Recreating the direct organic heartland-rock storytelling and acoustic-electric hybrid grooves of John Mellencamp. Perfect for summer outdoor amphitheaters.",
    contactEmail: "booking@americanfooltribute.com",
    contactPhone: "Inquire",
    website: "www.americanfooltribute.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "reckless-bryan-adams",
    name: "Reckless",
    genres: ["Bryan Adams Tribute", "Arena Rock", "Power Pop"],
    city: "Seattle, WA",
    bio: "A high-octane tribute capturing the husky rock vocals, driving rhythms, and anthemic 1980s summer radio hook structures of Bryan Adams.",
    contactEmail: "reckless@80srockbooking.link",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "creedence-revelation-ccr",
    name: "Creedence Revelation",
    genres: ["CCR Tribute", "Southern Rock", "Roots Rock"],
    city: "Portland, OR",
    bio: "Paying tribute to the swampy guitar tones, gravelly vocal deliveries, and timeless bayou rock hits of Creedence Clearwater Revival.",
    contactEmail: "ccr@swamprockbooking.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "bad-animals-heart-tribute",
    name: "Bad Animals",
    genres: ["Heart Tribute", "Classic Rock", "Hard Rock"],
    city: "Seattle, WA",
    bio: "An incredible Northwesterly tribute to Seattle's own Wilson sisters. Delivers note-for-note vocal range gymnastics and sweeping classic-rock acoustic-electric transitions.",
    contactEmail: "booking@badanimalstribute.com",
    contactPhone: "Inquire",
    website: "www.badanimalstribute.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "second-hand-news-mac",
    name: "Second Hand News",
    genres: ["Fleetwood Mac Tribute", "Classic Rock", "Vocal Harmonies"],
    city: "Seattle, WA",
    bio: "Chasing the magical california breeze and three-part vocal alchemy of Rumours-era Fleetwood Mac with pristine musicianship and authentic vintage gear.",
    contactEmail: "secondhandnews@macbooking.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "the-joshua-tree-u2",
    name: "The Joshua Tree Northwest",
    genres: ["U2 Tribute", "Alternative Rock", "Arena Pop"],
    city: "Seattle, WA",
    bio: "Note-for-note U2 stadium anthems, replicating The Edge's signature cascading delay pedal echoes and Bono's soaring vocal heights with remarkable precision.",
    contactEmail: "booking@joshuatreenw.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "petty-theft-northwest",
    name: "Petty Theft NW",
    genres: ["Tom Petty Tribute", "Classic Rock", "Heartland Rock"],
    city: "Portland, OR",
    bio: "Celebrating the legendary songs of Tom Petty and the Heartbreakers with authentic guitars, warm organ swirls, and absolute crowd sing-along energy.",
    contactEmail: "pettytheftnw@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "midnight-tide-bc",
    name: "Midnight Tide",
    genres: ["Dream Pop", "Shoegaze", "Indie Pop"],
    city: "Vancouver, BC",
    bio: "Ethereal, oceanic guitar washes layered with soaring soprano vocals and shimmering analog synths. Capturing the moody, rain-soaked aesthetic of the Pacific Northwest coastline.",
    contactEmail: "booking@midnighttideband.ca",
    contactPhone: "(604) 555-0192",
    website: "www.midnighttideband.ca",
    experienceLevel: "Regional Tour"
  },
  {
    id: "false-creek-bc",
    name: "False Creek",
    genres: ["Indie Rock", "Post-Punk", "Alternative"],
    city: "Vancouver, BC",
    bio: "Sharp, energetic post-punk revival featuring angular dual guitar parts, tight driving bass lines, and urgent, melodic baritone vocals.",
    contactEmail: "falsecreekmusic@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "gastown-grooves-bc",
    name: "Gastown Grooves",
    genres: ["Acid Jazz", "Funk", "Soul"],
    city: "Vancouver, BC",
    bio: "An eclectic 6-piece ensemble combining classic Hammond organ swirls, crisp horn lines, and sophisticated grooves inspired by vintage British acid jazz.",
    contactEmail: "info@gastowngrooves.ca",
    contactPhone: "(604) 555-8321",
    website: "www.gastowngrooves.ca",
    experienceLevel: "Regional Tour"
  },
  {
    id: "raincity-rebellion-bc",
    name: "Raincity Rebellion",
    genres: ["Ska Punk", "Reggae Rock"],
    city: "Vancouver, BC",
    bio: "High-octane brassy ska punk with infectious off-beat guitar stabs, rapid-fire horn lines, and political, energetic lyricism.",
    contactEmail: "rebelbooking@raincityska.ca",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "fraser-valley-boys-bc",
    name: "Fraser Valley Boys",
    genres: ["Bluegrass", "Traditional Folk"],
    city: "Burnaby, BC",
    bio: "Fast-picking traditional bluegrass featuring lightning-quick mandolin, soaring fiddle runs, and rich three-part vocal harmonies.",
    contactEmail: "info@fraservalleyboys.com",
    contactPhone: "(778) 555-0144",
    experienceLevel: "Regional Tour"
  },
  {
    id: "mt-pleasant-sound-bc",
    name: "Mt. Pleasant Sound",
    genres: ["Indie Folk", "Chamber Pop", "Acoustic"],
    city: "Vancouver, BC",
    bio: "Intimate, lush folk arrangements with sweeping cello, acoustic fingerpicking, and delicate dual-gender vocal harmonies.",
    contactEmail: "pleasantbooking@vanfolk.ca",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "pacific-overdrive-bc",
    name: "Pacific Overdrive",
    genres: ["Alternative Rock", "Hard Rock"],
    city: "Richmond, BC",
    bio: "Powerhouse 90s-inspired hard alternative rock with thick fuzz guitars, driving tempos, and commanding classic rock vocals.",
    contactEmail: "booking@pacificoverdrive.ca",
    contactPhone: "(604) 555-9281",
    website: "www.pacificoverdrive.ca",
    experienceLevel: "Regional Tour"
  },
  {
    id: "terminal-city-bc",
    name: "Terminal City",
    genres: ["Post-Punk", "Darkwave", "Goth Rock"],
    city: "Vancouver, BC",
    bio: "Dark, moody post-punk driven by heavy melodic bass lines, steady drum machines, and brooding baritone vocals that echo late 70s Manchester.",
    contactEmail: "terminalcity@darkwavemail.ca",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "east-van-fuzz-bc",
    name: "East Van Fuzz",
    genres: ["Garage Rock", "Grunge", "Punk"],
    city: "Vancouver, BC",
    bio: "Raw, unpolished garage rock and feedback-heavy grunge delivered with maximum attitude and high physical energy on stage.",
    contactEmail: "eastvanfuzz@gmail.com",
    contactPhone: "(604) 555-4011",
    experienceLevel: "Local"
  },
  {
    id: "west-coast-shimmer-bc",
    name: "West Coast Shimmer",
    genres: ["Shoegaze", "Ambient Rock", "Dream Pop"],
    city: "Vancouver, BC",
    bio: "Lush wall-of-sound guitars, heavily modulated reverbs, and buried, sweet vocal melodies that float above a driving rhythmic pulse.",
    contactEmail: "shimmer@shoegazevancouver.ca",
    contactPhone: "Inquire",
    website: "www.westcoastshimmer.ca",
    experienceLevel: "Regional Tour"
  },
  {
    id: "mt-baker-mystics-wa",
    name: "Mount Baker Mystics",
    genres: ["Psychedelic Folk", "Americana", "Acid Rock"],
    city: "Bellingham, WA",
    bio: "Blending acoustic roots orchestration with psychedelic delay-laden guitars and mystical lyrical themes inspired by the northern Cascades.",
    contactEmail: "booking@baker-mystics.com",
    contactPhone: "(360) 555-0322",
    experienceLevel: "Regional Tour"
  },
  {
    id: "boundary-bay-brass-wa",
    name: "Boundary Bay Brass",
    genres: ["Funk", "Soul", "R&B"],
    city: "Bellingham, WA",
    bio: "A high-octane 8-piece horn band delivering tight syncopated funk rhythms, soaring brass melodies, and powerhouse soul vocals.",
    contactEmail: "booking@boundarybaybrass.com",
    contactPhone: "Inquire",
    website: "www.boundarybaybrass.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "whatcom-waves-wa",
    name: "Whatcom Waves",
    genres: ["Surf Rock", "Instro-Surf"],
    city: "Bellingham, WA",
    bio: "Reverb-drenched instrumental surf rock with cascading guitar runs, driving double-picking, and authentic vintage twang.",
    contactEmail: "waves@whatcomsurf.org",
    contactPhone: "(360) 555-4811",
    experienceLevel: "Local"
  },
  {
    id: "chuckanut-cruisers-wa",
    name: "Chuckanut Cruisers",
    genres: ["Classic Rock", "Blues Rock"],
    city: "Bellingham, WA",
    bio: "Paying homage to the driving rhythms and fiery solos of late 60s and 70s blues rock, perfect for rowdy bars and festivals alike.",
    contactEmail: "chuckanutcruisers@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "samish-bay-strutters-wa",
    name: "Samish Bay Strutters",
    genres: ["Americana", "Alt-Country", "Bluegrass"],
    city: "Mount Vernon, WA",
    bio: "A rustic blend of acoustic banjo, warm acoustic bass, slide guitar, and gravelly lead vocals reflecting rural Skagit County life.",
    contactEmail: "booking@samishbaystrutters.com",
    contactPhone: "(360) 555-0815",
    experienceLevel: "Local"
  },
  {
    id: "skagit-river-revival-wa",
    name: "Skagit River Revival",
    genres: ["Folk Rock", "Roots Rock"],
    city: "Mount Vernon, WA",
    bio: "Heartland folk-rock anthems featuring soaring vocal choruses, warm organ swells, and solid electric guitar foundations.",
    contactEmail: "skagitrevival@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "fidalgo-fretwork-wa",
    name: "Fidalgo Fretwork",
    genres: ["Acoustic Jazz", "Gypsy Jazz", "Swing"],
    city: "Anacortes, WA",
    bio: "A virtuoso acoustic guitar and violin duo playing energetic, swing-fueled gypsy jazz in the style of Django Reinhardt.",
    contactEmail: "info@fidalgofretwork.com",
    contactPhone: "(360) 555-3810",
    website: "www.fidalgofretwork.com",
    experienceLevel: "Local"
  },
  {
    id: "rosario-fuzz-wa",
    name: "Rosario Fuzz",
    genres: ["Grunge", "Alternative Rock", "Punk"],
    city: "Anacortes, WA",
    bio: "Loud, gritty, and heavily distorted rock channelled straight from the classic 1990s Northwest underground scene.",
    contactEmail: "rosariofuzz@grungeoutlook.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "whidbey-winds-wa",
    name: "Whidbey Winds",
    genres: ["Ambient Folk", "Acoustic", "Chamber Folk"],
    city: "Oak Harbor, WA",
    bio: "Sweeping, cinematic acoustic pieces featuring acoustic guitar, classical flute, and deep, resonant vocal harmonies.",
    contactEmail: "booking@whidbeywinds.org",
    contactPhone: "(360) 555-2713",
    experienceLevel: "Local"
  },
  {
    id: "deception-pass-metal-wa",
    name: "Deception Pass",
    genres: ["Heavy Metal", "Thrash Metal"],
    city: "Oak Harbor, WA",
    bio: "Fast, aggressive heavy metal with blistering dual lead guitar solos, double-kick thunder, and commanding vocal delivery.",
    contactEmail: "deceptionmetal@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "port-gardner-sound-wa",
    name: "Port Gardner Sound",
    genres: ["Indie Pop", "Synthpop", "Dream Pop"],
    city: "Everett, WA",
    bio: "Sparkling indie-pop melodies backed by lush synth washes, upbeat electronic drums, and hook-laden, sweet male-female vocals.",
    contactEmail: "shows@portgardnersound.com",
    contactPhone: "(425) 555-0182",
    website: "www.portgardnersound.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "snohomish-shakers-wa",
    name: "Snohomish Shakers",
    genres: ["Rockabilly", "Psychobilly", "Classic Rock"],
    city: "Everett, WA",
    bio: "Slap-back upright double bass, wild hollowbody guitar riffs, and driving shuffle beats delivering pure 1950s rockabilly energy.",
    contactEmail: "booking@snohomishshakers.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "pilchuck-punk-wa",
    name: "Pilchuck Punk",
    genres: ["Hardcore Punk", "D-Beat"],
    city: "Everett, WA",
    bio: "Unrelenting, ultra-fast hardcore punk with blistering political lyrical rants, wall-of-fuzz guitars, and furious blast beats.",
    contactEmail: "pilchuckpunk@diymail.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "mukilteo-moonlight-wa",
    name: "Mukilteo Moonlight",
    genres: ["Chillwave", "Synthwave", "Ambient"],
    city: "Everett, WA",
    bio: "Nostalgic, warm synthesizer soundtracks inspired by sunsets over the Puget Sound, retro drum machines, and vocal tape delays.",
    contactEmail: "mukilteomoonlight@gmail.com",
    contactPhone: "(425) 555-9014",
    experienceLevel: "Local"
  },
  {
    id: "ballard-bridge-wa",
    name: "Ballard Bridge",
    genres: ["Americana", "Folk Rock", "Roots Rock"],
    city: "Seattle, WA",
    bio: "A rustic blend of warm acoustic guitar, crying pedal steel, and rich vocal harmonies, capturing the timeless grit of Ballard's historic streets.",
    contactEmail: "ballardbridge@rootsmusic.net",
    contactPhone: "(206) 555-3390",
    experienceLevel: "Regional Tour"
  },
  {
    id: "fremont-fuzz-wa",
    name: "Fremont Fuzz",
    genres: ["Noise Rock", "Alternative Rock", "Post-Punk"],
    city: "Seattle, WA",
    bio: "Abrasive, rhythmic, and uncompromising noise rock utilizing screeching feedback loops, pounding tribal rhythms, and deadpan vocals.",
    contactEmail: "booking@fremontfuzz.com",
    contactPhone: "Inquire",
    website: "www.fremontfuzz.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "pioneer-square-brass-wa",
    name: "Pioneer Square Brass",
    genres: ["Jazz", "Funk", "Second Line"],
    city: "Seattle, WA",
    bio: "A roaring New Orleans style street brass band infused with modern Pacific Northwest funk, getting any crowd moving instantly.",
    contactEmail: "pioneersquarebrass@gmail.com",
    contactPhone: "(206) 555-1218",
    experienceLevel: "Local"
  },
  {
    id: "lake-union-lights-wa",
    name: "Lake Union Lights",
    genres: ["Synthpop", "Indie Pop", "Electro-Rock"],
    city: "Seattle, WA",
    bio: "Luminous, beat-driven synthpop blending sweeping analog lead synthesizers, driving electronic bass, and highly catchy vocal hooks.",
    contactEmail: "booking@lakeunionlights.com",
    contactPhone: "(206) 555-0145",
    website: "www.lakeunionlights.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "duwamish-delta-wa",
    name: "Duwamish Delta",
    genres: ["Delta Blues", "Slide Guitar", "Acoustic Blues"],
    city: "Seattle, WA",
    bio: "Gritty, swampy slide guitar paired with foot-stomping percussion and powerful gravelly vocals exploring local history and folklore.",
    contactEmail: "duwamishdelta@bluesnorthwest.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "queen-anne-quake-wa",
    name: "Queen Anne Quake",
    genres: ["Alternative Metal", "Hard Rock", "Grunge"],
    city: "Seattle, WA",
    bio: "Heavy, low-tuned alternative metal with thunderous bass grooves, searing guitar leads, and a powerhouse lead vocalist.",
    contactEmail: "booking@queenannequake.com",
    contactPhone: "(206) 555-9011",
    experienceLevel: "Local"
  },
  {
    id: "alki-beach-cruisers-wa",
    name: "Alki Beach Cruisers",
    genres: ["Reggae", "Dub Rock", "Ska"],
    city: "Seattle, WA",
    bio: "Sunny, laid-back island vibes from West Seattle, merging traditional roots reggae offbeats with deep, rumbling bass and sweet vocal harmonies.",
    contactEmail: "cruisers@alkireggae.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "capitol-hill-echo-wa",
    name: "Capitol Hill Echo",
    genres: ["Post-Punk", "Darkwave", "Indie Rock"],
    city: "Seattle, WA",
    bio: "Brooding post-punk with chorus-drenched guitars, driving rhythmic precision, and evocative, poetic lead vocals.",
    contactEmail: "echo@capitolhillpunk.org",
    contactPhone: "(206) 555-8812",
    experienceLevel: "Regional Tour"
  },
  {
    id: "green-lake-glimmer-wa",
    name: "Green Lake Glimmer",
    genres: ["Dream Pop", "Shoegaze", "Indie Pop"],
    city: "Seattle, WA",
    bio: "Delicate, shimmering dream-pop atmospheres featuring swirling delays, sweet whispered vocals, and a warm, comforting melodic core.",
    contactEmail: "glimmer@greenlakemusic.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "puget-sound-machine-wa",
    name: "Puget Sound Machine",
    genres: ["Industrial Rock", "Synth Rock", "EBM"],
    city: "Seattle, WA",
    bio: "Aggressive, mechanical beats blended with heavy distorted electric guitars and dark synthesizers, delivering a high-energy live visual show.",
    contactEmail: "booking@pugetsoundmachine.com",
    contactPhone: "(206) 555-0920",
    website: "www.pugetsoundmachine.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "grit-city-groove-wa",
    name: "Grit City Groove",
    genres: ["Funk", "Soul", "R&B"],
    city: "Tacoma, WA",
    bio: "Sizzling Tacoma-based funk collective known for lock-step horn sections, popping slap bass, and exceptional lead soul vocals.",
    contactEmail: "booking@gritcitygroove.com",
    contactPhone: "(253) 555-0143",
    experienceLevel: "Regional Tour"
  },
  {
    id: "commencement-bay-rock-wa",
    name: "Commencement Bay",
    genres: ["Indie Rock", "Alternative Rock"],
    city: "Tacoma, WA",
    bio: "Melodious, soaring alternative rock driven by intricate guitar interplays and passionate, dynamic vocal performance.",
    contactEmail: "shows@commencementbayband.com",
    contactPhone: "Inquire",
    website: "www.commencementbayband.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "point-defiance-rock-wa",
    name: "Point Defiance",
    genres: ["Hard Rock", "Heavy Metal"],
    city: "Tacoma, WA",
    bio: "High-voltage hard rock featuring screaming guitar solos, thunderous drum work, and powerhouse high-register vocals.",
    contactEmail: "pointdefiancerocks@gmail.com",
    contactPhone: "(253) 555-9002",
    experienceLevel: "Local"
  },
  {
    id: "puyallup-valley-pickers-wa",
    name: "Puyallup Valley Pickers",
    genres: ["Country Folk", "Bluegrass", "Acoustic"],
    city: "Tacoma, WA",
    bio: "A heartwarming acoustic ensemble specializing in sweet folk tunes, crisp mandolin picking, and beautiful multi-part vocal blends.",
    contactEmail: "booking@puyalluppickers.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "ruston-way-pop-wa",
    name: "Ruston Way",
    genres: ["Indie Pop", "Acoustic Pop"],
    city: "Tacoma, WA",
    bio: "Breezy indie pop combining sparkling acoustic guitars, warm synthesizers, and incredibly infectious hooks that stick in your head.",
    contactEmail: "rustonwaypop@gmail.com",
    contactPhone: "(253) 555-4412",
    experienceLevel: "Local"
  },
  {
    id: "stadium-district-wa",
    name: "Stadium District",
    genres: ["Emo", "Math Rock", "Indie Rock"],
    city: "Tacoma, WA",
    bio: "Intricate, clean tapping guitars, energetic odd-time signatures, and emotional, high-register vocal narratives from Tacoma's core.",
    contactEmail: "booking@stadiumdistrictband.com",
    contactPhone: "Inquire",
    website: "www.stadiumdistrictband.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "mcchord-midnight-wa",
    name: "McChord Midnight",
    genres: ["Alt-Country", "Americana", "Roots Rock"],
    city: "Tacoma, WA",
    bio: "Dusty, reverb-soaked country rock driven by crying telecasters, warm organ pads, and deep, resonant storytelling vocals.",
    contactEmail: "mcchordmidnight@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "capitol-lake-coalition-wa",
    name: "Capitol Lake Coalition",
    genres: ["Indie Folk", "Americana", "Chamber Folk"],
    city: "Olympia, WA",
    bio: "An rich acoustic ensemble blending banjo, violin, trumpet, and rustic acoustic guitars for a communal, uplifting folk experience.",
    contactEmail: "booking@capitollakecoalition.org",
    contactPhone: "(360) 555-1190",
    experienceLevel: "Regional Tour"
  },
  {
    id: "deschutes-river-delta-wa",
    name: "Deschutes River Delta",
    genres: ["Post-Rock", "Instrumental Rock", "Ambient"],
    city: "Olympia, WA",
    bio: "Cinematic, instrumental post-rock building from quiet ambient echoes into towering, explosive walls of emotional guitar noise.",
    contactEmail: "deschutesdelta@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "nisqually-noise-wa",
    name: "Nisqually Noise",
    genres: ["Punk Rock", "Garage Rock"],
    city: "Olympia, WA",
    bio: "Furious, fuzzy punk rock that takes direct inspiration from the rich Olympia Riot Grrrl and K Records DIY underground scenes.",
    contactEmail: "booking@nisquallynoise.org",
    contactPhone: "(360) 555-9013",
    experienceLevel: "Local"
  },
  {
    id: "budd-inlet-blues-wa",
    name: "Budd Inlet Blues",
    genres: ["Blues Rock", "Classic Rock", "Soul"],
    city: "Olympia, WA",
    bio: "Soulful, heavy blues rock with expressive, screaming guitar solos, deep organ beds, and a powerhouse lead vocalist.",
    contactEmail: "buddinletblues@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "south-sound-syndicate-wa",
    name: "South Sound Syndicate",
    genres: ["Hip-Hop", "Funk Rap", "Jazz Rap"],
    city: "Olympia, WA",
    bio: "Lively live-band hip-hop collective merging smooth jazz instrumentation, tight funk breaks, and sharp, conscious lyricism.",
    contactEmail: "syndicate@southsoundlive.net",
    contactPhone: "(360) 555-1212",
    experienceLevel: "Regional Tour"
  },
  {
    id: "black-hills-bluegrass-wa",
    name: "Black Hills Bluegrass",
    genres: ["Bluegrass", "Traditional Folk", "Old-Time"],
    city: "Olympia, WA",
    bio: "Authentic, high-speed acoustic bluegrass picking featuring lightning banjo, driving acoustic guitar, and rustic mountain vocals.",
    contactEmail: "info@blackhillsbluegrass.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "mima-mounds-ambient-wa",
    name: "Mima Mounds",
    genres: ["Ambient", "Drone", "Post-Rock"],
    city: "Centralia, WA",
    bio: "Hypnotic, repeating guitar delays, warm synthesizer drones, and slow structural builds inspired by the mysterious Mima Mounds prairie landscape.",
    contactEmail: "mimamoundsambient@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "hub-city-horns-wa",
    name: "Hub City Horns",
    genres: ["Ska", "Reggae", "Funk"],
    city: "Centralia, WA",
    bio: "Energetic ska and reggae outfit from Centralia, packing a massive 4-piece horn section and heavy danceable rocksteady offbeats.",
    contactEmail: "hubcityhorns@gmail.com",
    contactPhone: "(360) 555-4819",
    experienceLevel: "Local"
  },
  {
    id: "chehalis-clay-wa",
    name: "Chehalis Clay",
    genres: ["Stoner Rock", "Fuzz Rock", "Doom"],
    city: "Chehalis, WA",
    bio: "Thick, down-tuned stoner rock riffs drenched in heavy muff fuzz, backed by crushing, slow-slung heavy drum beats.",
    contactEmail: "chehalisclay@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "cowlitz-country-wa",
    name: "Cowlitz Country",
    genres: ["Classic Country", "Honky Tonk", "Americana"],
    city: "Longview, WA",
    bio: "Authentic, tear-in-your-beer classic country honky tonk featuring crying pedal steel, telecaster twang, and deep baritone vocals.",
    contactEmail: "booking@cowlitzcountry.com",
    contactPhone: "(360) 555-2015",
    experienceLevel: "Local"
  },
  {
    id: "columbia-river-current-wa",
    name: "Columbia River Current",
    genres: ["Folk Rock", "Roots Rock", "Americana"],
    city: "Longview, WA",
    bio: "Powerfully performed folk-rock exploring maritime themes, working-class tales, and the epic scenery of the lower Columbia River.",
    contactEmail: "rivercurrent@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "kelso-keys-wa",
    name: "Kelso Keys",
    genres: ["Jazz", "Vocal Jazz", "Soul"],
    city: "Longview, WA",
    bio: "An intimate, sophisticated jazz quartet featuring silky female lead vocals, clean jazz guitar chords, and upright acoustic bass lines.",
    contactEmail: "kelsokeys@gmail.com",
    contactPhone: "(360) 555-3812",
    experienceLevel: "Local"
  },
  {
    id: "esther-short-wa",
    name: "Esther Short",
    genres: ["Indie Pop", "Acoustic Pop", "Indie Folk"],
    city: "Vancouver, WA",
    bio: "Charming, sunlit indie pop with acoustic strumming, warm violin flourishes, and incredibly infectious, whimsical vocal hooks.",
    contactEmail: "booking@esthershortband.com",
    contactPhone: "(360) 555-0188",
    website: "www.esthershortband.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "ridgefield-rhythm-wa",
    name: "Ridgefield Rhythm",
    genres: ["Americana", "Roots Rock", "Country Folk"],
    city: "Vancouver, WA",
    bio: "A spirited blend of country picking, roots-rock driving tempos, and powerful, soulful lead vocals that capture PNW beauty.",
    contactEmail: "rhythm@ridgefieldmusic.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "fort-vancouver-fuzz-wa",
    name: "Fort Vancouver Fuzz",
    genres: ["Psychedelic Rock", "Garage Rock", "Acid Rock"],
    city: "Vancouver, WA",
    bio: "Swirling vintage organ sweeps, heavily modulated fuzz guitars, and high-energy garage beats inspired by late 60s garage psychedelia.",
    contactEmail: "fortfuzz@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "camas-creek-wa",
    name: "Camas Creek",
    genres: ["Indie Folk", "Acoustic", "Chamber Folk"],
    city: "Vancouver, WA",
    bio: "Fragile, breathtaking acoustic arrangements utilizing acoustic guitar, warm cello, and sweeping, cinematic vocal landscapes.",
    contactEmail: "camascreek@acousticfolk.net",
    contactPhone: "(360) 555-8840",
    experienceLevel: "Local"
  },
  {
    id: "willamette-whisper-or",
    name: "Willamette Whisper",
    genres: ["Acoustic", "Indie Folk", "Singer-Songwriter"],
    city: "Portland, OR",
    bio: "Intricate acoustic fingerpicking paired with deeply intimate, hauntingly beautiful whispering vocals and delicate upright bass.",
    contactEmail: "whisperbooking@gmail.com",
    contactPhone: "(503) 555-1209",
    experienceLevel: "Regional Tour"
  },
  {
    id: "hawthorne-heights-nw-or",
    name: "Hawthorne Heights NW",
    genres: ["Emo", "Indie Rock", "Alternative Rock"],
    city: "Portland, OR",
    bio: "Screaming vocal highlights over melodic emo guitar lines and high-energy punk drum rhythms, capturing Portland's underground spirit.",
    contactEmail: "hawthornenw@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "burnside-bridge-or",
    name: "Burnside Bridge",
    genres: ["Alternative Rock", "Indie Rock", "Grunge"],
    city: "Portland, OR",
    bio: "Heavy, anthemic 90s alternative rock with soaring choruses, melodic driving basslines, and passionate electric guitar leads.",
    contactEmail: "booking@burnsidebridge.com",
    contactPhone: "(503) 555-9014",
    website: "www.burnsidebridgeband.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "st-johns-solder-or",
    name: "St. Johns Solder",
    genres: ["Heavy Metal", "Hard Rock", "Doom Metal"],
    city: "Portland, OR",
    bio: "Crushing, low-tuned metal riffs, thunderous drum work, and powerful operatic lead vocals echoing under the historic St. Johns Bridge.",
    contactEmail: "soldermetal@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "mississippi-mud-or",
    name: "Mississippi Mud",
    genres: ["Blues", "Electric Blues", "Soul"],
    city: "Portland, OR",
    bio: "Gritty, soaring electric blues in the style of muddy Mississippi waters but infused with modern Pacific Northwest soul and groove.",
    contactEmail: "mississippipdx@blues.net",
    contactPhone: "(503) 555-7012",
    experienceLevel: "Regional Tour"
  },
  {
    id: "alberta-arts-pop-or",
    name: "Alberta Arts",
    genres: ["Indie Pop", "Twee Pop", "Dream Pop"],
    city: "Portland, OR",
    bio: "Charming twee-pop featuring glockenspiel, sparkling acoustic strumming, upbeat drum beats, and sweet, clever male-female vocal harmonies.",
    contactEmail: "booking@albertaartspop.com",
    contactPhone: "Inquire",
    website: "www.albertaartspop.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "sellwood-strings-or",
    name: "Sellwood Strings",
    genres: ["Chamber Pop", "Indie Folk", "Acoustic"],
    city: "Portland, OR",
    bio: "Gorgeously orchestrated indie-chamber pop blending acoustic guitars, cello, viola, and delicate multi-layered vocal structures.",
    contactEmail: "sellwoodstrings@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "mt-tabor-tremor-or",
    name: "Mt. Tabor Tremor",
    genres: ["Garage Punk", "Garage Rock", "Noise Rock"],
    city: "Portland, OR",
    bio: "A blast of pure high-energy garage punk, delivering frantic, fuzzy chord sweeps and wildly energetic stage antics.",
    contactEmail: "tremor@taborunderground.org",
    contactPhone: "(503) 555-0912",
    experienceLevel: "Local"
  },
  {
    id: "pearl-district-project-or",
    name: "Pearl District Project",
    genres: ["Acid Jazz", "Nu-Jazz", "Funk"],
    city: "Portland, OR",
    bio: "Sleek, modern acid jazz blending live saxophone improvisations with deep electronic synth sub-bass and crisp urban breakbeats.",
    contactEmail: "booking@pearldistrictproject.com",
    contactPhone: "(503) 555-4491",
    website: "www.pearldistrictproject.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "forest-park-folk-or",
    name: "Forest Park Folk",
    genres: ["Folk", "Acoustic", "Traditional Folk"],
    city: "Portland, OR",
    bio: "Timeless acoustic folk exploring nature, mysticism, and historical Northwest events with clean fingerpicking and rich cello lines.",
    contactEmail: "forestparkfolk@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "oregon-city-outlaws-or",
    name: "Oregon City Outlaws",
    genres: ["Southern Rock", "Classic Rock", "Country Rock"],
    city: "Oregon City, OR",
    bio: "Gritty, twin-lead-guitar southern rock delivered with high volume, massive slide guitar solos, and raw, powerful lead vocals.",
    contactEmail: "booking@oregoncityoutlaws.com",
    contactPhone: "(503) 555-7013",
    experienceLevel: "Local"
  },
  {
    id: "clackamas-currents-or",
    name: "Clackamas Currents",
    genres: ["Instrumental Rock", "Post-Rock", "Math Rock"],
    city: "Oregon City, OR",
    bio: "Melodic instrumental rock driven by clean tapping guitars, energetic drum rhythms, and highly dynamic song structures.",
    contactEmail: "clackamascurrents@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "willamette-valley-wine-or",
    name: "Willamette Valley Wine",
    genres: ["Gypsy Jazz", "Swing Jazz", "Acoustic"],
    city: "Salem, OR",
    bio: "Sparkling, high-speed acoustic gypsy jazz and swing, perfect for upscale tasting rooms, outdoor plazas, and theaters alike.",
    contactEmail: "booking@willamettevalleywine.net",
    contactPhone: "(503) 555-3811",
    experienceLevel: "Regional Tour"
  },
  {
    id: "capital-city-cult-or",
    name: "Capital City Cult",
    genres: ["Goth Rock", "Post-Punk", "Darkwave"],
    city: "Salem, OR",
    bio: "Eerie, chorus-drenched guitars, driving drum machine patterns, and dramatic, brooding baritone vocals exploring Salem's dark side.",
    contactEmail: "booking@capitalcitycult.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "chemeketa-cruiser-or",
    name: "Chemeketa Cruiser",
    genres: ["Classic Rock", "Blues Rock", "Hard Rock"],
    city: "Salem, OR",
    bio: "Loud, driving, classic-oriented blues rock with roaring Gibson guitar solos, driving bass lines, and excellent rock vocals.",
    contactEmail: "chemeketacruisers@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "keizer-kicks-or",
    name: "Keizer Kicks",
    genres: ["Pop Punk", "Alternative Rock", "Punk"],
    city: "Salem, OR",
    bio: "Fast, energetic pop-punk with crunchy rhythm guitars, highly singable choruses, and rapid-fire drum fills.",
    contactEmail: "keizerkicks@gmail.com",
    contactPhone: "(503) 555-4811",
    experienceLevel: "Local"
  },
  {
    id: "benton-county-blues-or",
    name: "Benton County Blues",
    genres: ["Blues", "Acoustic Blues", "Chicago Blues"],
    city: "Corvallis, OR",
    bio: "Expressive harmonica solos, crying Gibson guitars, and soulful vocals delivering timeless, heartfelt blues standard structures.",
    contactEmail: "bentonblues@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "marys-peak-rock-or",
    name: "Marys Peak",
    genres: ["Post-Rock", "Instrumental Rock", "Ambient"],
    city: "Corvallis, OR",
    bio: "Atmospheric, sprawling post-rock landscapes featuring clean delays, swells, and heavy orchestral percussion climaxes.",
    contactEmail: "booking@maryspeakpostrock.org",
    contactPhone: "(541) 555-2019",
    experienceLevel: "Local"
  },
  {
    id: "osu-underground-or",
    name: "OSU Underground",
    genres: ["Alternative Rock", "Indie Rock", "College Rock"],
    city: "Corvallis, OR",
    bio: "Energetic, guitar-driven college rock channeling the classic late-80s and 90s alternative campus radio underground sound.",
    contactEmail: "osuunderground@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "calapooia-currents-or",
    name: "Calapooia Current",
    genres: ["Americana", "Roots Rock", "Country Rock"],
    city: "Albany, OR",
    bio: "A rustic roots-rock blend of pedal steel, mandolin, electric guitar, and powerful storytelling vocals about Oregon's farm country.",
    contactEmail: "booking@calapooiacurrent.com",
    contactPhone: "(541) 555-4015",
    experienceLevel: "Local"
  },
  {
    id: "spencer-butte-rock-or",
    name: "Spencer Butte",
    genres: ["Indie Rock", "Alternative Rock", "Folk Rock"],
    city: "Eugene, OR",
    bio: "Rich, melodious indie-folk-rock from Eugene, blending bright acoustic guitars, warm violin melodies, and anthemic choruses.",
    contactEmail: "booking@spencerbutte.net",
    contactPhone: "(541) 555-0144",
    website: "www.spencerbutteband.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "willamette-wave-pop-or",
    name: "Willamette Wave",
    genres: ["Dream Pop", "Synthpop", "Indie Pop"],
    city: "Eugene, OR",
    bio: "Lush, sun-drenched dream pop with warm analog synthesizers, sparkling delay-laden guitars, and soaring, sweet lead vocals.",
    contactEmail: "waves@willamettewave.com",
    contactPhone: "Inquire",
    experienceLevel: "Regional Tour"
  },
  {
    id: "autzen-anthems-or",
    name: "Autzen Anthems",
    genres: ["Arena Rock", "Classic Rock", "Hard Rock"],
    city: "Eugene, OR",
    bio: "High-power arena rock designed for maximum crowd participation, featuring massive choruses, driving drums, and screaming guitar solos.",
    contactEmail: "autzenanthems@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "coburg-crossroads-or",
    name: "Coburg Crossroads",
    genres: ["Bluegrass", "Acoustic", "Traditional Folk"],
    city: "Eugene, OR",
    bio: "Traditional acoustic bluegrass pickers keeping the old-time mountain sounds alive with banjo, fiddle, mandolin, and upright bass.",
    contactEmail: "booking@coburgcrossroads.org",
    contactPhone: "(541) 555-1219",
    experienceLevel: "Local"
  },
  {
    id: "eugene-echoes-or",
    name: "Eugene Echoes",
    genres: ["Psychedelic Rock", "Space Rock", "Acid Rock"],
    city: "Eugene, OR",
    bio: "Trippy, long-form instrumental jams, vintage organ swells, space-delay guitars, and a deeply immersive cosmic live projection show.",
    contactEmail: "echoes@eugeneunderground.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "skinner-butte-sound-or",
    name: "Skinner Butte Sound",
    genres: ["Indie Folk", "Acoustic", "Singer-Songwriter"],
    city: "Eugene, OR",
    bio: "Heartfelt acoustic fingerpicking, delicate acoustic cello arrangements, and deeply expressive lead vocals exploring Oregon's trails.",
    contactEmail: "skinnersound@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "springfield-sparks-or",
    name: "Springfield Sparks",
    genres: ["Synthpop", "Electro-Pop", "New Wave"],
    city: "Springfield, OR",
    bio: "Upbeat retro 1980s synthesizers, computerized drum beats, and bright neon vocal hooks that get any dance floor moving.",
    contactEmail: "sparks@springfieldpop.com",
    contactPhone: "(541) 555-9018",
    experienceLevel: "Local"
  },
  {
    id: "cascade-cascade-or",
    name: "Cascade Cascade",
    genres: ["Math Rock", "Emo", "Indie Rock"],
    city: "Springfield, OR",
    bio: "Sparkling, clean tapped guitar melodies, complex odd-time signatures, and expressive, emotional lyrical narratives.",
    contactEmail: "cascadeband@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "umpqua-underground-or",
    name: "Umpqua Underground",
    genres: ["Hardcore Punk", "Noise Rock", "Alternative"],
    city: "Roseburg, OR",
    bio: "Raw, blistering punk rock straight out of Southern Oregon. Furious drumming, heavy feedback fuzz guitars, and screaming vocals.",
    contactEmail: "booking@umpquaunderground.org",
    contactPhone: "(541) 555-9011",
    experienceLevel: "Local"
  },
  {
    id: "roseburg-rhythm-or",
    name: "Roseburg Rhythm",
    genres: ["Classic Country", "Honky Tonk", "Americana"],
    city: "Roseburg, OR",
    bio: "Authentic, dusty Southern Oregon country twang with pedal steel, chicken-picked telecasters, and deep country baritone vocals.",
    contactEmail: "roseburgrhythm@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "douglas-county-dirt-or",
    name: "Douglas County Dirt",
    genres: ["Stoner Metal", "Doom Metal", "Sludge"],
    city: "Roseburg, OR",
    bio: "Screaming, down-tuned stoner-doom sludge drenched in heavy fuzz, with crushing, slow tempos and thunderous vocals.",
    contactEmail: "douglascountydirt@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "rogue-river-revival-or",
    name: "Rogue River Revival",
    genres: ["Southern Rock", "Classic Rock", "Blues Rock"],
    city: "Grants Pass, OR",
    bio: "High-volume twin guitar southern rock capturing the wild spirit of the Rogue River with screaming slide guitar solos and powerful gravelly vocals.",
    contactEmail: "booking@rogueriverrevival.com",
    contactPhone: "(541) 555-4019",
    website: "www.rogueriverrevival.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "grants-pass-groove-or",
    name: "Grants Pass Groove",
    genres: ["Funk", "Soul", "R&B"],
    city: "Grants Pass, OR",
    bio: "An energetic 7-piece funk collective featuring popping slap bass, crisp trumpet blasts, and smooth, soulful lead vocal harmonies.",
    contactEmail: "gpgroove@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "hellgate-horns-or",
    name: "Hellgate Horns",
    genres: ["Ska", "Reggae Rock", "Punk"],
    city: "Grants Pass, OR",
    bio: "A blast of upbeat ska punk with rapid horn sections, heavy third-wave offbeat guitar stabs, and highly active stage energy.",
    contactEmail: "hellgatehorns@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "table-rock-tremolo-or",
    name: "Table Rock Tremolo",
    genres: ["Surf Rock", "Instrumental Rock"],
    city: "Medford, OR",
    bio: "Reverb-soaked instrumental surf guitars, fast double-picked runs, and pounding drums inspired by classic surf and spaghetti westerns.",
    contactEmail: "tremolo@tablerocksurf.com",
    contactPhone: "(541) 555-0820",
    experienceLevel: "Local"
  },
  {
    id: "bear-creek-brass-or",
    name: "Bear Creek Brass",
    genres: ["Jazz", "Funk", "Soul"],
    city: "Medford, OR",
    bio: "A high-power brass band taking over Medford with tight syncopations, popping bass grooves, and classic, warm horn textures.",
    contactEmail: "bearcreekbrass@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "medford-metal-or",
    name: "Medford Metal",
    genres: ["Thrash Metal", "Speed Metal", "Hard Rock"],
    city: "Medford, OR",
    bio: "Fast, aggressive thrash metal with precise down-picked rhythms, blazing guitar sweeps, and commanding speed metal vocals.",
    contactEmail: "booking@medfordmetal.org",
    contactPhone: "(541) 555-9012",
    experienceLevel: "Local"
  },
  {
    id: "pear-blossom-pop-or",
    name: "Pear Blossom Pop",
    genres: ["Indie Pop", "Acoustic Pop", "Indie Rock"],
    city: "Medford, OR",
    bio: "Breezy, charming indie pop with acoustic strumming, keyboard melodies, and beautiful, catchy hooks celebrating Southern Oregon spring.",
    contactEmail: "pearblossompop@gmail.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "jacksonville-jive-or",
    name: "Jacksonville Jive",
    genres: ["Swing Jazz", "Big Band", "Jump Blues"],
    city: "Ashland, OR",
    bio: "A lively, retro swing and jump blues collective bringing vintage 1940s dance energy, screaming saxophone, and elegant jazz vocals.",
    contactEmail: "booking@jacksonvillejive.com",
    contactPhone: "(541) 555-3822",
    website: "www.jacksonvillejive.com",
    experienceLevel: "Regional Tour"
  },
  {
    id: "ashland-alchemy-or",
    name: "Ashland Alchemy",
    genres: ["Psychedelic Folk", "Americana", "Acid Rock"],
    city: "Ashland, OR",
    bio: "Weaving mystic, poetic lyrics with intricate fingerpicked acoustic guitars, sweeping cello, and cosmic space-delay electric accents.",
    contactEmail: "alchemy@ashlandmusic.org",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "lithia-springs-or",
    name: "Lithia Springs",
    genres: ["Ambient", "Dream Pop", "Shoegaze"],
    city: "Ashland, OR",
    bio: "Hypnotic, liquid guitar delay washes, shimmering analog synthesizers, and ethereal, angelic vocal harmonies floating above.",
    contactEmail: "lithiasprings@dreamy.net",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  },
  {
    id: "siskiyou-symphony-or",
    name: "Siskiyou Symphony",
    genres: ["Chamber Folk", "Indie Folk", "Acoustic"],
    city: "Ashland, OR",
    bio: "A rich acoustic chamber folk collective utilizing acoustic guitars, violin, viola, cello, and pristine choral-style vocal layering.",
    contactEmail: "booking@siskiyousymphony.org",
    contactPhone: "(541) 555-0914",
    website: "www.siskiyousymphony.org",
    experienceLevel: "Regional Tour"
  },
  {
    id: "rogue-valley-rhythm-or",
    name: "Rogue Valley Rhythm",
    genres: ["Country", "Americana", "Roots Rock"],
    city: "Medford, OR",
    bio: "Spirited country-rock and Americana pickers with beautiful fiddle solos, warm upright bass, and authentic country vocals.",
    contactEmail: "rhythm@roguevalleymusic.com",
    contactPhone: "Inquire",
    experienceLevel: "Local"
  }
];

const generateAdditionalBands = (): AvailableBand[] => {
  const prefixes = [
    "Electric", "Midnight", "Crimson", "Golden", "Pacific", "Cascadia", "Alpine", "Sunset", "Coastal", "Velvet",
    "Bitter", "Broken", "Whispering", "Phantom", "Silver", "Rogue", "Neon", "Astro", "Lunar", "Solar",
    "Cosmic", "Shimmering", "Ethereal", "Moody", "Silent", "Savage", "Restless", "Vintage", "Modern", "Deep",
    "Vibrant", "Static", "Magnetic", "Hollow", "Emerald", "Redwood", "Granite", "Cobalt", "Amber", "Mystic",
    "Rust", "Salt", "Mist", "Driftwood", "Timber", "Glacier", "Canyon", "Harbor", "Summit", "Cascade",
    "Solaris", "Nebula", "Shadow", "Starlight", "Tidal", "Echo", "Subtle", "Primal", "Arctic", "Urban",
    "Desert", "Oasis", "Wild", "Brave", "Lost", "Found", "Fallen", "Rising", "Hidden", "Ghost",
    "Haunted", "Blessed", "Cursed", "Heavy", "Sonic", "Loud", "Quiet", "Fuzzy", "Analog", "Retro"
  ];

  const suffixes = [
    "Tide", "Echoes", "Pulse", "Rebellion", "Mystics", "Waves", "Cruisers", "Strutters", "Revival", "Fuzz",
    "Winds", "Sound", "Shakers", "Bridge", "Lights", "Delta", "Quake", "Groove", "Pickers", "Coalition",
    "Noise", "Blues", "Syndicate", "Clay", "Currents", "Keys", "Whisper", "Solder", "Mud", "Strings",
    "Tremor", "Project", "Outlaws", "Cult", "Sparks", "Underground", "Rhythm", "Tremolo", "Brass", "Symphony",
    "Alchemists", "Springs", "Creek", "Wolves", "Spirits", "Runners", "Shadows", "Signals", "Vibers", "Club",
    "Ghosts", "Prophets", "Rebels", "Giants", "Phantoms", "Knights", "Nomads", "Astronauts", "Pioneers", "Wanderers",
    "Thieves", "Dreamers", "Drifters", "Outcasts", "Pilots", "Sailors", "Riders", "Kings", "Queens", "Lords",
    "Keepers", "Seekers", "Watchers", "Chasers", "Weavers", "Shapers", "Makers", "Builders", "Masters", "Legends"
  ];

  const cities = [
    "Seattle, WA", "Portland, OR", "San Francisco, CA", "Los Angeles, CA", "San Diego, CA",
    "Oakland, CA", "Sacramento, CA", "Eugene, OR", "Bellingham, WA", "Tacoma, WA",
    "Olympia, WA", "Medford, OR", "Ashland, OR", "Santa Cruz, CA", "San Jose, CA",
    "Berkeley, CA", "Long Beach, CA", "Bend, OR", "Astoria, OR", "Vancouver, WA",
    "Spokane, WA", "Everett, WA", "Salem, OR"
  ];

  const genreSets = [
    ["Indie Rock", "Alternative Rock"],
    ["Post-Punk", "Darkwave", "Goth Rock"],
    ["Dream Pop", "Shoegaze", "Indie Pop"],
    ["Ska Punk", "Reggae Rock"],
    ["Bluegrass", "Traditional Folk"],
    ["Heavy Metal", "Thrash Metal"],
    ["Funk", "Soul", "R&B"],
    ["Classic Rock", "Blues Rock"],
    ["Acoustic", "Singer-Songwriter"],
    ["Emo", "Math Rock"],
    ["Stoner Rock", "Doom Metal"],
    ["Psychedelic Rock", "Space Rock"],
    ["Synthpop", "Electronic"]
  ];

  const vibes = [
    "reverb-drenched, atmospheric",
    "high-energy, fuzzy",
    "delicate, intricate",
    "funky, driving",
    "dark, brooding",
    "warm, acoustic",
    "heavy, aggressive",
    "shimmering, nostalgic",
    "gritty, bluesy",
    "rhythmic, infectious"
  ];

  const performances = [
    "mind-bending live performances",
    "highly emotional storytelling",
    "infectious dance floor grooves",
    "relentless stage energy",
    "captivating vocal harmonies",
    "virtuoso acoustic picking",
    "sweeping cinematic soundscapes",
    "uncompromising, raw underground delivery",
    "tight rhythm sections and dual guitar leads",
    "beautifully layered instrumentation"
  ];

  const highlights = [
    "a highly active local fanbase",
    "an immersive live show with retro lights",
    "stellar reviews from regional indie blogs",
    "regular appearances at West Coast festivals",
    "a sound that pays homage to legendary PNW roots",
    "capturing the true essence of coastal alternative music",
    "unforgettable weekend club showcases",
    "deeply resonant lyrics that explore nature and mythology",
    "building a massive following on the DIY tour circuit",
    "perfectly blending modern production with vintage warmth"
  ];

  const experienceLevels: Array<"Local" | "Regional Tour" | "National Act"> = [
    "Local", "Local", "Local", "Regional Tour", "Regional Tour", "National Act"
  ];

  const generated: AvailableBand[] = [];

  for (let i = 0; i < 1250; i++) {
    // Unique pairing to avoid any collisions or repeated names
    const prefIndex = i % prefixes.length;
    const suffIndex = Math.floor(i / prefixes.length) % suffixes.length;
    
    const pref = prefixes[prefIndex];
    const suff = suffixes[suffIndex];
    const name = `${pref} ${suff}`;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `generated-${slug}-${i}`;
    
    const city = cities[(i * 3) % cities.length];
    const genres = genreSets[(i * 7) % genreSets.length];
    
    const vibe = vibes[i % vibes.length];
    const performance = performances[(i * 2) % performances.length];
    const highlight = highlights[(i * 4) % highlights.length];
    
    const bio = `An exciting ${genres.join(" / ")} outfit from ${city}, known for their ${vibe} sound, ${performance}, and ${highlight}.`;
    
    const experienceLevel = experienceLevels[i % experienceLevels.length];
    
    generated.push({
      id,
      name,
      genres,
      city,
      bio,
      contactEmail: `booking@${slug}.com`,
      musicUrl: `https://${slug.replace(/[^a-z0-9]/g, "")}.bandcamp.com`,
      contactPhone: `(${201 + (i % 790)}) 555-${String(1000 + i).padStart(4, "0")}`,
      experienceLevel
    });
  }

  return generated;
};

export const INITIAL_AVAILABLE_BANDS: AvailableBand[] = [
  ...STATIC_BANDS,
  ...ALL_OREGON_BANDS,
  ...ALL_WASHINGTON_BANDS,
  ...ALL_COLORADO_BANDS,
  ...ALL_ARIZONA_BANDS,
  ...ALL_CALIFORNIA_BANDS,
  ...ROCKIES_AND_WEST_BANDS,
  ...generateAdditionalBands()
];

