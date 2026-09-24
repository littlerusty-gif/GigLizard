import { TourPlan, TourStop, TourVenueStop, Venue } from "../types";
import { MUSIC_VENUES } from "../data/venues";
import { findLodgingForCity } from "./tourLodgingData";

/**
 * Builds dynamic Google Maps URL using exact addresses or cities
 */
export const buildDynamicGoogleMapsUrl = (stops: TourStop[]): string => {
  if (!stops || stops.length === 0) {
    return "https://www.google.com/maps";
  }

  const getStopLocation = (stop: TourStop): string => {
    if (stop.selectedVenue?.address && stop.selectedVenue.address.trim().length > 3) {
      return stop.selectedVenue.address.trim();
    }
    return `${stop.city}, ${stop.state || ""}`.trim();
  };

  const origin = getStopLocation(stops[0]);
  const destination = getStopLocation(stops[stops.length - 1]);

  const intermediate = stops.slice(1, -1).map(getStopLocation);
  const waypointsParam = intermediate.length > 0
    ? `&waypoints=${encodeURIComponent(intermediate.join("|"))}`
    : "";

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsParam}&travelmode=driving`;
};

/**
 * Calculates financial totals from personalized tour itinerary
 */
export const calculateTourFinancials = (stops: TourStop[]) => {
  let totalGas = 0;
  let totalLodgingCost = 0;
  let confirmedVenuesCount = 0;
  let confirmedLodgingCount = 0;

  stops.forEach(stop => {
    // Gas
    totalGas += Number(stop.estimatedGasCost) || 0;

    // Lodging
    if (stop.selectedLodging) {
      confirmedLodgingCount++;
      const costRaw = String(stop.selectedLodging.cost || "");
      const match = costRaw.match(/\d+(\.\d+)?/);
      if (match) {
        totalLodgingCost += parseFloat(match[0]);
      } else {
        totalLodgingCost += 85; // reasonable fallback
      }
    } else {
      totalLodgingCost += 85;
    }

    if (stop.selectedVenue) {
      confirmedVenuesCount++;
    }
  });

  const totalExpenses = totalGas + totalLodgingCost;

  return {
    totalGas,
    totalLodgingCost,
    totalExpenses,
    confirmedVenuesCount,
    confirmedLodgingCount
  };
};

/**
 * Formats full personalized text itinerary for clipboard and export
 */
export const formatPersonalizedItineraryText = (
  tourPlan: TourPlan, 
  bandName?: string
): string => {
  const fin = calculateTourFinancials(tourPlan.stops);
  const mapsUrl = buildDynamicGoogleMapsUrl(tourPlan.stops);
  const disclaimer = "Booking is not final! You must contact the venue to book with them directly. This site is for planning & exposure and does not book bands for any venue, hotel, or any other accommodation.";

  const lines: string[] = [];
  lines.push(`🎸 GIGLIZARD TOUR ITINERARY & RUN-OF-SHOW`);
  lines.push(`Band: ${bandName || tourPlan.bandName || "Touring Artist"}`);
  lines.push(`Route: ${tourPlan.startingCity} → ${tourPlan.destinationCity}`);
  lines.push(`Total Distance: ${tourPlan.totalDistanceMiles} miles | Est. Drive: ${tourPlan.totalDriveTime}`);
  lines.push(`Total Performance Stops: ${tourPlan.stops.length} dates (${fin.confirmedVenuesCount} confirmed stages)`);
  lines.push(`Travel Expenses Estimate: $${fin.totalGas} Fuel | $${fin.totalLodgingCost} Lodging | Total: $${fin.totalExpenses}`);
  lines.push(`Step by step instructions by Google Maps: ${mapsUrl}`);
  lines.push(`\n⚠️ IMPORTANT NOTICE:`);
  lines.push(`"${disclaimer}"`);
  lines.push(`\n=========================================`);
  lines.push(`DAY-BY-DAY SCHEDULE & RUN-OF-SHOW`);
  lines.push(`=========================================`);

  tourPlan.stops.forEach((stop, i) => {
    lines.push(`\n📍 DAY ${stop.dayNumber || i + 1}: ${stop.city}, ${stop.state}${stop.date ? ` (${stop.date})` : ""}`);
    lines.push(`• Drive: ${stop.driveTimeFromPrev} (${stop.distanceMilesFromPrev > 0 ? `${stop.distanceMilesFromPrev} mi` : "Kickoff Point"}) | Est. Fuel: $${stop.estimatedGasCost || 0}`);
    
    // Venue Info
    if (stop.selectedVenue) {
      lines.push(`• 🏢 VENUE: ${stop.selectedVenue.name}`);
      if (stop.selectedVenue.address) lines.push(`  Address: ${stop.selectedVenue.address}`);
      if (stop.selectedVenue.contactEmail || stop.selectedVenue.contactPhone) {
        lines.push(`  Contact: ${stop.selectedVenue.contactEmail || ""} ${stop.selectedVenue.contactPhone || ""}`.trim());
      }
      lines.push(`  Schedule: Load-in: ${stop.selectedVenue.loadInTime || "5:00 PM"} | Soundcheck: ${stop.selectedVenue.soundcheckTime || "6:30 PM"} | Doors: ${stop.selectedVenue.doorsTime || "7:30 PM"} | Set: ${stop.selectedVenue.setTime || "9:00 PM"}`);
      if (stop.selectedVenue.ticketPrice) lines.push(`  Tickets / Door: ${stop.selectedVenue.ticketPrice}`);
      if (stop.selectedVenue.notes) lines.push(`  Venue Notes: ${stop.selectedVenue.notes}`);
    } else {
      lines.push(`• 🏢 VENUE: Pending Selection (Suggested: ${stop.suggestedVenues.map(v => v.name).slice(0, 2).join(", ")})`);
    }

    // Lodging Info
    if (stop.selectedLodging) {
      lines.push(`• 🛏️ LODGING: ${stop.selectedLodging.name} (${stop.selectedLodging.type || "Stay"})`);
      if (stop.selectedLodging.address) lines.push(`  Address: ${stop.selectedLodging.address}`);
      if (stop.selectedLodging.cost) lines.push(`  Cost: $${stop.selectedLodging.cost}`);
      if (stop.selectedLodging.confirmationNumber) lines.push(`  Confirmation #: ${stop.selectedLodging.confirmationNumber}`);
      if (stop.selectedLodging.gearSecurityNote) lines.push(`  Van/Gear Security: ${stop.selectedLodging.gearSecurityNote}`);
    } else {
      lines.push(`• 🛏️ LODGING: ${stop.lodgingNotes || "Local band-friendly accommodations"}`);
    }

    if (stop.customNotes) {
      lines.push(`• 📝 Notes: ${stop.customNotes}`);
    }
  });

  lines.push(`\n=========================================`);
  lines.push(`DISCLAIMER:`);
  lines.push(`"${disclaimer}"`);
  lines.push(`\nGenerated by GigLizard - Tour & Gig Prep Suite`);

  return lines.join("\n");
};

