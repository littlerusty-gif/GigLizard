import { TourStop, TourVenueStop } from "../types";
import { findLodgingForCity } from "./tourLodgingData";
import { MUSIC_VENUES } from "../data/venues";

export interface CorridorCity {
  city: string;
  state: string;
  label: string; // "Seattle, WA"
  lat: number;
  lng: number;
  tier: "Major Hub" | "Regional Stronghold" | "College Town" | "Connector";
  sceneHighlight: string;
}

export const KNOWN_CORRIDOR_CITIES: CorridorCity[] = [
  // Pacific Northwest & Cascadia
  { city: "Bellingham", state: "WA", label: "Bellingham, WA", lat: 48.7519, lng: -122.4787, tier: "College Town", sceneHighlight: "High-energy WWU college crowd & active indie/punk circuit." },
  { city: "Everett", state: "WA", label: "Everett, WA", lat: 47.9790, lng: -122.2021, tier: "Connector", sceneHighlight: "North Sound rock & metal corridor hub." },
  { city: "Seattle", state: "WA", label: "Seattle, WA", lat: 47.6062, lng: -122.3321, tier: "Major Hub", sceneHighlight: "Historic music epicenter with legendary club venues in Capitol Hill & Belltown." },
  { city: "Tacoma", state: "WA", label: "Tacoma, WA", lat: 47.2529, lng: -122.4443, tier: "Regional Stronghold", sceneHighlight: "Grit City DIY scene, vibrant dive venues along 6th Ave." },
  { city: "Olympia", state: "WA", label: "Olympia, WA", lat: 47.0379, lng: -122.9007, tier: "College Town", sceneHighlight: "Capital city riot grrrl, punk, and indie roots around downtown." },
  { city: "Vancouver", state: "WA", label: "Vancouver, WA", lat: 45.6387, lng: -122.6615, tier: "Connector", sceneHighlight: "Columbia River launch point right across from Portland." },
  { city: "Portland", state: "OR", label: "Portland, OR", lat: 45.5152, lng: -122.6784, tier: "Major Hub", sceneHighlight: "Dense creative hub with passionate music patrons across Eastside & downtown." },
  { city: "Salem", state: "OR", label: "Salem, OR", lat: 44.9429, lng: -123.0351, tier: "Connector", sceneHighlight: "Mid-valley bridge stop connecting northern and southern Oregon tours." },
  { city: "Corvallis", state: "OR", label: "Corvallis, OR", lat: 44.5646, lng: -123.2620, tier: "College Town", sceneHighlight: "OSU campus community, fertile ground for energetic touring openers." },
  { city: "Eugene", state: "OR", label: "Eugene, OR", lat: 44.0521, lng: -123.0868, tier: "Regional Stronghold", sceneHighlight: "Iconic university live music town with strong draw for indie & jam acts." },
  { city: "Bend", state: "OR", label: "Bend, OR", lat: 44.0582, lng: -121.3153, tier: "Regional Stronghold", sceneHighlight: "Central Oregon craft beer & outdoor music scene with generous crowds along US-97." },
  { city: "Hood River", state: "OR", label: "Hood River, OR", lat: 45.7054, lng: -121.5215, tier: "Connector", sceneHighlight: "Columbia River Gorge craft beer, cider, and energetic indie music rooms along I-84." },
  { city: "Medford", state: "OR", label: "Medford, OR", lat: 42.3265, lng: -122.8756, tier: "Connector", sceneHighlight: "Rogue Valley tour anchor connecting Oregon into Northern California." },
  { city: "Ashland", state: "OR", label: "Ashland, OR", lat: 42.1946, lng: -122.7095, tier: "College Town", sceneHighlight: "Artistic mountain enclave with lively summer festivals and listening rooms." },
  { city: "Spokane", state: "WA", label: "Spokane, WA", lat: 47.6588, lng: -117.4260, tier: "Regional Stronghold", sceneHighlight: "Inland Northwest touring anchor connecting Washington to Idaho and Montana." },
  { city: "Yakima", state: "WA", label: "Yakima, WA", lat: 46.6021, lng: -120.5059, tier: "Connector", sceneHighlight: "Central Washington agricultural valley hub along I-82 and US-97." },
  { city: "Ellensburg", state: "WA", label: "Ellensburg, WA", lat: 47.0006, lng: -120.5479, tier: "College Town", sceneHighlight: "Central Washington CWU college town connecting I-90 and US-97." },
  { city: "Wenatchee", state: "WA", label: "Wenatchee, WA", lat: 47.4235, lng: -120.3103, tier: "Connector", sceneHighlight: "Apple capital music rooms in the Cascade foothills along US-97." },
  { city: "Boise", state: "ID", label: "Boise, ID", lat: 43.6150, lng: -116.2023, tier: "Regional Stronghold", sceneHighlight: "Treefort Music Fest capital, highly supportive community for touring bands." },
  { city: "Missoula", state: "MT", label: "Missoula, MT", lat: 46.8721, lng: -113.9940, tier: "College Town", sceneHighlight: "Rocky Mountain indie stronghold with dedicated college music fans." },
  { city: "Bozeman", state: "MT", label: "Bozeman, MT", lat: 45.6770, lng: -111.0429, tier: "College Town", sceneHighlight: "Bustling Montana mountain town with active student-driven live scene." },
  { city: "Vancouver", state: "BC", label: "Vancouver, BC", lat: 49.2827, lng: -123.1207, tier: "Major Hub", sceneHighlight: "Global coastal metropolis with renowned stages in Commercial Drive & Gastown." },
  { city: "Victoria", state: "BC", label: "Victoria, BC", lat: 48.4284, lng: -123.3656, tier: "Regional Stronghold", sceneHighlight: "Vancouver Island hub with cozy pubs and historic live music theaters." },

  // California Corridors
  { city: "Redding", state: "CA", label: "Redding, CA", lat: 40.5865, lng: -122.3917, tier: "Connector", sceneHighlight: "Northern California I-5 gateway rest stop and tour connector." },
  { city: "Chico", state: "CA", label: "Chico, CA", lat: 39.7285, lng: -121.8375, tier: "College Town", sceneHighlight: "Legendary college town known for rowdy and welcoming basement/club shows." },
  { city: "Sacramento", state: "CA", label: "Sacramento, CA", lat: 38.5816, lng: -121.4944, tier: "Regional Stronghold", sceneHighlight: "California capital city with booming Midtown live music bars." },
  { city: "San Francisco", state: "CA", label: "San Francisco, CA", lat: 37.7749, lng: -122.4194, tier: "Major Hub", sceneHighlight: "Iconic music history from Mission District dives to Fillmore-class halls." },
  { city: "Oakland", state: "CA", label: "Oakland, CA", lat: 37.8044, lng: -122.2712, tier: "Major Hub", sceneHighlight: "Vibrant East Bay underground art and indie scene around Telegraph Ave." },
  { city: "San Jose", state: "CA", label: "San Jose, CA", lat: 37.3382, lng: -121.8863, tier: "Regional Stronghold", sceneHighlight: "South Bay urban core with diverse venue options and downtown clubs." },
  { city: "Santa Cruz", state: "CA", label: "Santa Cruz, CA", lat: 36.9741, lng: -122.0308, tier: "College Town", sceneHighlight: "Surf and skate punk haven, legendary catalyst for touring West Coast acts." },
  { city: "Fresno", state: "CA", label: "Fresno, CA", lat: 36.7468, lng: -119.7726, tier: "Connector", sceneHighlight: "Central Valley hub along CA-99 with passionate local music followings." },
  { city: "Bakersfield", state: "CA", label: "Bakersfield, CA", lat: 35.3733, lng: -119.0187, tier: "Connector", sceneHighlight: "Birthplace of the Bakersfield Sound, essential stop before the Grapevine." },
  { city: "Santa Barbara", state: "CA", label: "Santa Barbara, CA", lat: 34.4208, lng: -119.6982, tier: "College Town", sceneHighlight: "Coastal student resort community along State Street with enthusiastic crowds." },
  { city: "Los Angeles", state: "CA", label: "Los Angeles, CA", lat: 34.0522, lng: -118.2437, tier: "Major Hub", sceneHighlight: "Global music industry titan with endless landmark venues in Silver Lake, Echo Park, & West Hollywood." },
  { city: "Long Beach", state: "CA", label: "Long Beach, CA", lat: 33.7701, lng: -118.1937, tier: "Regional Stronghold", sceneHighlight: "SoCal coastal scene with eclectic retro rooms and vibrant harbor nights." },
  { city: "San Diego", state: "CA", label: "San Diego, CA", lat: 32.7157, lng: -117.1611, tier: "Major Hub", sceneHighlight: "Southern border powerhouse with beloved clubs in North Park & Gaslamp." },

  // Mountain & Southwest Corridors
  { city: "Reno", state: "NV", label: "Reno, NV", lat: 39.5296, lng: -119.8138, tier: "Regional Stronghold", sceneHighlight: "High-desert casino & art town with active indie underground rooms." },
  { city: "Las Vegas", state: "NV", label: "Las Vegas, NV", lat: 36.1699, lng: -115.1398, tier: "Major Hub", sceneHighlight: "World entertainment capital with flourishing local scene in the Downtown Arts District." },
  { city: "Salt Lake City", state: "UT", label: "Salt Lake City, UT", lat: 40.7608, lng: -111.8910, tier: "Major Hub", sceneHighlight: "Crossroads of the West with one of the most dedicated indie & hardcore fanbases." },
  { city: "Phoenix", state: "AZ", label: "Phoenix, AZ", lat: 33.4484, lng: -112.0740, tier: "Major Hub", sceneHighlight: "Valley of the Sun with expansive downtown and Tempe college corridor." },
  { city: "Tucson", state: "AZ", label: "Tucson, AZ", lat: 32.2226, lng: -110.9747, tier: "College Town", sceneHighlight: "Rich southwestern desert folk, punk, and psych-rock enclave." },
  { city: "Denver", state: "CO", label: "Denver, CO", lat: 39.7392, lng: -104.9903, tier: "Major Hub", sceneHighlight: "Mile High cultural heavyweight with premier live clubs along Colfax and RiNo." },
  { city: "Boulder", state: "CO", label: "Boulder, CO", lat: 40.0150, lng: -105.2705, tier: "College Town", sceneHighlight: "CU campus town at the Flatirons, fertile stop for jam and indie bands." },
  { city: "Fort Collins", state: "CO", label: "Fort Collins, CO", lat: 40.5853, lng: -105.0844, tier: "College Town", sceneHighlight: "Northern Colorado craft capital with devoted Old Town music venues." },
  { city: "Colorado Springs", state: "CO", label: "Colorado Springs, CO", lat: 38.8339, lng: -104.8214, tier: "Regional Stronghold", sceneHighlight: "Pikes Peak corridor anchor with growing downtown live options." },
  { city: "Albuquerque", state: "NM", label: "Albuquerque, NM", lat: 35.0844, lng: -106.6504, tier: "Regional Stronghold", sceneHighlight: "Route 66 cultural hub with historic theaters and receptive indie scenes." },

  // Texas & South Central Corridors (I-35, I-10, I-20)
  { city: "Austin", state: "TX", label: "Austin, TX", lat: 30.2672, lng: -97.7431, tier: "Major Hub", sceneHighlight: "Live Music Capital of the World along Red River Cultural District." },
  { city: "San Antonio", state: "TX", label: "San Antonio, TX", lat: 29.4241, lng: -98.4936, tier: "Regional Stronghold", sceneHighlight: "Historic Alamo City with heavy rock and punk enthusiast circuits." },
  { city: "Houston", state: "TX", label: "Houston, TX", lat: 29.7604, lng: -95.3698, tier: "Major Hub", sceneHighlight: "Vast metropolis with storied clubs in Montrose and the Heights." },
  { city: "Dallas", state: "TX", label: "Dallas, TX", lat: 32.7767, lng: -96.7970, tier: "Major Hub", sceneHighlight: "Deep Ellum historic entertainment epicenter with dense club density." },
  { city: "Fort Worth", state: "TX", label: "Fort Worth, TX", lat: 32.7555, lng: -97.3308, tier: "Regional Stronghold", sceneHighlight: "Stockyards honky-tonks and lively Magnolia Avenue indie stages." },
  { city: "Denton", state: "TX", label: "Denton, TX", lat: 33.2148, lng: -97.1331, tier: "College Town", sceneHighlight: "Fertile UNT music hotbed, legendary testing ground for touring acts." },
  { city: "Waco", state: "TX", label: "Waco, TX", lat: 31.5493, lng: -97.1467, tier: "Connector", sceneHighlight: "I-35 bridge market connecting Dallas and Austin." },
  { city: "El Paso", state: "TX", label: "El Paso, TX", lat: 31.7619, lng: -106.4850, tier: "Regional Stronghold", sceneHighlight: "I-10 border fortress with rich cross-cultural desert rock roots." },
  { city: "Amarillo", state: "TX", label: "Amarillo, TX", lat: 35.2220, lng: -101.8313, tier: "Connector", sceneHighlight: "Crucial I-40 Panhandle link between New Mexico and Oklahoma." },

  // Midwest Corridors (I-80, I-90, I-70, I-35)
  { city: "Chicago", state: "IL", label: "Chicago, IL", lat: 41.8781, lng: -87.6298, tier: "Major Hub", sceneHighlight: "Midwest musical giant with renowned neighborhood stages in Wicker Park & Logan Square." },
  { city: "Minneapolis", state: "MN", label: "Minneapolis, MN", lat: 44.9778, lng: -93.2650, tier: "Major Hub", sceneHighlight: "Twin Cities scene famous for legendary indie rock and First Avenue grit." },
  { city: "St. Paul", state: "MN", label: "St. Paul, MN", lat: 44.9537, lng: -93.0900, tier: "Regional Stronghold", sceneHighlight: "Twin Cities counterpart with great listening rooms along University Ave." },
  { city: "Milwaukee", state: "WI", label: "Milwaukee, WI", lat: 43.0389, lng: -87.9065, tier: "Regional Stronghold", sceneHighlight: "Lake Michigan stronghold with vibrant Bay View rooms and Summerfest history." },
  { city: "Madison", state: "WI", label: "Madison, WI", lat: 43.0731, lng: -89.4012, tier: "College Town", sceneHighlight: "UW-Madison student corridor on State Street and beloved High Noon Saloon." },
  { city: "Des Moines", state: "IA", label: "Des Moines, IA", lat: 41.5868, lng: -93.6250, tier: "Regional Stronghold", sceneHighlight: "I-35 / I-80 crossroads with electric East Village and downtown venues." },
  { city: "Iowa City", state: "IA", label: "Iowa City, IA", lat: 41.6611, lng: -91.5302, tier: "College Town", sceneHighlight: "UNESCO City of Literature with storied Mission Creek festival roots." },
  { city: "Omaha", state: "NE", label: "Omaha, NE", lat: 41.2565, lng: -95.9345, tier: "Regional Stronghold", sceneHighlight: "Saddle Creek indie-rock cradle and Benson neighborhood club strip." },
  { city: "Lincoln", state: "NE", label: "Lincoln, NE", lat: 40.8136, lng: -96.7026, tier: "College Town", sceneHighlight: "UNL college corridor and Haymarket historic live entertainment district." },
  { city: "Kansas City", state: "MO", label: "Kansas City, MO", lat: 39.0997, lng: -94.5786, tier: "Major Hub", sceneHighlight: "Historic 18th & Vine jazz cradle and vibrant Crossroads Arts District stages." },
  { city: "St. Louis", state: "MO", label: "St. Louis, MO", lat: 38.6270, lng: -90.1994, tier: "Major Hub", sceneHighlight: "Gateway to the West with legendary live circuit in The Grove and Cherokee St." },
  { city: "Columbia", state: "MO", label: "Columbia, MO", lat: 38.9517, lng: -92.3341, tier: "College Town", sceneHighlight: "Mizzou college anchor midway along the I-70 corridor." },
  { city: "Wichita", state: "KS", label: "Wichita, KS", lat: 37.6872, lng: -97.3301, tier: "Regional Stronghold", sceneHighlight: "Southern plains I-35 anchor with welcoming DIY and theater stages." },
  { city: "Lawrence", state: "KS", label: "Lawrence, KS", lat: 38.9717, lng: -95.2353, tier: "College Town", sceneHighlight: "Iconic KU college music scene with historic Granada and Bottleneck clubs." },
  { city: "Indianapolis", state: "IN", label: "Indianapolis, IN", lat: 39.7684, lng: -86.1581, tier: "Major Hub", sceneHighlight: "Crossroads of America with booming Fountain Square and Broad Ripple stages." },
  { city: "Bloomington", state: "IN", label: "Bloomington, IN", lat: 39.1653, lng: -86.5264, tier: "College Town", sceneHighlight: "IU campus enclave with passionate student crowds and legendary Bluebird nightspot." },
  { city: "Detroit", state: "MI", label: "Detroit, MI", lat: 42.3314, lng: -83.0458, tier: "Major Hub", sceneHighlight: "Motor City musical powerhouse: birthplace of Motown, techno, and proto-punk." },
  { city: "Grand Rapids", state: "MI", label: "Grand Rapids, MI", lat: 42.9634, lng: -85.6681, tier: "Regional Stronghold", sceneHighlight: "Thriving western Michigan music community and brewery concert series." },
  { city: "Cleveland", state: "OH", label: "Cleveland, OH", lat: 41.4993, lng: -81.6944, tier: "Major Hub", sceneHighlight: "Rock and Roll Hall of Fame home with gritty Beachland and Grog Shop stages." },
  { city: "Columbus", state: "OH", label: "Columbus, OH", lat: 39.9612, lng: -82.9988, tier: "Major Hub", sceneHighlight: "High Street corridor, OSU energy, and prominent independent touring circuit." },
  { city: "Cincinnati", state: "OH", label: "Cincinnati, OH", lat: 39.1031, lng: -84.5120, tier: "Major Hub", sceneHighlight: "Over-the-Rhine cultural revival and legendary King Records heritage." },

  // Southeast & Gulf Corridors (I-40, I-10, I-65, I-75, I-85, I-95)
  { city: "Nashville", state: "TN", label: "Nashville, TN", lat: 36.1627, lng: -86.7816, tier: "Major Hub", sceneHighlight: "Music City USA: unmatched songwriter and touring concentration from East Nashville to Broadway." },
  { city: "Memphis", state: "TN", label: "Memphis, TN", lat: 35.1495, lng: -90.0490, tier: "Major Hub", sceneHighlight: "Beale Street blues, Sun Studio rockabilly, and vibrant Midtown live stages." },
  { city: "Knoxville", state: "TN", label: "Knoxville, TN", lat: 35.9606, lng: -83.9207, tier: "College Town", sceneHighlight: "Historic Market Square and UT college strip along the I-40 Appalachian corridor." },
  { city: "Chattanooga", state: "TN", label: "Chattanooga, TN", lat: 35.0456, lng: -85.3097, tier: "Regional Stronghold", sceneHighlight: "Scenic City bridge connecting Nashville, Knoxville, and Atlanta." },
  { city: "Atlanta", state: "GA", label: "Atlanta, GA", lat: 33.7490, lng: -84.3880, tier: "Major Hub", sceneHighlight: "Southern cultural engine with legendary rooms in Little Five Points, East Atlanta, & Midtown." },
  { city: "Athens", state: "GA", label: "Athens, GA", lat: 33.9519, lng: -83.3576, tier: "College Town", sceneHighlight: "Historic college-rock capital (R.E.M., B-52's) centered on the 40 Watt Club." },
  { city: "Savannah", state: "GA", label: "Savannah, GA", lat: 32.0809, lng: -81.0912, tier: "Regional Stronghold", sceneHighlight: "Historic coastal city along I-95 with creative SCAD arts and indie nightlife." },
  { city: "New Orleans", state: "LA", label: "New Orleans, LA", lat: 29.9511, lng: -90.0715, tier: "Major Hub", sceneHighlight: "World-class musical pilgrimage along Frenchmen Street, Uptown, and the Marigny." },
  { city: "Baton Rouge", state: "LA", label: "Baton Rouge, LA", lat: 30.4515, lng: -91.1871, tier: "College Town", sceneHighlight: "LSU corridor and riverfront clubs along I-10." },
  { city: "Lafayette", state: "LA", label: "Lafayette, LA", lat: 30.2241, lng: -92.0198, tier: "Regional Stronghold", sceneHighlight: "Cajun & Zydeco capital with warm, high-participation dance halls." },
  { city: "Birmingham", state: "AL", label: "Birmingham, AL", lat: 33.5186, lng: -86.8104, tier: "Regional Stronghold", sceneHighlight: "Magic City revival featuring historic Avondale and downtown concert halls." },
  { city: "Mobile", state: "AL", label: "Mobile, AL", lat: 30.6954, lng: -88.0399, tier: "Connector", sceneHighlight: "Gulf Coast I-10 connector linking New Orleans and the Florida Panhandle." },
  { city: "Jackson", state: "MS", label: "Jackson, MS", lat: 32.2988, lng: -90.1848, tier: "Regional Stronghold", sceneHighlight: "City with Soul, heart of the Mississippi Blues Trail along I-55." },
  { city: "Little Rock", state: "AR", label: "Little Rock, AR", lat: 34.7465, lng: -92.2896, tier: "Regional Stronghold", sceneHighlight: "River Market entertainment district anchoring the I-40 corridor across Arkansas." },
  { city: "Fayetteville", state: "AR", label: "Fayetteville, AR", lat: 36.0822, lng: -94.1719, tier: "College Town", sceneHighlight: "Ozarks cultural gem on Dickson Street next to University of Arkansas." },
  { city: "Oklahoma City", state: "OK", label: "Oklahoma City, OK", lat: 35.4676, lng: -97.5164, tier: "Major Hub", sceneHighlight: "I-40 / I-35 junction featuring vibrant Bricktown and Plaza District stages." },
  { city: "Tulsa", state: "OK", label: "Tulsa, OK", lat: 36.1540, lng: -95.9928, tier: "Regional Stronghold", sceneHighlight: "Historic Cain's Ballroom and Brady Arts District live rooms." },
  { city: "Louisville", state: "KY", label: "Louisville, KY", lat: 38.2527, lng: -85.7585, tier: "Regional Stronghold", sceneHighlight: "Highland neighborhood indie clubs, rich bourbon heritage, and punk legacy." },
  { city: "Lexington", state: "KY", label: "Lexington, KY", lat: 38.0406, lng: -84.5037, tier: "College Town", sceneHighlight: "UK campus corridor and Bluegrass heartland listening rooms." },
  { city: "Asheville", state: "NC", label: "Asheville, NC", lat: 35.5951, lng: -82.5515, tier: "Regional Stronghold", sceneHighlight: "Blue Ridge indie/mountain music epicenter: Orange Peel and South Slope breweries." },
  { city: "Charlotte", state: "NC", label: "Charlotte, NC", lat: 35.2271, lng: -80.8431, tier: "Major Hub", sceneHighlight: "Queen City arts hub anchored by NoDa (North Davidson) arts district stages." },
  { city: "Raleigh", state: "NC", label: "Raleigh, NC", lat: 35.7796, lng: -78.6382, tier: "Major Hub", sceneHighlight: "Research Triangle live capital with energetic clubs and Hopscotch festival legacy." },
  { city: "Durham", state: "NC", label: "Durham, NC", lat: 35.9940, lng: -78.8986, tier: "Regional Stronghold", sceneHighlight: "Historic warehouse district and revitalized tobacco mills hosting premier acts." },
  { city: "Charleston", state: "SC", label: "Charleston, SC", lat: 32.7765, lng: -79.9311, tier: "Regional Stronghold", sceneHighlight: "Lowcountry destination with booming King Street and Upper Meeting concert rooms." },
  { city: "Columbia", state: "SC", label: "Columbia, SC", lat: 34.0007, lng: -81.0348, tier: "College Town", sceneHighlight: "Five Points college strip and Vista live music venues." },
  { city: "Jacksonville", state: "FL", label: "Jacksonville, FL", lat: 30.3322, lng: -81.6557, tier: "Major Hub", sceneHighlight: "Gateway to Florida at the I-95 / I-10 junction, historic rock haven in Five Points." },
  { city: "Orlando", state: "FL", label: "Orlando, FL", lat: 28.5383, lng: -81.3792, tier: "Major Hub", sceneHighlight: "Downtown live scene and Mills 50 indie stronghold with eager crowds." },
  { city: "Tampa", state: "FL", label: "Tampa, FL", lat: 27.9506, lng: -82.4572, tier: "Major Hub", sceneHighlight: "Historic Ybor City brick-lined music street and death-metal / punk heritage." },
  { city: "St. Petersburg", state: "FL", label: "St. Petersburg, FL", lat: 27.7676, lng: -82.6403, tier: "Regional Stronghold", sceneHighlight: "Vibrant Central Avenue arts corridor with beloved outdoor venues." },
  { city: "Miami", state: "FL", label: "Miami, FL", lat: 25.7617, lng: -80.1918, tier: "Major Hub", sceneHighlight: "Global nightlife metropolis with cutting-edge rooms in Wynwood and Little Haiti." },
  { city: "Fort Lauderdale", state: "FL", label: "Fort Lauderdale, FL", lat: 26.1224, lng: -80.1373, tier: "Regional Stronghold", sceneHighlight: "South Florida coastal strip and downtown live stages." },

  // Mid-Atlantic & Northeast Corridors (I-95, I-80, I-90, I-70)
  { city: "Pittsburgh", state: "PA", label: "Pittsburgh, PA", lat: 40.4406, lng: -79.9959, tier: "Major Hub", sceneHighlight: "Steel City revival with iconic clubs across the South Side and Lawrenceville." },
  { city: "Philadelphia", state: "PA", label: "Philadelphia, PA", lat: 39.9526, lng: -75.1652, tier: "Major Hub", sceneHighlight: "Legendary DIY, punk, and indie circuit from Fishtown to South Street." },
  { city: "Baltimore", state: "MD", label: "Baltimore, MD", lat: 39.2904, lng: -76.6122, tier: "Major Hub", sceneHighlight: "Eccentric, high-energy underground arts and rock rooms in Station North & Fells Point." },
  { city: "Washington", state: "DC", label: "Washington, DC", lat: 38.9072, lng: -77.0369, tier: "Major Hub", sceneHighlight: "Nation's capital with iconic 9:30 Club, Black Cat, and historic punk / go-go legacy along U Street." },
  { city: "Richmond", state: "VA", label: "Richmond, VA", lat: 37.5407, lng: -77.4360, tier: "Regional Stronghold", sceneHighlight: "VCU college energy, storied punk/metal hub, and Broad Street arts corridor." },
  { city: "Norfolk", state: "VA", label: "Norfolk, VA", lat: 36.8508, lng: -76.2859, tier: "Regional Stronghold", sceneHighlight: "Coastal Virginia anchor along the Chesapeake with historic theaters." },
  { city: "Wilmington", state: "DE", label: "Wilmington, DE", lat: 39.7447, lng: -75.5484, tier: "Connector", sceneHighlight: "I-95 corridor link between Baltimore and Philadelphia." },
  { city: "Newark", state: "NJ", label: "Newark, NJ", lat: 40.7357, lng: -74.1724, tier: "Regional Stronghold", sceneHighlight: "Ironbound cultural district and gateway to the NYC metropolitan area." },
  { city: "Asbury Park", state: "NJ", label: "Asbury Park, NJ", lat: 40.2204, lng: -74.0121, tier: "Regional Stronghold", sceneHighlight: "Historic seaside music town: The Stone Pony and boardwalk live circuit." },
  { city: "New York", state: "NY", label: "New York, NY", lat: 40.7128, lng: -74.0060, tier: "Major Hub", sceneHighlight: "World cultural capital: premier stages throughout Brooklyn, Manhattan, & Queens." },
  { city: "Brooklyn", state: "NY", label: "Brooklyn, NY", lat: 40.6782, lng: -73.9442, tier: "Major Hub", sceneHighlight: "Williamsburg, Bushwick, and Greenpoint indie vanguard with dense club density." },
  { city: "Buffalo", state: "NY", label: "Buffalo, NY", lat: 42.8864, lng: -78.8784, tier: "Regional Stronghold", sceneHighlight: "Niagara Frontier music anchor along I-90 with Allen Street and Elmwood live rooms." },
  { city: "Rochester", state: "NY", label: "Rochester, NY", lat: 43.1566, lng: -77.6088, tier: "Regional Stronghold", sceneHighlight: "East End entertainment district and International Jazz Fest heritage." },
  { city: "Syracuse", state: "NY", label: "Syracuse, NY", lat: 43.0481, lng: -76.1474, tier: "College Town", sceneHighlight: "Armory Square live music hub at the junction of I-90 and I-81." },
  { city: "Albany", state: "NY", label: "Albany, NY", lat: 42.6526, lng: -73.7562, tier: "Regional Stronghold", sceneHighlight: "Capital District crossroads connecting New York City, Boston, and Montreal." },
  { city: "New Haven", state: "CT", label: "New Haven, CT", lat: 41.3083, lng: -72.9279, tier: "College Town", sceneHighlight: "Yale college community and legendary Toad's Place along the I-95 Northeast corridor." },
  { city: "Hartford", state: "CT", label: "Hartford, CT", lat: 41.7658, lng: -72.6734, tier: "Regional Stronghold", sceneHighlight: "Connecticut River Valley anchor connecting NYC and Boston along I-84." },
  { city: "Providence", state: "RI", label: "Providence, RI", lat: 41.8240, lng: -71.4128, tier: "College Town", sceneHighlight: "RISD & Brown arts capital with fertile noise-rock and indie history." },
  { city: "Boston", state: "MA", label: "Boston, MA", lat: 42.3601, lng: -71.0589, tier: "Major Hub", sceneHighlight: "Northeast powerhouse: Cambridge, Allston, and Somerville basement and rock halls." },
  { city: "Worcester", state: "MA", label: "Worcester, MA", lat: 42.2626, lng: -71.8023, tier: "Regional Stronghold", sceneHighlight: "Central Massachusetts touring staple with the Palladium and heavy music scene." },
  { city: "Portsmouth", state: "NH", label: "Portsmouth, NH", lat: 43.0718, lng: -70.7626, tier: "Connector", sceneHighlight: "Seacoast arts and listening room stop along the northern I-95 corridor." },
  { city: "Portland", state: "ME", label: "Portland, ME", lat: 43.6591, lng: -70.2568, tier: "Regional Stronghold", sceneHighlight: "Old Port coastal hub with devoted live music patronage and craft breweries." },
  { city: "Burlington", state: "VT", label: "Burlington, VT", lat: 44.4759, lng: -73.2121, tier: "College Town", sceneHighlight: "Lake Champlain jam and indie enclave centered on Higher Ground and Church St." }
];

