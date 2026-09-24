import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { AvailableBand, Venue } from "../types";
import { SubscriberMember } from "./analyticsStore";

/**
 * Builds the dual-tab Excel Workbook containing:
 * Tab 1: Bands & Contact Emails
 * Tab 2: Venues & Contact Emails
 */
export function buildDirectoryWorkbook(bands: AvailableBand[], venues: Venue[]) {
  const wb = XLSX.utils.book_new();

  // Tab 1: Bands
  // Tab 1: Bands (Phone numbers removed from band listings)
  const bandRows = bands.map((b, index) => {
    const genres = Array.isArray(b.genres) ? b.genres.join(", ") : (b.genres || "Rock");
    return {
      "No.": index + 1,
      "Band Name": b.name || "Unnamed Artist",
      "Contact Email": b.contactEmail || "Not Listed",
      "City / Location": b.city || "Pacific Northwest",
      "Primary Genres": genres,
      "Experience Level": b.experienceLevel || "Regional Touring",
      "Official Website": b.website || "Not Listed",
      "EPK / Press Kit": b.epkUrl || "Not Listed",
      "Audio / Music Stream": b.musicUrl || "Not Listed",
      "Bio / Overview": b.bio || ""
    };
  });

  const wsBands = XLSX.utils.json_to_sheet(bandRows);

  // Column width formatting
  wsBands["!cols"] = [
    { wch: 6 },  // No.
    { wch: 30 }, // Band Name
    { wch: 32 }, // Contact Email
    { wch: 22 }, // City / Location
    { wch: 30 }, // Primary Genres
    { wch: 18 }, // Experience Level
    { wch: 28 }, // Official Website
    { wch: 36 }, // EPK
    { wch: 36 }, // Audio
    { wch: 55 }  // Bio
  ];

  XLSX.utils.book_append_sheet(wb, wsBands, "Bands");

  // Tab 2: Venues
  const venueRows = venues.map((v, index) => {
    const genres = Array.isArray(v.genres) ? v.genres.join(", ") : (v.genres || "All Genres");
    return {
      "No.": index + 1,
      "Venue Name": v.name || "Unnamed Venue",
      "Contact Email": v.contactEmail || "Not Listed",
      "Contact Phone": v.contactPhone || "Not Listed",
      "Street Address": v.address || "Not Listed",
      "City": v.city || "Not Listed",
      "Capacity": v.capacity || "N/A",
      "Genres Hosted": genres,
      "House PA System": v.hasPA ? "Yes" : "No",
      "Stage Lighting": v.hasLighting ? "Yes" : "No",
      "Official Website": v.website || "Not Listed",
      "Venue Specs & Description": v.description || ""
    };
  });

  const wsVenues = XLSX.utils.json_to_sheet(venueRows);

  wsVenues["!cols"] = [
    { wch: 6 },  // No.
    { wch: 32 }, // Venue Name
    { wch: 32 }, // Contact Email
    { wch: 18 }, // Contact Phone
    { wch: 38 }, // Address
    { wch: 20 }, // City
    { wch: 12 }, // Capacity
    { wch: 30 }, // Genres Hosted
    { wch: 16 }, // House PA
    { wch: 16 }, // Lighting
    { wch: 30 }, // Website
    { wch: 60 }  // Description
  ];

  XLSX.utils.book_append_sheet(wb, wsVenues, "Venues");

  return wb;
}

export const AUTHORIZED_OWNER_EMAIL = "littlerusty@gmail.com";

export function isOwnerAuthorizedForExport(email?: string): boolean {
  return (email || "").trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL;
}

/**
 * Builds the Excel Workbook containing all subscribers.
 */
