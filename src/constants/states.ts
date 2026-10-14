export interface StateInfo {
  code: string;
  name: string;
  region: "West Coast" | "Rockies & Plains" | "Midwest" | "South & Gulf" | "Northeast & Mid-Atlantic";
}

/**
 * All 48 continental contiguous US states + District of Columbia
 */
export const CONTINENTAL_US_STATES: StateInfo[] = [
  { code: "AL", name: "Alabama", region: "South & Gulf" },
  { code: "AZ", name: "Arizona", region: "Rockies & Plains" },
  { code: "AR", name: "Arkansas", region: "South & Gulf" },
  { code: "CA", name: "California", region: "West Coast" },
  { code: "CO", name: "Colorado", region: "Rockies & Plains" },
  { code: "CT", name: "Connecticut", region: "Northeast & Mid-Atlantic" },
  { code: "DE", name: "Delaware", region: "Northeast & Mid-Atlantic" },
  { code: "DC", name: "District of Columbia", region: "Northeast & Mid-Atlantic" },
  { code: "FL", name: "Florida", region: "South & Gulf" },
  { code: "GA", name: "Georgia", region: "South & Gulf" },
  { code: "ID", name: "Idaho", region: "Rockies & Plains" },
  { code: "IL", name: "Illinois", region: "Midwest" },
  { code: "IN", name: "Indiana", region: "Midwest" },
  { code: "IA", name: "Iowa", region: "Midwest" },
  { code: "KS", name: "Kansas", region: "Rockies & Plains" },
  { code: "KY", name: "Kentucky", region: "South & Gulf" },
  { code: "LA", name: "Louisiana", region: "South & Gulf" },
  { code: "ME", name: "Maine", region: "Northeast & Mid-Atlantic" },
  { code: "MD", name: "Maryland", region: "Northeast & Mid-Atlantic" },
  { code: "MA", name: "Massachusetts", region: "Northeast & Mid-Atlantic" },
  { code: "MI", name: "Michigan", region: "Midwest" },
  { code: "MN", name: "Minnesota", region: "Midwest" },
  { code: "MS", name: "Mississippi", region: "South & Gulf" },
  { code: "MO", name: "Missouri", region: "Midwest" },
  { code: "MT", name: "Montana", region: "Rockies & Plains" },
  { code: "NE", name: "Nebraska", region: "Rockies & Plains" },
  { code: "NV", name: "Nevada", region: "West Coast" },
  { code: "NH", name: "New Hampshire", region: "Northeast & Mid-Atlantic" },
  { code: "NJ", name: "New Jersey", region: "Northeast & Mid-Atlantic" },
  { code: "NM", name: "New Mexico", region: "Rockies & Plains" },
  { code: "NY", name: "New York", region: "Northeast & Mid-Atlantic" },
  { code: "NC", name: "North Carolina", region: "South & Gulf" },
  { code: "ND", name: "North Dakota", region: "Rockies & Plains" },
  { code: "OH", name: "Ohio", region: "Midwest" },
  { code: "OK", name: "Oklahoma", region: "South & Gulf" },
  { code: "OR", name: "Oregon", region: "West Coast" },
  { code: "PA", name: "Pennsylvania", region: "Northeast & Mid-Atlantic" },
  { code: "RI", name: "Rhode Island", region: "Northeast & Mid-Atlantic" },
  { code: "SC", name: "South Carolina", region: "South & Gulf" },
  { code: "SD", name: "South Dakota", region: "Rockies & Plains" },
  { code: "TN", name: "Tennessee", region: "South & Gulf" },
  { code: "TX", name: "Texas", region: "South & Gulf" },
  { code: "UT", name: "Utah", region: "Rockies & Plains" },
  { code: "VT", name: "Vermont", region: "Northeast & Mid-Atlantic" },
  { code: "VA", name: "Virginia", region: "South & Gulf" },
  { code: "WA", name: "Washington", region: "West Coast" },
  { code: "WV", name: "West Virginia", region: "Northeast & Mid-Atlantic" },
  { code: "WI", name: "Wisconsin", region: "Midwest" },
  { code: "WY", name: "Wyoming", region: "Rockies & Plains" }
];

export const CONTINENTAL_STATE_CODES = CONTINENTAL_US_STATES.map(s => s.code);

export const STATE_NAME_TO_CODE_MAP: Record<string, string> = {
  ...Object.fromEntries(CONTINENTAL_US_STATES.map(s => [s.name.toLowerCase(), s.code])),
  ...Object.fromEntries(CONTINENTAL_US_STATES.map(s => [s.code.toLowerCase(), s.code]))
};

/**
 * Key nationwide touring metropolitan hubs & routing gateways
 */
export const POPULAR_NATIONWIDE_HUBS: string[] = [
  "Seattle, WA",
  "Portland, OR",
  "San Francisco, CA",
  "Los Angeles, CA",
  "San Diego, CA",
  "Denver, CO",
  "Salt Lake City, UT",
  "Phoenix, AZ",
  "Austin, TX",
  "Dallas, TX",
  "Minneapolis, MN",
  "Chicago, IL",
  "Nashville, TN",
  "Memphis, TN",
  "New Orleans, LA",
  "Atlanta, GA",
  "Cleveland, OH",
  "Pittsburgh, PA",
  "Philadelphia, PA",
  "New York, NY",
  "Boston, MA",
  "Washington, DC"
];

/**
 * Robustly parses any freeform input string into { city, state }
 * Handles:
 * - "Austin, TX"
 * - "Austin Texas"
 * - "Chicago IL"
 * - "New York, New York"
 * - "Minneapolis"
 */
export function parseFreeformCityState(input: string, defaultState = "WA"): { city: string; state: string; formatted: string } {
  if (!input || !input.trim()) {
    return { city: "", state: defaultState, formatted: "" };
  }

  const raw = input.trim();

  // Pattern 1: Comma separated "City, ST" or "City, State Name"
  if (raw.includes(",")) {
    const parts = raw.split(",");
    const city = parts[0].trim();
    const statePart = parts.slice(1).join(",").trim().split(/\s+/)[0];
    const resolvedCode = STATE_NAME_TO_CODE_MAP[statePart.toLowerCase()] || statePart.toUpperCase();
    const finalState = CONTINENTAL_STATE_CODES.includes(resolvedCode) ? resolvedCode : statePart.toUpperCase();
    return {
      city,
      state: finalState,
      formatted: `${city}, ${finalState}`
    };
  }

  // Pattern 2: Space separated with state code at end e.g. "Chicago IL"
  const tokens = raw.split(/\s+/);
  if (tokens.length >= 2) {
    const lastToken = tokens[tokens.length - 1].toLowerCase();
    const resolvedCode = STATE_NAME_TO_CODE_MAP[lastToken];
    if (resolvedCode && CONTINENTAL_STATE_CODES.includes(resolvedCode)) {
      const city = tokens.slice(0, tokens.length - 1).join(" ").trim();
      return {
        city,
        state: resolvedCode,
        formatted: `${city}, ${resolvedCode}`
      };
    }
  }

  // Pattern 3: City only (fallback to default state or clean string)
  return {
    city: raw,
    state: defaultState,
    formatted: raw
  };
}