/**
 * Generates fallback tour plan if backend AI is unavailable
 */
export const generateFallbackPlan = (
  start: string, 
  dest: string,
  intermediateDestinations: string[] = []
): TourPlan => {
  const customVenues = (() => {
    const saved = localStorage.getItem("custom_venues_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  })();
  const allVenues = [...MUSIC_VENUES, ...customVenues];

  const findVenuesForCity = (cityName: string): TourVenueStop[] => {
    const matched = allVenues.filter(v => 
      v.city.toLowerCase().includes(cityName.toLowerCase()) || 
      cityName.toLowerCase().includes(v.city.toLowerCase())
    );
    if (matched.length > 0) {
      return matched.map(v => ({
        id: v.id,
        name: v.name,
        city: v.city,
        address: v.address,
        capacity: v.capacity,
        genres: v.genres,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        hasPA: v.hasPA,
        hasLighting: v.hasLighting,
        description: v.description,
        website: v.website
      }));
    }
    return [
      {
        name: `${cityName} Music Hall & Stage`,
        city: cityName,
        address: `Downtown ${cityName}`,
        capacity: 180,
        genres: ["Live Music", "Indie Rock", "Punk"],
        contactEmail: `booking@${cityName.toLowerCase().replace(/[^a-z0-9]/g, "")}stage.com`,
        contactPhone: "Inquire",
        hasPA: true,
        hasLighting: true,
        description: `Vibrant live music stage located in central ${cityName}.`
      }
    ];
  };

  // Build stop list based on user-provided intermediate stops or standard presets
  const citiesChain: string[] = [start, ...intermediateDestinations.filter(c => c.trim().length > 0), dest];
  
  // If user just had standard start & dest with no intermediates
  let stops: TourStop[] = [];

  if (citiesChain.length === 2 && start.toLowerCase().includes("bellingham") && dest.toLowerCase().includes("medford")) {
    stops = [
      {
        id: "stop-1",
        stopName: "Tour Kickoff: Bellingham",
        city: "Bellingham",
        state: "WA",
        dayNumber: 1,
        driveTimeFromPrev: "0 hrs (Starting Point)",
        distanceMilesFromPrev: 0,
        routeHighlight: "Assemble tour van and stage gear. Load-in at downtown Bellingham.",
        localSceneNotes: "Passionate college and indie-rock crowds. Great early evening turnout.",
        estimatedGasCost: 0,
        lodgingNotes: "Quiet college town with great secure lodging near Cornwall Ave and Chuckanut Drive.",
        lodgingOptions: findLodgingForCity("Bellingham", "WA"),
        suggestedVenues: findVenuesForCity("Bellingham"),
        selectedVenue: {
          name: "The Wild Buffalo House of Music",
          city: "Bellingham",
          address: "208 W Holly St, Bellingham, WA 98225",
          loadInTime: "5:00 PM",
          soundcheckTime: "6:30 PM",
          doorsTime: "7:30 PM",
          setTime: "9:00 PM - 10:30 PM",
          ticketPrice: "$12 Adv / $15 Door"
        },
        selectedLodging: {
          name: "Hotel Leo & Historic Suites",
          type: "Band-Friendly Hotel",
          address: "1224 Cornwall Ave, Bellingham, WA",
          cost: 125,
          gearSecurityNote: "Park in rear well-lit camera monitored lot against brick wall."
        }
      },
      {
        id: "stop-2",
        stopName: "Leg 1: Seattle Metro",
        city: "Seattle",
        state: "WA",
        dayNumber: 2,
        driveTimeFromPrev: "1 hr 35 mins",
        distanceMilesFromPrev: 89,
        routeHighlight: "Head south on I-5 S past Mount Vernon and Everett into central Seattle.",
        localSceneNotes: "Historic music hub. High standards for audio riders and stage punch.",
        estimatedGasCost: 28,
        lodgingNotes: "Belltown hotels allow walking to multiple venues. Never leave gear in vans unattended in city lots.",
        lodgingOptions: findLodgingForCity("Seattle", "WA"),
        suggestedVenues: findVenuesForCity("Seattle"),
        selectedVenue: {
          name: "The Subterranean Cellar",
          city: "Seattle",
          address: "412 Pike St, Seattle, WA 98101",
          loadInTime: "5:30 PM",
          soundcheckTime: "6:45 PM",
          doorsTime: "8:00 PM",
          setTime: "9:30 PM - 11:00 PM",
          ticketPrice: "$15 Adv / $18 Door"
        },
        selectedLodging: {
          name: "The Belltown Inn",
          type: "Band-Friendly Hotel",
          address: "2301 3rd Ave, Seattle, WA",
          cost: 139,
          gearSecurityNote: "Unload high-value instruments into rooms. Staff will assist with gear elevator."
        }
      },
      {
        id: "stop-3",
        stopName: "Leg 2: Tacoma Sound",
        city: "Tacoma",
        state: "WA",
        dayNumber: 3,
        driveTimeFromPrev: "45 mins",
        distanceMilesFromPrev: 34,
        routeHighlight: "Quick southward cruise down I-5 S towards Commencement Bay.",
        localSceneNotes: "Thriving DIY underground and energetic punk/grunge fanbase.",
        estimatedGasCost: 15,
        lodgingNotes: "McMenamins Elks Temple offers rooms directly above the concert ballroom.",
        lodgingOptions: findLodgingForCity("Tacoma", "WA"),
        suggestedVenues: findVenuesForCity("Tacoma")
      },
      {
        id: "stop-4",
        stopName: "Leg 3: Portland Bridge City",
        city: "Portland",
        state: "OR",
        dayNumber: 4,
        driveTimeFromPrev: "2 hrs 15 mins",
        distanceMilesFromPrev: 142,
        routeHighlight: "Follow I-5 S across the Columbia River Interstate Bridge into Portland.",
        localSceneNotes: "Crucial indie music destination. Emphasize merch booth and local co-bills.",
        estimatedGasCost: 45,
        lodgingNotes: "The Jupiter Hotel on East Burnside is the West Coast's most renowned band-friendly lodging stop.",
        lodgingOptions: findLodgingForCity("Portland", "OR"),
        suggestedVenues: findVenuesForCity("Portland")
      },
      {
        id: "stop-5",
        stopName: "Leg 4: Eugene College Circuit",
        city: "Eugene",
        state: "OR",
        dayNumber: 5,
        driveTimeFromPrev: "1 hr 50 mins",
        distanceMilesFromPrev: 110,
        routeHighlight: "I-5 South through Willamette Valley past Salem and Albany.",
        localSceneNotes: "Very supportive student audiences and enthusiastic live dancers.",
        estimatedGasCost: 35,
        lodgingNotes: "Downtown hotels near 6th Ave put you within walking distance of McDonald Theatre and WOW Hall.",
        lodgingOptions: findLodgingForCity("Eugene", "OR"),
        suggestedVenues: findVenuesForCity("Eugene")
      },
      {
        id: "stop-6",
        stopName: "Tour Finale: Medford",
        city: "Medford",
        state: "OR",
        dayNumber: 6,
        driveTimeFromPrev: "2 hrs 40 mins",
        distanceMilesFromPrev: 165,
        routeHighlight: "I-5 South winding through the scenic Rogue River Valley into Medford.",
        localSceneNotes: "Southern Oregon's live music anchor. Welcoming crowds for touring acts.",
        estimatedGasCost: 52,
        lodgingNotes: "Rogue Regency Inn has oversized van and trailer parking spaces with late check-in.",
        lodgingOptions: findLodgingForCity("Medford", "OR"),
        suggestedVenues: findVenuesForCity("Medford")
      }
    ];
  } else {
    // Generate stops for whatever chain of cities user entered
    stops = citiesChain.map((cityNameRaw, index) => {
      const parts = cityNameRaw.split(",");
      const cityClean = parts[0].trim();
      const stateClean = parts[1]?.trim() || (index === 0 ? "WA" : "OR");
      const isStart = index === 0;
      const isEnd = index === citiesChain.length - 1;

      return {
        id: `stop-${index + 1}`,
        stopName: isStart ? `Tour Kickoff: ${cityClean}` : isEnd ? `Tour Finale: ${cityClean}` : `Leg ${index}: ${cityClean}`,
        city: cityClean,
        state: stateClean,
        dayNumber: index + 1,
        driveTimeFromPrev: isStart ? "0 hrs (Kickoff)" : "2 hrs 30 mins",
        distanceMilesFromPrev: isStart ? 0 : 130 + index * 15,
        routeHighlight: isStart 
          ? `Launch your tour from ${cityClean}. Load gear and perform soundchecks.` 
          : `Scenic highway corridor connecting into ${cityClean}.`,
        localSceneNotes: `Active music community and live performance culture in ${cityClean}.`,
        estimatedGasCost: isStart ? 0 : 40,
        lodgingNotes: "Dedicated band-friendly hotels with secure van courtyards are available.",
        lodgingOptions: findLodgingForCity(cityClean, stateClean),
        suggestedVenues: findVenuesForCity(cityClean)
      };
    });
  }

  const totalDist = stops.reduce((acc, s) => acc + s.distanceMilesFromPrev, 0);

  return {
    startingCity: start,
    destinationCity: dest,
    intermediateDestinations,
    totalDistanceMiles: totalDist,
    totalDriveTime: `${Math.round(totalDist / 48)} hrs ${Math.round((totalDist % 48) * 1.2)} mins`,
    routeDescription: `Optimal tour routing connecting ${start} through ${dest} with scheduled performance stages and band-friendly lodging.`,
    stops,
    tourTips: [
      "Lodging Safety: Always back your touring van tightly against a concrete/brick wall to physically block rear door access overnight.",
      "Instrument Safety: Carry irreplaceable guitars, snare drums, and pedalboards into hotel rooms rather than leaving them in vehicles.",
      "Plan morning load-outs by 10:00 AM to allow plenty of buffer for highway traffic and soundchecks.",
      "Keep digital and printed copies of your Stage Plot and Tech Rider in the van glove compartment.",
      "Check regional mountain pass condition webcams before winter and late-autumn tour runs."
    ],
    googleMapsDirectionsUrl: buildDynamicGoogleMapsUrl(stops)
  };
};