/**
 * Centroid coordinates for all 48 contiguous US states + DC
 * Guarantees that any municipality entered across the continental US resolves to valid coordinates
 */
export const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.8067, lng: -86.7911 },
  AZ: { lat: 34.0489, lng: -111.0937 },
  AR: { lat: 34.7465, lng: -92.2896 },
  CA: { lat: 36.7783, lng: -119.4179 },
  CO: { lat: 39.5501, lng: -105.7821 },
  CT: { lat: 41.6032, lng: -73.0877 },
  DE: { lat: 38.9108, lng: -75.5277 },
  DC: { lat: 38.9072, lng: -77.0369 },
  FL: { lat: 27.6648, lng: -81.5158 },
  GA: { lat: 32.1656, lng: -82.9001 },
  ID: { lat: 44.0682, lng: -114.7420 },
  IL: { lat: 40.6331, lng: -89.3985 },
  IN: { lat: 40.2672, lng: -86.1349 },
  IA: { lat: 41.8780, lng: -93.0977 },
  KS: { lat: 38.5266, lng: -96.7265 },
  KY: { lat: 37.8393, lng: -84.2700 },
  LA: { lat: 30.9843, lng: -91.9623 },
  ME: { lat: 45.2538, lng: -69.4455 },
  MD: { lat: 39.0458, lng: -76.6413 },
  MA: { lat: 42.4072, lng: -71.3824 },
  MI: { lat: 44.3148, lng: -85.6024 },
  MN: { lat: 46.7296, lng: -94.6859 },
  MS: { lat: 32.3547, lng: -89.3985 },
  MO: { lat: 37.9643, lng: -91.8318 },
  MT: { lat: 46.8797, lng: -110.3626 },
  NE: { lat: 41.4925, lng: -99.9018 },
  NV: { lat: 38.8026, lng: -116.4194 },
  NH: { lat: 43.1939, lng: -71.5724 },
  NJ: { lat: 40.0583, lng: -74.4057 },
  NM: { lat: 34.5199, lng: -105.8701 },
  NY: { lat: 40.7128, lng: -74.0060 },
  NC: { lat: 35.7596, lng: -79.0193 },
  ND: { lat: 47.5515, lng: -101.0020 },
  OH: { lat: 40.4173, lng: -82.9071 },
  OK: { lat: 35.0078, lng: -97.0929 },
  OR: { lat: 43.8041, lng: -120.5542 },
  PA: { lat: 41.2033, lng: -77.1945 },
  RI: { lat: 41.5801, lng: -71.4774 },
  SC: { lat: 33.8361, lng: -81.1637 },
  SD: { lat: 43.9695, lng: -99.9018 },
  TN: { lat: 35.5175, lng: -86.5804 },
  TX: { lat: 31.9686, lng: -99.9018 },
  UT: { lat: 39.3210, lng: -111.0937 },
  VT: { lat: 44.5588, lng: -72.5778 },
  VA: { lat: 37.4316, lng: -78.6569 },
  WA: { lat: 47.7511, lng: -120.7401 },
  WV: { lat: 38.5976, lng: -80.4549 },
  WI: { lat: 43.7844, lng: -88.7879 },
  WY: { lat: 43.0760, lng: -107.2903 }
};

