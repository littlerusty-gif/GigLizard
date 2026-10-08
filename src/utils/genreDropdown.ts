/**
 * Alphabetizes genre options and injects an overarching Tribute category
 * @param {string} selectSelector - CSS selector for the genre <select> element
 */
export function updateAndAlphabetizeGenreDropdown(selectSelector: string = "select"): void {
  if (typeof document === "undefined") return;

  // Locate the genre select element
  const select = document.querySelector(selectSelector) as HTMLSelectElement | null;
  if (!select) {
    console.error(`Select element not found: ${selectSelector}`);
    return;
  }

  // Extract all existing option elements
  const options = Array.from(select.querySelectorAll("option"));
  if (!options.length) return;

  // Preserve the default placeholder option if present
  let defaultOption: { value: string; text: string } | null = null;
  const rawGenres: Array<{ value: string; text: string }> = [];

  options.forEach((opt) => {
    const val = opt.value.trim();
    const text = opt.textContent?.trim() || "";

    if (val === "" || text.toLowerCase().includes("all genre")) {
      defaultOption = { value: val, text: text };
    } else {
      rawGenres.push({ value: val, text: text });
    }
  });

  // Ensure unique genres and clean values
  const uniqueGenresMap = new Map<string, { value: string; text: string }>();
  rawGenres.forEach((g) => {
    if (!uniqueGenresMap.has(g.text.toLowerCase())) {
      uniqueGenresMap.set(g.text.toLowerCase(), g);
    }
  });

  // Add the comprehensive Tribute umbrella option if not already present
  const tributeKey = "tribute bands (all)";
  if (!uniqueGenresMap.has(tributeKey)) {
    uniqueGenresMap.set(tributeKey, {
      value: "Tribute",
      text: "Tribute Bands (All)"
    });
  }

  // Sort alphabetically by visible text (case-insensitive)
  const sortedGenres = Array.from(uniqueGenresMap.values()).sort((a, b) =>
    a.text.localeCompare(b.text, undefined, { sensitivity: "base" })
  );

  // Clear existing options
  select.innerHTML = "";

  // Re-append the default placeholder at the very top
  if (defaultOption) {
    const optEl = document.createElement("option");
    optEl.value = defaultOption.value;
    optEl.textContent = defaultOption.text;
    select.appendChild(optEl);
  }

  // Append sorted options
  sortedGenres.forEach((g) => {
    const optEl = document.createElement("option");
    optEl.value = g.value;
    optEl.textContent = g.text;
    select.appendChild(optEl);
  });

  console.log(`Dropdown sorted: ${sortedGenres.length} genre directives ready.`);
}

// Bind to window for external/test invocation if in browser
if (typeof window !== "undefined") {
  (window as any).updateAndAlphabetizeGenreDropdown = updateAndAlphabetizeGenreDropdown;
}
