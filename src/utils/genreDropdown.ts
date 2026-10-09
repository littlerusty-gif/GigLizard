/**
 * Master Genres Definition and Keyword Matching Utilities
 * Consolidates micro-genres into standard master categories.
 */

export interface MasterGenreOption {
  value: string;
  text: string;
  keywords: string[];
}

export const MASTER_GENRES: MasterGenreOption[] = [
  {
    value: "Rock",
    text: "Rock",
    keywords: [
      "rock",
      "classic rock",
      "hard rock",
      "alt rock",
      "alt-rock",
      "alternative rock",
      "garage rock",
      "psych rock",
      "psychedelic rock",
      "jam",
      "glam",
      "glam rock",
      "southern rock",
      "indie rock",
      "art rock",
      "prog rock",
      "progressive rock",
      "roots rock"
    ]
  },
  {
    value: "Alternative / Indie",
    text: "Alternative / Indie",
    keywords: [
      "alternative",
      "indie",
      "alt-rock",
      "alt rock",
      "grunge",
      "post-punk",
      "post punk",
      "emo",
      "shoegaze",
      "dream pop",
      "new wave",
      "lo-fi",
      "lofi",
      "indie rock",
      "indie pop",
      "math rock",
      "noise rock",
      "slowcore",
      "britpop"
    ]
  },
  {
    value: "Hard Rock / Metal",
    text: "Hard Rock / Metal",
    keywords: [
      "metal",
      "heavy metal",
      "doom",
      "doom metal",
      "sludge",
      "thrash",
      "stoner rock",
      "stoner metal",
      "hard rock",
      "heavy psych",
      "death metal",
      "black metal",
      "prog metal",
      "power metal",
      "nu metal",
      "metalcore"
    ]
  },
  {
    value: "Punk / Hardcore",
    text: "Punk / Hardcore",
    keywords: [
      "punk",
      "hardcore",
      "pop punk",
      "skate punk",
      "post-hardcore",
      "post hardcore",
      "crust",
      "riot grrrl",
      "street punk",
      "garage punk",
      "punk rock",
      "anarcho punk",
      "folk punk"
    ]
  },
  {
    value: "Country / Americana",
    text: "Country / Americana",
    keywords: [
      "country",
      "americana",
      "outlaw country",
      "bluegrass",
      "cowpunk",
      "western swing",
      "honky tonk",
      "alt-country",
      "classic country",
      "appalachian"
    ]
  },
  {
    value: "Folk / Acoustic",
    text: "Folk / Acoustic",
    keywords: [
      "folk",
      "acoustic",
      "singer-songwriter",
      "singer songwriter",
      "traditional folk",
      "chamber folk",
      "indie folk",
      "fingerstyle",
      "celtic folk"
    ]
  },
  {
    value: "Blues / Roots",
    text: "Blues / Roots",
    keywords: [
      "blues",
      "delta blues",
      "electric blues",
      "roots",
      "slide guitar",
      "chicago blues",
      "blues rock",
      "rhythm and blues",
      "r&b / blues"
    ]
  },
  {
    value: "Pop",
    text: "Pop",
    keywords: [
      "pop",
      "indie pop",
      "synthpop",
      "synth pop",
      "power pop",
      "dream pop",
      "chamber pop",
      "electropop",
      "dance pop",
      "art pop",
      "bubblegum"
    ]
  },
  {
    value: "Hip Hop / Rap",
    text: "Hip Hop / Rap",
    keywords: [
      "hip hop",
      "hip-hop",
      "rap",
      "trap",
      "boom bap",
      "alt-rap",
      "conscious rap",
      "underground hip hop",
      "freestyle",
      "mc"
    ]
  },
  {
    value: "Electronic / Synth / Dance",
    text: "Electronic / Synth / Dance",
    keywords: [
      "electronic",
      "synthwave",
      "dance",
      "house",
      "techno",
      "ambient",
      "chiptune",
      "chillwave",
      "edm",
      "electro",
      "idm",
      "downtempo",
      "synth"
    ]
  },
  {
    value: "Jazz / Soul / Funk",
    text: "Jazz / Soul / Funk",
    keywords: [
      "jazz",
      "soul",
      "funk",
      "r&b",
      "rhythm & blues",
      "bebop",
      "motown",
      "neo-soul",
      "neo soul",
      "brass",
      "groove",
      "fusion",
      "smooth jazz",
      "hard bop"
    ]
  },
  {
    value: "Latin / World",
    text: "Latin / World",
    keywords: [
      "latin",
      "cumbia",
      "salsa",
      "afrobeat",
      "celtic",
      "world",
      "bossa nova",
      "mariachi",
      "flamenco",
      "tango",
      "calypso",
      "balkan"
    ]
  },
  {
    value: "Reggae / Ska",
    text: "Reggae / Ska",
    keywords: [
      "reggae",
      "ska",
      "dub",
      "rocksteady",
      "two-tone",
      "two tone",
      "2-tone",
      "third wave ska",
      "ska-punk",
      "ska punk",
      "dancehall"
    ]
  },
  {
    value: "Tribute Bands (All)",
    text: "Tribute Bands (All)",
    keywords: [
      "tribute",
      "cover",
      "tribute band"
    ]
  }
];