/**
 * Calculates Haversine great-circle distance between two GPS coordinates in miles
 */
export function calculateGreatCircleDistanceMiles(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Estimates driving distance with highway curvature factor
 */
export function estimateDrivingDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const direct = calculateGreatCircleDistanceMiles(lat1, lon1, lat2, lon2);
  if (direct === 0) return 0;
  // Highways typically incur ~1.18 to 1.25x curvature over direct line
  return Math.round(direct * 1.2);
}

/**
 * Formats drive time string from miles (assumes ~55-65 mph touring van average + break)
 */
export function formatDriveTime(miles: number): string {
  if (miles <= 0) return "0 hrs (Kickoff)";
  const hours = miles / 58; // realistic average with pit stops
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hrs`;
  return `${h} hr ${m} min`;
}

/**
 * Calculates estimated gas cost for a touring van (13 MPG @ $3.85/gallon average)
 */
export function calculateGasCost(miles: number): number {
  if (miles <= 0) return 0;
  const gallons = miles / 13;
  return Math.round(gallons * 3.85);
}

/**
 * Finds or approximates GPS coordinates for any city input nationwide across Lower 48
 */
export function findCityCoordinates(cityInput: string): { lat: number; lng: number; city: string; state: string } {
  const clean = cityInput.toLowerCase().trim();
  
  // Exact match from known corridor cities
  const match = KNOWN_CORRIDOR_CITIES.find(c => 
    c.label.toLowerCase() === clean || 
    c.city.toLowerCase() === clean ||
    clean === `${c.city.toLowerCase()}, ${c.state.toLowerCase()}` ||
    clean.includes(c.city.toLowerCase())
  );

  if (match) {
    return { lat: match.lat, lng: match.lng, city: match.city, state: match.state };
  }

  // State-level approximation fallback
  const parts = cityInput.split(",").map(p => p.trim());
  const cityName = parts[0] || cityInput;
  const rawState = (parts[1] || "").toUpperCase();

  // Try matching via state code or state centroids
  const stateMatches = KNOWN_CORRIDOR_CITIES.filter(c => c.state === rawState);
  if (stateMatches.length > 0) {
    return {
      lat: stateMatches[0].lat + (Math.random() * 0.2 - 0.1),
      lng: stateMatches[0].lng + (Math.random() * 0.2 - 0.1),
      city: cityName,
      state: rawState
    };
  }

  if (STATE_CENTROIDS[rawState]) {
    const c = STATE_CENTROIDS[rawState];
    return {
      lat: c.lat,
      lng: c.lng,
      city: cityName,
      state: rawState
    };
  }

  // Default fallback
  return { lat: 39.8283, lng: -98.5795, city: cityName, state: rawState || "US" };
}

/**
 * Smart Corridor Optimization:
 * Calculates optimal intermediate stops along the corridor between origin and destination
 * to minimize mileage, gas costs, and driving fatigue.
 */
export function calculateCorridorStops(
  originStr: string,
  destinationStr: string,
  startDateStr: string,
  endDateStr: string
): { stops: TourStop[]; totalDistanceMiles: number; totalDriveTime: string; totalGasCost: number } {
  const origin = findCityCoordinates(originStr);
  const destination = findCityCoordinates(destinationStr);

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

  // Target count of stops (including kickoff and destination)
  // Usually min 2, up to diffDays + 1
  const targetStopsCount = Math.min(Math.max(2, diffDays + 1), 8);

  const directDistance = calculateGreatCircleDistanceMiles(origin.lat, origin.lng, destination.lat, destination.lng);

  // Find candidate corridor cities that lie geographically between origin and destination
  const candidates = KNOWN_CORRIDOR_CITIES.filter(c => {
    // Avoid origin and destination itself
    if (c.city.toLowerCase() === origin.city.toLowerCase() || c.city.toLowerCase() === destination.city.toLowerCase()) {
      return false;
    }

    const distFromOrigin = calculateGreatCircleDistanceMiles(origin.lat, origin.lng, c.lat, c.lng);
    const distToDest = calculateGreatCircleDistanceMiles(c.lat, c.lng, destination.lat, destination.lng);

    // Detour ratio: path through candidate should not add more than 30% detour
    const totalPath = distFromOrigin + distToDest;
    const detourRatio = totalPath / Math.max(1, directDistance);

    return detourRatio <= 1.35;
  });

  // Sort candidates by progressive distance from origin
  candidates.sort((a, b) => {
    const distA = calculateGreatCircleDistanceMiles(origin.lat, origin.lng, a.lat, a.lng);
    const distB = calculateGreatCircleDistanceMiles(origin.lat, origin.lng, b.lat, b.lng);
    return distA - distB;
  });

  // Pick evenly spaced waypoints
  const selectedIntermediates: CorridorCity[] = [];
  const neededIntermediates = targetStopsCount - 2;

  if (neededIntermediates > 0 && candidates.length > 0) {
    const stepSize = candidates.length / (neededIntermediates + 1);
    for (let i = 1; i <= neededIntermediates; i++) {
      const idx = Math.min(Math.round(i * stepSize) - 1, candidates.length - 1);
      if (idx >= 0 && !selectedIntermediates.some(s => s.city === candidates[idx].city)) {
        selectedIntermediates.push(candidates[idx]);
      }
    }
  }

  // Construct stops array
  const fullChain: Array<{ city: string; state: string; lat: number; lng: number; sceneHighlight?: string }> = [
    { city: origin.city, state: origin.state, lat: origin.lat, lng: origin.lng, sceneHighlight: "Tour kickoff & gear assembly." },
    ...selectedIntermediates,
    { city: destination.city, state: destination.state, lat: destination.lat, lng: destination.lng, sceneHighlight: "Grand tour finale & wrap-up performance." }
  ];

  let totalDistanceMiles = 0;
  let totalGasCost = 0;
  const stops: TourStop[] = [];

  for (let i = 0; i < fullChain.length; i++) {
    const current = fullChain[i];
    let legDistance = 0;
    let driveTimeStr = "0 hrs (Kickoff)";

    if (i > 0) {
      const prev = fullChain[i - 1];
      legDistance = estimateDrivingDistanceMiles(prev.lat, prev.lng, current.lat, current.lng);
      driveTimeStr = formatDriveTime(legDistance);
      totalDistanceMiles += legDistance;
      totalGasCost += calculateGasCost(legDistance);
    }

    const stopDate = new Date(start.getTime() + i * 24 * 3600 * 1000).toISOString().split("T")[0];

    // Find suggested venues for this city with strict state/province matching
    const matchedVenues = MUSIC_VENUES.filter(v => {
      const cityMatches = v.city.toLowerCase() === current.city.toLowerCase() ||
        v.city.toLowerCase().includes(current.city.toLowerCase()) || 
        current.city.toLowerCase().includes(v.city.toLowerCase());
      if (!cityMatches) return false;

      if (current.state) {
        const curState = current.state.toUpperCase();
        if (curState === "BC") {
          return v.state?.toUpperCase() === "BC" || v.country?.toUpperCase() === "CA" || v.address?.includes("BC");
        }
        if (curState === "WA") {
          return (v.state?.toUpperCase() === "WA" || v.address?.includes(", WA")) && 
                 v.state?.toUpperCase() !== "BC" && 
                 !v.address?.includes("BC");
        }
        if (v.state) {
          return v.state.toUpperCase() === curState;
        }
      }
      return true;
    });

    const suggestedVenues: TourVenueStop[] = matchedVenues.length > 0
      ? matchedVenues.slice(0, 6).map(v => ({
          id: v.id,
          name: v.name,
          city: v.city,
          state: v.state || current.state,
          country: v.country || (current.state === "BC" ? "CA" : "US"),
          address: v.address,
          capacity: v.capacity,
          genres: v.genres,
          contactEmail: v.contactEmail,
          contactPhone: v.contactPhone,
          hasPA: v.hasPA,
          hasLighting: v.hasLighting,
          description: v.description,
          website: v.website
        }))
      : [
          {
            name: `${current.city} Live Stage & Hall`,
            city: current.city,
            address: `Downtown ${current.city}, ${current.state}`,
            capacity: 200,
            genres: ["Indie Rock", "Live Music", "Punk"],
            contactEmail: `booking@${current.city.toLowerCase().replace(/[^a-z0-9]/g, "")}stage.com`,
            contactPhone: "Inquire",
            hasPA: true,
            hasLighting: true,
            description: `Centrally located live music venue in ${current.city}.`
          }
        ];

    const lodgingOptions = findLodgingForCity(current.city, current.state);

    stops.push({
      id: `stop-${i + 1}-${current.city.toLowerCase().replace(/\s+/g, "-")}`,
      stopName: i === 0 ? `Tour Kickoff: ${current.city}` : (i === fullChain.length - 1 ? `Tour Finale: ${current.city}` : `Stop ${i + 1}: ${current.city}`),
      city: current.city,
      state: current.state,
      dayNumber: i + 1,
      date: stopDate,
      driveTimeFromPrev: driveTimeStr,
      distanceMilesFromPrev: legDistance,
      estimatedGasCost: calculateGasCost(legDistance),
      routeHighlight: i === 0 ? "Load up the tour van and soundcheck." : `Drive ${driveTimeStr} from ${fullChain[i - 1].city} to ${current.city}.`,
      localSceneNotes: current.sceneHighlight || `Vibrant community for live music and touring bands.`,
      lodgingNotes: lodgingOptions[0]?.gearSecurityNote || "Secure band parking available.",
      lodgingOptions,
      suggestedVenues,
      selectedVenue: undefined, // left for Step 3 selection
      selectedLodging: undefined
    });
  }

  const totalDriveTime = formatDriveTime(totalDistanceMiles);

  return {
    stops,
    totalDistanceMiles,
    totalDriveTime,
    totalGasCost
  };
}

/**
 * Recalculates metrics when stops are added, deleted, or reordered
 */
export function recalculateStopsMetrics(stops: TourStop[], startDateStr?: string): {
  updatedStops: TourStop[];
  totalDistanceMiles: number;
  totalDriveTime: string;
  totalGasCost: number;
} {
  let totalDistanceMiles = 0;
  let totalGasCost = 0;

  const start = startDateStr ? new Date(startDateStr) : new Date();

  const updatedStops = stops.map((stop, i) => {
    let legDistance = 0;
    let driveTimeStr = "0 hrs (Kickoff)";

    if (i > 0) {
      const prev = stops[i - 1];
      const coord1 = findCityCoordinates(`${prev.city}, ${prev.state}`);
      const coord2 = findCityCoordinates(`${stop.city}, ${stop.state}`);
      legDistance = estimateDrivingDistanceMiles(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
      driveTimeStr = formatDriveTime(legDistance);
      totalDistanceMiles += legDistance;
      totalGasCost += calculateGasCost(legDistance);
    }

    const calculatedDate = new Date(start.getTime() + i * 24 * 3600 * 1000).toISOString().split("T")[0];

    return {
      ...stop,
      dayNumber: i + 1,
      date: stop.date || calculatedDate,
      distanceMilesFromPrev: legDistance,
      driveTimeFromPrev: driveTimeStr,
      estimatedGasCost: calculateGasCost(legDistance)
    };
  });

  return {
    updatedStops,
    totalDistanceMiles,
    totalDriveTime: formatDriveTime(totalDistanceMiles),
    totalGasCost
  };
}

export interface DuplicateReturnAnalysis {
  isOutAndBack: boolean;
  hasDuplicates: boolean;
  duplicateCount: number;
  duplicateCities: string[];
  duplicateIndices: number[];
  outboundCities: string[];
  turnAroundIndex: number;
}

/**
 * Detects duplicate stops along the return leg of an out-and-back route
 */
export function detectDuplicateReturnStops(stops: TourStop[]): DuplicateReturnAnalysis {
  if (stops.length < 3) {
    return {
      isOutAndBack: false,
      hasDuplicates: false,
      duplicateCount: 0,
      duplicateCities: [],
      duplicateIndices: [],
      outboundCities: [],
      turnAroundIndex: 0
    };
  }

  // Determine turnaround stop index:
  let turnAroundIndex = -1;
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (s.id?.toLowerCase().includes("return") || s.stopName?.toLowerCase().includes("return")) {
      turnAroundIndex = Math.max(0, i - 1);
      break;
    }
  }

  const originCity = stops[0].city.toLowerCase().trim();
  const finaleCity = stops[stops.length - 1].city.toLowerCase().trim();
  const isOutAndBack = originCity === finaleCity || turnAroundIndex !== -1;

  if (turnAroundIndex === -1) {
    let maxDist = -1;
    let maxIdx = 0;
    const originCoord = findCityCoordinates(`${stops[0].city}, ${stops[0].state}`);
    for (let i = 0; i < stops.length; i++) {
      const c = findCityCoordinates(`${stops[i].city}, ${stops[i].state}`);
      const dist = calculateGreatCircleDistanceMiles(originCoord.lat, originCoord.lng, c.lat, c.lng);
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }
    turnAroundIndex = maxIdx;
  }

  const outboundStops = stops.slice(0, turnAroundIndex + 1);
  const outboundCities = outboundStops.map(s => s.city.trim());
  const outboundCitySet = new Set(outboundCities.map(c => c.toLowerCase()));

  // Examine stops after turnaround up to second-to-last (last stop is homecoming finale)
  const duplicateIndices: number[] = [];
  const duplicateCities: string[] = [];

  for (let i = turnAroundIndex + 1; i < stops.length - 1; i++) {
    const city = stops[i].city.toLowerCase().trim();
    if (outboundCitySet.has(city)) {
      duplicateIndices.push(i);
      if (!duplicateCities.includes(stops[i].city)) {
        duplicateCities.push(stops[i].city);
      }
    }
  }

  return {
    isOutAndBack: isOutAndBack || duplicateIndices.length > 0,
    hasDuplicates: duplicateIndices.length > 0,
    duplicateCount: duplicateIndices.length,
    duplicateCities,
    duplicateIndices,
    outboundCities,
    turnAroundIndex
  };
}

export interface RouteDiversificationResult {
  updatedStops: TourStop[];
  replacedPairs: Array<{
    originalCity: string;
    newCity: string;
    newState: string;
    highway: string;
    highlight: string;
  }>;
  totalDistanceMiles: number;
  totalDriveTime: string;
  totalGasCost: number;
}

/**
 * Automatically replaces duplicate corridor stops on the return trip
 * with adjacent, viable secondary music markets along parallel highways/byways
 * (e.g. Bend/US-97, Hood River/I-84, Yakima/I-82, Wenatchee, Everett).
 */
export function diversifyTourRoute(
  stops: TourStop[],
  startDateStr?: string
): RouteDiversificationResult {
  const analysis = detectDuplicateReturnStops(stops);
  if (!analysis.hasDuplicates) {
    const recal = recalculateStopsMetrics(stops, startDateStr);
    return {
      updatedStops: recal.updatedStops,
      replacedPairs: [],
      totalDistanceMiles: recal.totalDistanceMiles,
      totalDriveTime: recal.totalDriveTime,
      totalGasCost: recal.totalGasCost
    };
  }

  // Set of all cities already preserved in the tour (outbound stops + non-duplicate return stops + finale)
  const currentUsedCities = new Set<string>();
  stops.forEach((s, idx) => {
    if (!analysis.duplicateIndices.includes(idx)) {
      currentUsedCities.add(s.city.toLowerCase().trim());
    }
  });

  // Ordered candidate chains for parallel highway corridors
  // 1. Cascadia / PNW Alternate Corridors (US-97, I-84, I-82, US-97):
  const pnwCorridorCandidates = [
    { city: "Bend", state: "OR", highway: "US-97 Central Oregon", highlight: "Craft beer and thriving outdoor music rooms" },
    { city: "Hood River", state: "OR", highway: "I-84 Columbia Gorge", highlight: "Columbia River Gorge windsurfing & indie rock pubs" },
    { city: "Yakima", state: "WA", highway: "I-82 / US-97 Central WA", highlight: "Central Washington agricultural valley live stages" },
    { city: "Wenatchee", state: "WA", highway: "US-97 Cascade Foothills", highlight: "Apple capital music rooms in the Cascade foothills" },
    { city: "Ellensburg", state: "WA", highway: "I-90 / US-97 College Town", highlight: "Central Washington university indie/punk circuit" },
    { city: "Everett", state: "WA", highway: "US-2 / North Sound", highlight: "North Sound rock & metal corridor hub" },
    { city: "Tacoma", state: "WA", highway: "Sound Corridor", highlight: "Grit City DIY scene & 6th Ave dive venues" },
    { city: "Spokane", state: "WA", highway: "I-90 Inland NW", highlight: "Inland Northwest touring anchor" },
    { city: "Ashland", state: "OR", highway: "Rogue Valley Byway", highlight: "Artistic mountain enclave listening rooms" }
  ];

  // 2. California Alternate Corridors (CA-99 / Central Valley & East Bay):
  const caCorridorCandidates = [
    { city: "Long Beach", state: "CA", highway: "SoCal Coastal/Inland", highlight: "Vibrant coastal indie & retro rooms" },
    { city: "Bakersfield", state: "CA", highway: "CA-99 Valley", highlight: "Birthplace of the Bakersfield Sound" },
    { city: "Fresno", state: "CA", highway: "CA-99 Central Valley", highlight: "Tower District underground and DIY shows" },
    { city: "Oakland", state: "CA", highway: "East Bay Corridor", highlight: "Underground art and punk scene along Telegraph" },
    { city: "Sacramento", state: "CA", highway: "Capital Highway", highlight: "Booming Midtown live music clubs" },
    { city: "Chico", state: "CA", highway: "CA-99 North", highlight: "Rowdy and welcoming basement/club college circuit" },
    { city: "Santa Cruz", state: "CA", highway: "Highway 1", highlight: "Legendary surf & skate punk haven" },
    { city: "Redding", state: "CA", highway: "North I-5 Gateway", highlight: "Gateway stop connecting Northern California" }
  ];

  // 3. Mountain / Southwest Alternate:
  const mountainCorridorCandidates = [
    { city: "Tucson", state: "AZ", highway: "I-10 Desert", highlight: "Rich southwestern desert psych-rock enclave" },
    { city: "Phoenix", state: "AZ", highway: "I-17 Corridor", highlight: "Valley of the Sun expansive downtown circuit" },
    { city: "Salt Lake City", state: "UT", highway: "I-15 Crossroad", highlight: "Dedicated indie & hardcore fanbases" },
    { city: "Reno", state: "NV", highway: "I-80 High Desert", highlight: "Active indie underground rooms" },
    { city: "Boulder", state: "CO", highway: "US-36 Flatirons", highlight: "Student-driven live music rooms" },
    { city: "Fort Collins", state: "CO", highway: "I-25 North", highlight: "Devoted Old Town music stages" },
    { city: "Colorado Springs", state: "CO", highway: "I-25 South", highlight: "Pikes Peak corridor anchor" }
  ];

  // Determine dominant region from stops
  const states = stops.map(s => s.state?.toUpperCase());
  const isPNW = states.some(st => st === "WA" || st === "OR" || st === "BC");
  const isCA = states.some(st => st === "CA");
  const isMountain = states.some(st => st === "CO" || st === "AZ" || st === "UT" || st === "NV" || st === "NM");

  const prioritizedCandidates = isPNW 
    ? pnwCorridorCandidates 
    : isCA 
    ? caCorridorCandidates 
    : isMountain 
    ? mountainCorridorCandidates 
    : [...pnwCorridorCandidates, ...caCorridorCandidates];

  const updatedStops = [...stops];
  const replacedPairs: Array<{
    originalCity: string;
    newCity: string;
    newState: string;
    highway: string;
    highlight: string;
  }> = [];

  let candidatePtr = 0;

  for (const dupIdx of analysis.duplicateIndices) {
    const originalStop = stops[dupIdx];
    const origCity = originalStop.city;

    // Find the next available unvisited candidate
    let chosenCandidate: { city: string; state: string; highway: string; highlight: string } | null = null;

    while (candidatePtr < prioritizedCandidates.length) {
      const cand = prioritizedCandidates[candidatePtr];
      candidatePtr++;
      if (!currentUsedCities.has(cand.city.toLowerCase().trim())) {
        chosenCandidate = cand;
        break;
      }
    }

    // Fallback to any unvisited city in KNOWN_CORRIDOR_CITIES
    if (!chosenCandidate) {
      for (const kc of KNOWN_CORRIDOR_CITIES) {
        if (!currentUsedCities.has(kc.city.toLowerCase().trim())) {
          chosenCandidate = {
            city: kc.city,
            state: kc.state,
            highway: `${kc.tier} Byway`,
            highlight: kc.sceneHighlight
          };
          break;
        }
      }
    }

    if (chosenCandidate) {
      currentUsedCities.add(chosenCandidate.city.toLowerCase().trim());

      // Find suggested venues for replacement city
      const matchedVenues = MUSIC_VENUES.filter(v => 
        v.city.toLowerCase() === chosenCandidate!.city.toLowerCase() ||
        v.city.toLowerCase().includes(chosenCandidate!.city.toLowerCase()) ||
        chosenCandidate!.city.toLowerCase().includes(v.city.toLowerCase())
      );

      const suggestedVenues: TourVenueStop[] = matchedVenues.length > 0
        ? matchedVenues.slice(0, 6).map(v => ({
            id: v.id,
            name: v.name,
            city: v.city,
            state: v.state || chosenCandidate!.state,
            country: v.country || "US",
            address: v.address,
            capacity: v.capacity,
            genres: v.genres,
            contactEmail: v.contactEmail,
            contactPhone: v.contactPhone,
            hasPA: v.hasPA,
            hasLighting: v.hasLighting,
            description: v.description,
            website: v.website
          }))
        : [
            {
              name: `${chosenCandidate.city} Live Stage & Hall`,
              city: chosenCandidate.city,
              state: chosenCandidate.state,
              address: `Downtown ${chosenCandidate.city}, ${chosenCandidate.state}`,
              capacity: 200,
              genres: ["Indie Rock", "Live Music", "Punk"],
              contactEmail: `booking@${chosenCandidate.city.toLowerCase().replace(/[^a-z0-9]/g, "")}live.com`,
              contactPhone: "Inquire",
              hasPA: true,
              hasLighting: true,
              description: `Centrally located live music venue in ${chosenCandidate.city}.`
            }
          ];

      const lodgingOptions = findLodgingForCity(chosenCandidate.city, chosenCandidate.state);

      updatedStops[dupIdx] = {
        ...originalStop,
        id: `return-loop-${chosenCandidate.city.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}-${dupIdx}`,
        stopName: `Return Loop: ${chosenCandidate.city}`,
        city: chosenCandidate.city,
        state: chosenCandidate.state,
        routeHighlight: `Diversified circular loop via ${chosenCandidate.city} (${chosenCandidate.highway}). Zero backtracking!`,
        localSceneNotes: chosenCandidate.highlight,
        lodgingNotes: lodgingOptions[0]?.gearSecurityNote || "Secure band parking available.",
        lodgingOptions,
        suggestedVenues,
        selectedVenue: undefined,
        selectedLodging: undefined
      };

      replacedPairs.push({
        originalCity: origCity,
        newCity: chosenCandidate.city,
        newState: chosenCandidate.state,
        highway: chosenCandidate.highway,
        highlight: chosenCandidate.highlight
      });
    }
  }

  const recal = recalculateStopsMetrics(updatedStops, startDateStr);

  return {
    updatedStops: recal.updatedStops,
    replacedPairs,
    totalDistanceMiles: recal.totalDistanceMiles,
    totalDriveTime: recal.totalDriveTime,
    totalGasCost: recal.totalGasCost
  };
}
