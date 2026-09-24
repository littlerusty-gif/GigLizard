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

  if (cityLower.includes("medford")) {
    return [
      {
        id: "lodge-med-1",
        name: "Rogue Regency Inn & Conference Center",
        type: "Band-Friendly Hotel",
        city: "Medford",
        address: "2300 Biddle Rd, Medford, OR",
        estPricePerNight: "$92 - $115 / night",
        distanceToVenues: "1.2 mi to downtown Medford live stages",
        amenities: ["Oversized Van / Trailer Parking Lot", "Hot Breakfast Included", "Indoor Pool & Spa", "24/7 Desk"],
        gearSecurityNote: "Very friendly to touring bands and crews with equipment trailers. Extra-large parking bays with perimeter lights.",
        bookingSearchUrl: `https://www.google.com/travel/hotels/${encodedCity}`
      },
      {
        id: "lodge-med-2",
        name: "City Center Motel Medford",
        type: "Budget Motel / Inn",
        city: "Medford",
        address: "479 N Central Ave, Medford, OR",
        estPricePerNight: "$65 - $80 / night",
        distanceToVenues: "0.3 mi to Holly Theatre and local bars",
        amenities: ["Ground-Floor Access", "Low Budget Friendly", "Quiet Courtyard Parking"],
        gearSecurityNote: "Simple classic drive-up motel. Park your vehicle right in front of your entrance door.",
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