/**
 * Checks if a band's data (genres, tags, bio, name) matches the given master genre
 */
export function matchesMasterGenre(
  masterGenreValue: string,
  band: {
    name: string;
    genres: string[];
    bio?: string;
  }
): boolean {
  if (!masterGenreValue || masterGenreValue === "All" || masterGenreValue === "") {
    return true;
  }

  const normalizedSelected = masterGenreValue.trim().toLowerCase();

  // Tribute special matching
  if (
    normalizedSelected === "tribute" ||
    normalizedSelected === "tribute bands (all)" ||
    normalizedSelected === "tribute bands"
  ) {
    const textCorpus = `${band.name} ${band.genres.join(" ")} ${band.bio || ""}`.toLowerCase();
    return textCorpus.includes("tribute") || textCorpus.includes("cover");
  }

  // Find configuration for this master genre
  const config = MASTER_GENRES.find(
    (g) =>
      g.value.toLowerCase() === normalizedSelected ||
      g.text.toLowerCase() === normalizedSelected
  );

  const keywords = config ? config.keywords : [normalizedSelected];
  const genresJoined = band.genres.join(" ").toLowerCase();
  const bioText = (band.bio || "").toLowerCase();
  const nameText = band.name.toLowerCase();

  return keywords.some((kw) => {
    const kwLower = kw.toLowerCase();
    
    // Check specific genres array first (exact or substring match within tag)
    const inGenres = band.genres.some((g) => {
      const gLower = g.toLowerCase().trim();
      return gLower === kwLower || gLower.includes(kwLower);
    });
    if (inGenres) return true;

    // Check bio or name with word boundaries or substring
    if (bioText.includes(kwLower) || nameText.includes(kwLower) || genresJoined.includes(kwLower)) {
      return true;
    }

    return false;
  });
}

/**
 * Alphabetizes or populates select dropdown with standard master genres
 * @param {string} selectSelector - CSS selector for the genre <select> element
 */
export function updateAndAlphabetizeGenreDropdown(selectSelector: string = "select"): void {
  if (typeof document === "undefined") return;

  const select = document.querySelector(selectSelector) as HTMLSelectElement | null;
  if (!select) {
    return;
  }

  // Preserve selected value if any
  const previousVal = select.value;

  // Clear existing options
  select.innerHTML = "";

  // Append default placeholder
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "All";
  defaultOpt.textContent = "All Genre Directives";
  select.appendChild(defaultOpt);

  // Append Master Genres
  MASTER_GENRES.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.value;
    opt.textContent = g.text;
    select.appendChild(opt);
  });

  if (previousVal && previousVal !== "All") {
    select.value = previousVal;
  }
}

// Bind to window for external/test invocation if in browser
if (typeof window !== "undefined") {
  (window as any).updateAndAlphabetizeGenreDropdown = updateAndAlphabetizeGenreDropdown;
}