export function buildSubscribersWorkbook(subscribers: SubscriberMember[]) {
  const wb = XLSX.utils.book_new();

  const subscriberRows = subscribers.map((s, index) => ({
    "No.": index + 1,
    "Subscriber / Name": s.name || "Unnamed Member",
    "Contact Email": s.contactEmail || "Not Listed",
    "Account Type": s.type || "Band",
    "City / Region": s.city || "Not Listed",
    "Payment Status": s.isPaid ? "Paid VIP ($9.99/mo)" : "Free Tier",
    "Subscription Plan": s.plan || "Free Community Member",
    "Account Status": s.status || "Active",
    "Signup Date": s.signupDate || "N/A",
    "Renewal / Expiry Date": s.renewalDate || "N/A",
    "PayPal Order ID": s.paypalOrderId || "N/A",
    "Experience / Notes": s.experienceLevel || s.notes || ""
  }));

  const ws = XLSX.utils.json_to_sheet(subscriberRows);

  ws["!cols"] = [
    { wch: 6 },  // No.
    { wch: 28 }, // Name
    { wch: 34 }, // Email
    { wch: 18 }, // Type
    { wch: 22 }, // City
    { wch: 24 }, // Payment Status
    { wch: 32 }, // Plan
    { wch: 16 }, // Status
    { wch: 16 }, // Signup Date
    { wch: 24 }, // Renewal Date
    { wch: 28 }, // PayPal Order ID
    { wch: 45 }  // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
  return wb;
}

/**
 * Download the Excel spreadsheet (.xlsx) of All Subscribers.
 * RESTRICTED: Only littlerusty@gmail.com is authorized
 */
export function downloadSubscribersExcel(
  subscribers: SubscriberMember[],
  filename = "GigLizard_All_Subscribers.xlsx",
  userEmail?: string
) {
  if (userEmail !== undefined && !isOwnerAuthorizedForExport(userEmail)) {
    console.error("Unauthorized subscribers export attempt:", userEmail);
    throw new Error(`Unauthorized: Subscribers export is restricted strictly to ${AUTHORIZED_OWNER_EMAIL}.`);
  }
  const wb = buildSubscribersWorkbook(subscribers);
  XLSX.writeFile(wb, filename);
}

/**
 * Download the Excel spreadsheet (.xlsx) with:
 * - Tab 1: Bands with contact emails
 * - Tab 2: Venues with contact emails
 * RESTRICTED: Only littlerusty@gmail.com is authorized
 */
export function downloadDirectoryExcel(
  bands: AvailableBand[],
  venues: Venue[],
  filename = "GigLizard_Directory_Bands_and_Venues.xlsx",
  userEmail?: string
) {
  if (userEmail !== undefined && !isOwnerAuthorizedForExport(userEmail)) {
    console.error("Unauthorized export attempt:", userEmail);
    throw new Error(`Unauthorized: Directory export files are restricted strictly to ${AUTHORIZED_OWNER_EMAIL}.`);
  }
  const wb = buildDirectoryWorkbook(bands, venues);
  XLSX.writeFile(wb, filename);
}

/**
 * Generate and download a clean PDF of the Venues Directory with contact emails.
 * RESTRICTED: Only littlerusty@gmail.com is authorized
 */
export function downloadVenuesPDF(
  venues: Venue[],
  filename = "GigLizard_Venues_Directory.pdf",
  userEmail?: string
) {
  if (userEmail !== undefined && !isOwnerAuthorizedForExport(userEmail)) {
    console.error("Unauthorized export attempt:", userEmail);
    throw new Error(`Unauthorized: Venues export is restricted strictly to ${AUTHORIZED_OWNER_EMAIL}.`);
  }
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
  });

  const pageWidth = 215.9;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // Cover / Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GIGLIZARD VENUE DIRECTORY & BOOKING CONTACTS", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Total Venues: ${venues.length}  |  Compiled: ${dateStr}  |  Official Booking Roster`, margin, 20);

  let y = 36;

  venues.forEach((v, idx) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 16;
    }

    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

    // Left accent bar
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(margin, y, 3, 24, "F");

    // Venue title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${v.name}`, margin + 6, y + 6);

    // City & Capacity badge
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const metaStr = `Cap: ${v.capacity || "N/A"} | PA: ${v.hasPA ? "Yes" : "No"} | Lighting: ${v.hasLighting ? "Yes" : "No"} | City: ${v.city || "WA/OR"}`;
    doc.text(metaStr, margin + 6, y + 11);

    // Contact Email & Phone
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(`Email: ${v.contactEmail || "Not Listed"}`, margin + 6, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Phone: ${v.contactPhone || "Not Listed"}  |  Address: ${v.address || "N/A"}`, margin + 6, y + 21.5);

    y += 28;
  });

  doc.save(filename);
}

/**
 * Generate and download a clean, structured PDF of the Bands Directory with contact emails.
 * RESTRICTED: Only littlerusty@gmail.com is authorized
 */
export function downloadBandsPDF(
  bands: AvailableBand[],
  filename = "GigLizard_Bands_Directory.pdf",
  userEmail?: string
) {
  if (userEmail !== undefined && !isOwnerAuthorizedForExport(userEmail)) {
    console.error("Unauthorized export attempt:", userEmail);
    throw new Error(`Unauthorized: Bands export is restricted strictly to ${AUTHORIZED_OWNER_EMAIL}.`);
  }
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
  });

  const pageWidth = 215.9;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // Cover Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GIGLIZARD BANDS DIRECTORY & BOOKING CONTACTS", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Total Bands: ${bands.length}  |  Compiled: ${dateStr}  |  Official Booking & Routing Roster`, margin, 20);

  let y = 36;

  bands.forEach((b, idx) => {
    // Check if new page needed
    if (y > 252) {
      doc.addPage();
      y = 16;
    }

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

    // Left accent bar
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(margin, y, 3, 22, "F");

    // Band Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${b.name}`, margin + 6, y + 5.5);

    // Genres & Tier
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const genres = Array.isArray(b.genres) ? b.genres.slice(0, 4).join(", ") : (b.genres || "Rock");
    doc.text(`Genres: ${genres} | Level: ${b.experienceLevel || "Regional"} | Location: ${b.city || "Pacific Northwest"}`, margin + 6, y + 10.5);

    // Contact Email
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`Email: ${b.contactEmail || "Not Listed"}`, margin + 6, y + 15.5);

    // Official Website & Links (Phone removed from band listings)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Official Web: ${b.website || "Not Listed"}${b.epkUrl ? ` | EPK: ${b.epkUrl}` : ""}`, margin + 6, y + 19.5);

    y += 25.5;
  });

  doc.save(filename);
}
