import { TourLodgingOption } from "../types";

export const findLodgingForCity = (cityName: string, stateName: string): TourLodgingOption[] => {
  const cityLower = cityName.toLowerCase();
  const encodedCity = encodeURIComponent(`${cityName}, ${stateName}`);

  if (cityLower.includes("bellingham")) {
    return [
      {
        id: "lodge-bel-1",
        name: "Hotel Leo & Historic Suites",
        type: "Band-Friendly Hotel",
        city: "Bellingham",
        address: "1224 Cornwall Ave, Bellingham, WA",
        estPricePerNight: "$115 - $145 / night",
        distanceToVenues: "0.2 mi to Wild Buffalo & downtown stages",
        amenities: ["Monitored Rear Parking", "Elevator Load-In Access", "24/7 Front Desk", "High Ceilings"],
        gearSecurityNote: "Park in the rear well-lit camera-monitored lot. Back your van tightly against the brick alley wall.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-bel-2",
        name: "Motel 6 Bellingham (Van-Friendly)",
        type: "Budget Motel / Inn",
        city: "Bellingham",
        address: "3701 Byron Ave, Bellingham, WA",
        estPricePerNight: "$68 - $85 / night",
        distanceToVenues: "1.8 mi to downtown",
        amenities: ["Large Van / Trailer Spaces", "Direct Exterior Room Doors", "Ground Floor Gear Access"],
        gearSecurityNote: "Request a ground-floor unit with an exterior door so guitars and pedalboards can stay safely in your room.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-bel-3",
        name: "Larrabee State Park Secure Van Camp",
        type: "Van / RV Secure Parking",
        city: "Bellingham",
        address: "245 Chuckanut Dr, Bellingham, WA",
        estPricePerNight: "$35 / site",
        distanceToVenues: "5.5 mi south on scenic Chuckanut",
        amenities: ["Gated Night Entry (10 PM)", "Hot Showers", "Pull-Through Van Sites", "Power Hookup"],
        gearSecurityNote: "Quiet state park with ranger patrol and gated entrance overnight.",
        bookingSearchUrl: `https://www.google.com/maps/search/rv+camping+${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("seattle")) {
    return [
      {
        id: "lodge-sea-1",
        name: "The Belltown Inn (Music District)",
        type: "Band-Friendly Hotel",
        city: "Seattle",
        address: "2301 3rd Ave, Seattle, WA",
        estPricePerNight: "$129 - $159 / night",
        distanceToVenues: "0.2 mi to Crocodile, Showbox, and Rendezvous",
        amenities: ["Walking Distance to 6 Music Venues", "Luggage Storage", "Rooftop Terrace", "CCTV Security"],
        gearSecurityNote: "In central Belltown; unload high-value instruments into rooms. Staff will assist with gear elevator.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-sea-2",
        name: "Ace Hotel Seattle (Artist Quarter)",
        type: "Musician Crash Pad / Hostel",
        city: "Seattle",
        address: "2423 1st Ave, Seattle, WA",
        estPricePerNight: "$85 - $115 / night",
        distanceToVenues: "0.3 mi to central Belltown stages",
        amenities: ["Communal Breakfast Bar", "Artist-Friendly Vibe", "Late Night Keyless Entry"],
        gearSecurityNote: "Legendary touring musician hub with historic bohemian charm.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-sea-3",
        name: "Travelodge by Wyndham Seattle Center",
        type: "Budget Motel / Inn",
        city: "Seattle",
        address: "200 6th Ave N, Seattle, WA",
        estPricePerNight: "$95 - $125 / night",
        distanceToVenues: "0.5 mi to Vera Project / Seattle Center",
        amenities: ["Ground-Floor Exterior Parking", "On-site Free Parking", "Large Van Pull-through"],
        gearSecurityNote: "Park directly in front of your ground-floor window for clear line of sight to the band van.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("tacoma")) {
    return [
      {
        id: "lodge-tac-1",
        name: "McMenamins Elks Temple Hotel",
        type: "Band-Friendly Hotel",
        city: "Tacoma",
        address: "565 Broadway, Tacoma, WA",
        estPricePerNight: "$139 - $175 / night",
        distanceToVenues: "0.1 mi (Music venue on-site: Spanish Ballroom)",
        amenities: ["Live Venue In Building", "Soundproofed Historic Rooms", "Late Night Food & Bar"],
        gearSecurityNote: "Perform and sleep in the same building. Dedicated secure underground loading bay available for touring talent.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-tac-2",
        name: "Holiday Inn Express Downtown Tacoma",
        type: "Budget Motel / Inn",
        city: "Tacoma",
        address: "2102 S C St, Tacoma, WA",
        estPricePerNight: "$98 - $120 / night",
        distanceToVenues: "0.4 mi to central Tacoma music halls",
        amenities: ["Gated Covered Parking Garage", "Complimentary Hot Breakfast", "24/7 Front Desk"],
        gearSecurityNote: "Garage clearance accommodates standard full-size touring vans. Overnight security patrol on site.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("portland")) {
    return [
      {
        id: "lodge-pdx-1",
        name: "Jupiter Hotel & NEXT (Legendary Tour Hub)",
        type: "Band-Friendly Hotel",
        city: "Portland",
        address: "800 E Burnside St, Portland, OR",
        estPricePerNight: "$120 - $149 / night",
        distanceToVenues: "0.1 mi to Doug Fir Lounge, Revolution Hall, & Eastside",
        amenities: ["Dedicated Band Van Parking Lot", "Courtyard Patio", "Sound-Treated Rooms", "Late Checkout"],
        gearSecurityNote: "Portland's premier band tour stop. Ask front desk for band backlot parking with 24/7 surveillance.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-pdx-2",
        name: "The Society Hotel (Old Town)",
        type: "Musician Crash Pad / Hostel",
        city: "Portland",
        address: "203 NW 3rd Ave, Portland, OR",
        estPricePerNight: "$55 (bunks) - $110 (privates)",
        distanceToVenues: "0.3 mi to Roseland Theater & Star Theater",
        amenities: ["Custom Wooden Bunks & Private Rooms", "Rooftop Lounge & Cafe", "Gear Lockers"],
        gearSecurityNote: "Offers secure individual gear lockers and locked entry. Unload instruments into private storage.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-pdx-3",
        name: "Eastside Secure Van & Camper Compound",
        type: "Van / RV Secure Parking",
        city: "Portland",
        address: "Central Eastside Industrial District, Portland, OR",
        estPricePerNight: "$40 / night",
        distanceToVenues: "1.0 mi to Eastside venues",
        amenities: ["Keypad Gated High-Fence Lot", "Power Outlets", "Restroom Access", "High-Intensity Lights"],
        gearSecurityNote: "Fully perimeter-fenced lot with code access for sleeping in touring vans and camper rigs safely.",
        bookingSearchUrl: `https://www.google.com/maps/search/secure+rv+parking+${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("eugene")) {
    return [
      {
        id: "lodge-eug-1",
        name: "Graduate Eugene (Arts & Campus Center)",
        type: "Band-Friendly Hotel",
        city: "Eugene",
        address: "66 E 6th Ave, Eugene, OR",
        estPricePerNight: "$119 - $145 / night",
        distanceToVenues: "0.2 mi to McDonald Theatre & WOW Hall",
        amenities: ["Spacious Double Queen Rooms", "Large Surface Lot", "Late Night Check-in", "Pet Friendly"],
        gearSecurityNote: "Large well-lit surface parking lot directly next to front entrance. Generous room layouts fit gear bags.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-eug-2",
        name: "Campus Inn & Suites Eugene",
        type: "Budget Motel / Inn",
        city: "Eugene",
        address: "390 E Broadway, Eugene, OR",
        estPricePerNight: "$79 - $95 / night",
        distanceToVenues: "0.5 mi to downtown music stages",
        amenities: ["Exterior Ground Floor Rooms", "Free Continental Breakfast", "Free Van Parking"],
        gearSecurityNote: "Park directly outside your room door for effortless post-show instrument load-in.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("bend")) {
    return [
      {
        id: "lodge-bnd-1",
        name: "McMenamins Old St. Francis School",
        type: "Band-Friendly Hotel",
        city: "Bend",
        address: "700 NW Bond St, Bend, OR",
        estPricePerNight: "$125 - $160 / night",
        distanceToVenues: "0.2 mi to downtown Bend live stages & Volcanic Theatre Pub",
        amenities: ["On-site Theater & Pub", "Soaking Pool", "Musician Atmosphere", "CCTV Parking"],
        gearSecurityNote: "Beloved touring musician enclave in downtown Bend. Dedicated parking bays with 24/7 staff monitoring.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-bnd-2",
        name: "Bend KOA Journey & Van Camping",
        type: "Van / RV Secure Parking",
        city: "Bend",
        address: "19230 Highway 97, Bend, OR",
        estPricePerNight: "$42 / site",
        distanceToVenues: "4.5 mi to downtown live rooms",
        amenities: ["Pull-Through RV/Van Sites", "Clean Hot Showers", "Electric & Water Hookups", "Gated Security"],
        gearSecurityNote: "Reliable KOA setup for touring vans and camper rigs with overnight security and full power for gear charging.",
        bookingSearchUrl: `https://www.google.com/maps/search/rv+camping+${encodedCity}`
      },
      {
        id: "lodge-bnd-3",
        name: "Cascade Lodge Bend (Van-Friendly)",
        type: "Budget Motel / Inn",
        city: "Bend",
        address: "515 SE 3rd St, Bend, OR",
        estPricePerNight: "$75 - $95 / night",
        distanceToVenues: "0.8 mi to downtown",
        amenities: ["Ground-Floor Exterior Doors", "Spacious Van Spaces", "Free Morning Coffee"],
        gearSecurityNote: "Classic drive-up motel along 3rd St; back your tour van right against your ground floor door.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("hood river")) {
    return [
      {
        id: "lodge-hdr-1",
        name: "Hood River Hotel (Historic Downtown)",
        type: "Band-Friendly Hotel",
        city: "Hood River",
        address: "102 Oak St, Hood River, OR",
        estPricePerNight: "$119 - $149 / night",
        distanceToVenues: "0.1 mi to Columbia River Gorge live rooms",
        amenities: ["Historic Musician Vibe", "On-site Bistro & Lounge", "Central Location", "Elevator Access"],
        gearSecurityNote: "Heart of downtown Hood River. Drop gear off in elevator-accessible rooms; secure parking available.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-hdr-2",
        name: "Columbia River Gorge / Cascade Locks KOA",
        type: "Van / RV Secure Parking",
        city: "Cascade Locks",
        address: "Cascade Locks, OR (near Hood River)",
        estPricePerNight: "$38 / site",
        distanceToVenues: "15 min to Hood River stages",
        amenities: ["Trailer & Camper Van Sites", "Hot Showers", "Laundry Facilities", "Night Patrol"],
        gearSecurityNote: "Scenically located along the Gorge, quiet campground with locked gate at night for van security.",
        bookingSearchUrl: `https://www.google.com/maps/search/koa+camping+${encodedCity}`
      },
      {
        id: "lodge-hdr-3",
        name: "Sunset Motel Hood River",
        type: "Budget Motel / Inn",
        city: "Hood River",
        address: "2300 W Steuben St, Hood River, OR",
        estPricePerNight: "$79 - $98 / night",
        distanceToVenues: "1.2 mi to downtown",
        amenities: ["Drive-Up Door Parking", "Gorge Mountain Views", "Trailer Friendly"],
        gearSecurityNote: "Direct parking in front of units for visual line-of-sight overnight.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("yakima")) {
    return [
      {
        id: "lodge-yak-1",
        name: "Hotel Maison (Yakima Downtown)",
        type: "Band-Friendly Hotel",
        city: "Yakima",
        address: "321 E Yakima Ave, Yakima, WA",
        estPricePerNight: "$110 - $135 / night",
        distanceToVenues: "0.2 mi to Seasons Performance Hall & downtown clubs",
        amenities: ["Boutique Historic Suites", "Gated Guest Parking", "Complimentary Breakfast", "24/7 Desk"],
        gearSecurityNote: "Gated parking directly behind the property with security lighting. Central walking distance.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-yak-2",
        name: "Yakima Sportsman State Park Van Campground",
        type: "Van / RV Secure Parking",
        city: "Yakima",
        address: "904 Keys Rd, Yakima, WA",
        estPricePerNight: "$32 / site",
        distanceToVenues: "3.5 mi east of downtown Yakima",
        amenities: ["Ranger Station Patrol", "Power & Water Sites", "Clean Showers", "Night Gate"],
        gearSecurityNote: "Peaceful riverside state park with ranger presence and gated overnight access.",
        bookingSearchUrl: `https://www.google.com/maps/search/state+park+camping+${encodedCity}`
      },
      {
        id: "lodge-yak-3",
        name: "Oxford Suites Yakima (Riverfront)",
        type: "Band-Friendly Hotel",
        city: "Yakima",
        address: "1701 E Yakima Ave, Yakima, WA",
        estPricePerNight: "$98 - $125 / night",
        distanceToVenues: "1.0 mi to live music circuit",
        amenities: ["Large Van Parking Lot", "Hot Evening Reception", "High-Visibility Parking"],
        gearSecurityNote: "Expansive front parking lot with high-intensity floodlights visible from front desk.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("wenatchee")) {
    return [
      {
        id: "lodge-wen-1",
        name: "Coast Wenatchee Center Hotel",
        type: "Band-Friendly Hotel",
        city: "Wenatchee",
        address: "201 N Wenatchee Ave, Wenatchee, WA",
        estPricePerNight: "$105 - $130 / night",
        distanceToVenues: "0.2 mi to Historic Numerica PAC & live stages",
        amenities: ["Covered Garage & Surface Parking", "Indoor/Outdoor Pool", "Skybridge to PAC"],
        gearSecurityNote: "Central downtown location with ample clearance for touring passenger vans.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-wen-2",
        name: "Wenatchee Confluence State Park Van Camp",
        type: "Van / RV Secure Parking",
        city: "Wenatchee",
        address: "333 Olds Station Rd, Wenatchee, WA",
        estPricePerNight: "$35 / site",
        distanceToVenues: "2.5 mi from downtown",
        amenities: ["Columbia River Frontage", "Full Hookup Sites", "Hot Showers", "Ranger Staff"],
        gearSecurityNote: "State park camping with locked gates after 10 PM. Perfect for sleeping in van/RV.",
        bookingSearchUrl: `https://www.google.com/maps/search/rv+campground+${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("olympia")) {
    return [
      {
        id: "lodge-oly-1",
        name: "The Governor Hotel (Capitol Downtown)",
        type: "Band-Friendly Hotel",
        city: "Olympia",
        address: "621 Capitol Way S, Olympia, WA",
        estPricePerNight: "$105 - $135 / night",
        distanceToVenues: "0.3 mi to Capitol Theater, Cryptatpa, & Brotherhood",
        amenities: ["Downtown Waterfront Proximity", "Elevator Access", "Secure Night Desk"],
        gearSecurityNote: "Right on Capitol Way; staff allows loading gear carts via elevator to guest rooms.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-oly-2",
        name: "Millersylvania State Park Secure Van Camp",
        type: "Van / RV Secure Parking",
        city: "Olympia",
        address: "12245 Tilley Rd S, Olympia, WA",
        estPricePerNight: "$35 / site",
        distanceToVenues: "10 mi south of downtown Olympia",
        amenities: ["Old-Growth Forest", "Hot Showers", "Gated Night Entry", "Deep Van Sites"],
        gearSecurityNote: "Heavy forest canopy with gated ranger entrance overnight. Safe for trailer rigs.",
        bookingSearchUrl: `https://www.google.com/maps/search/state+park+camping+${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("salem")) {
    return [
      {
        id: "lodge-slm-1",
        name: "The Grand Hotel in Salem",
        type: "Band-Friendly Hotel",
        city: "Salem",
        address: "201 Liberty St SE, Salem, OR",
        estPricePerNight: "$129 - $155 / night",
        distanceToVenues: "0.2 mi to Elsinore Theatre & downtown music rooms",
        amenities: ["Attached Covered Garage", "Free Hot Breakfast", "24/7 Security Patrol"],
        gearSecurityNote: "Garage with clearance for 15-passenger vans and on-site overnight security patrol.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-slm-2",
        name: "Salem RV Park & Van Campground",
        type: "Van / RV Secure Parking",
        city: "Salem",
        address: "4490 Silverton Rd NE, Salem, OR",
        estPricePerNight: "$40 / site",
        distanceToVenues: "3.5 mi to downtown live venues",
        amenities: ["Full Hookup Van Sites", "Restrooms & Showers", "Gated Overnight Entry"],
        gearSecurityNote: "Fenced community with on-site manager and overnight security.",
        bookingSearchUrl: `https://www.google.com/maps/search/rv+camping+${encodedCity}`
      }
    ];
  }

  if (cityLower.includes("everett")) {
    return [
      {
        id: "lodge-evt-1",
        name: "Hotel Indigo Everett Waterfront",
        type: "Band-Friendly Hotel",
        city: "Everett",
        address: "1028 13th St, Everett, WA",
        estPricePerNight: "$125 - $155 / night",
        distanceToVenues: "0.8 mi to Historic Everett Theatre & downtown",
        amenities: ["Waterfront Surface Parking", "Large Rooms", "24/7 Concierge"],
        gearSecurityNote: "Spacious marina lot with excellent perimeter illumination and regular harbor security.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-evt-2",
        name: "Travelodge by Wyndham Everett City Center",
        type: "Budget Motel / Inn",
        city: "Everett",
        address: "3030 Broadway, Everett, WA",
        estPricePerNight: "$72 - $89 / night",
        distanceToVenues: "0.3 mi to downtown music rooms",
        amenities: ["Ground-Floor Van Parking", "Exterior Unit Access", "Low Budget Friendly"],
        gearSecurityNote: "Park directly in front of your ground-floor unit window.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      }
    ];
  }

  // Generic fallback for any other city
  return [
    {
      id: `lodge-gen-${cityName.toLowerCase().replace(/[^a-z0-9]/g, "")}-1`,
      name: `${cityName} Musician-Friendly Suites & Inn`,
      type: "Band-Friendly Hotel",
      city: cityName,
      address: `Central Downtown, ${cityName}, ${stateName}`,
      estPricePerNight: "$95 - $135 / night",
      distanceToVenues: `0.4 mi to ${cityName} downtown music stages`,
      amenities: ["Overnight Van Parking", "Ground Floor Gear Load-in", "24/7 Front Desk", "Free Breakfast"],
      gearSecurityNote: "Always back your van tightly against a solid wall to block rear door entry. Carry guitars and laptops into the room.",
      bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
    },
    {
      id: `lodge-gen-${cityName.toLowerCase().replace(/[^a-z0-9]/g, "")}-2`,
      name: `${cityName} Express Highway Motel`,
      type: "Budget Motel / Inn",
      city: cityName,
      address: `Interstate Corridor, ${cityName}, ${stateName}`,
      estPricePerNight: "$69 - $89 / night",
      distanceToVenues: `1.5 mi to central venues`,
      amenities: ["Direct Exterior Room Doors", "Large Vehicle Parking", "Pet Friendly", "Fast Check-in"],
      gearSecurityNote: "Request ground-floor rooms with parking right outside your window for direct visual monitoring.",
      bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
    }
  ];
};
